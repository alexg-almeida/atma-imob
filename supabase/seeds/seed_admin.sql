-- =============================================================================
-- Atma CRM · Seed: usuário administrador com todas as permissões
-- Uso: psql "$SUPABASE_DB_URL" -v email='...' -v senha='...' -v nome='...' \
--        -f supabase/seeds/seed_admin.sql
-- Idempotente: se o e-mail já existe, apenas garante o perfil e as permissões.
-- =============================================================================

\set ON_ERROR_STOP on

-- Variáveis do psql não interpolam dentro de do $$; passa via set_config.
select set_config('seed.email', :'email', false);
select set_config('seed.senha', :'senha', false);
select set_config('seed.nome', :'nome', false);

do $$
declare
  v_email text := current_setting('seed.email');
  v_senha text := current_setting('seed.senha');
  v_nome  text := current_setting('seed.nome');
  v_user_id uuid;
  rec record;
begin
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_senha, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nome_completo', v_nome),
      now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      'email',
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true
      ),
      now(), now(), now()
    );

    raise notice 'Usuário % criado (id %).', v_email, v_user_id;
  else
    raise notice 'Usuário % já existe (id %); garantindo perfil e permissões.', v_email, v_user_id;
  end if;

  -- O trigger on_auth_user_created cria o perfil; garante caso o usuário
  -- seja anterior ao trigger.
  insert into public.core_perfis (id, nome_completo, created_by)
  values (v_user_id, v_nome, v_user_id)
  on conflict (id) do update set nome_completo = excluded.nome_completo, ativo = true;

  -- Todas as permissões em todos os módulos + ações especiais por módulo.
  for rec in select id, slug from public.core_modulos where ativo loop
    insert into public.core_permissoes (
      perfil_id, modulo_id,
      pode_visualizar, pode_criar, pode_editar, pode_excluir,
      permissoes_extras, created_by
    ) values (
      v_user_id, rec.id,
      true, true, true, true,
      case rec.slug
        when 'leads' then '["ver_todos"]'::jsonb
        when 'proprietarios' then '["financeiro"]'::jsonb
        else '[]'::jsonb
      end,
      v_user_id
    )
    on conflict (perfil_id, modulo_id) do update set
      pode_visualizar = true,
      pode_criar = true,
      pode_editar = true,
      pode_excluir = true,
      permissoes_extras = excluded.permissoes_extras,
      ativo = true;
  end loop;
end;
$$;
