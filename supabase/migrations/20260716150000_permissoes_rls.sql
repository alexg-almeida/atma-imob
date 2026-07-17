-- =============================================================================
-- Atma CRM · Permissões e RLS
-- 1) Trigger: auth.users → core_perfis
-- 2) Seed de core_modulos
-- 3) Coluna core_permissoes.permissoes_extras (ações especiais: ver_todos,
--    financeiro) + função tem_permissao()
-- 4) Policies de RLS em todas as tabelas
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Perfil automático ao criar usuário no Auth
-- -----------------------------------------------------------------------------
create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.core_perfis (id, nome_completo, created_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome_completo', new.email, 'Usuário'),
    new.id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_novo_usuario();

-- -----------------------------------------------------------------------------
-- 2) Seed dos módulos
-- -----------------------------------------------------------------------------
insert into public.core_modulos (nome, slug)
values
  ('Core', 'core'),
  ('Leads', 'leads'),
  ('Imóveis', 'imoveis'),
  ('Proprietários', 'proprietarios'),
  ('Parceiros', 'parceiros')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- 3) Ações especiais por módulo + função de checagem de permissão
--    permissoes_extras: array jsonb de ações além do CRUD, ex.:
--    ["ver_todos"] no módulo leads, ["financeiro"] no módulo proprietarios.
-- -----------------------------------------------------------------------------
alter table public.core_permissoes
  add column if not exists permissoes_extras jsonb not null default '[]'::jsonb;

create or replace function public.tem_permissao(p_modulo_slug text, p_acao text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from core_permissoes cp
    join core_modulos m on m.id = cp.modulo_id
    join core_perfis pf on pf.id = cp.perfil_id
    where cp.perfil_id = auth.uid()
      and m.slug = p_modulo_slug
      and cp.ativo
      and m.ativo
      and pf.ativo
      and case p_acao
        when 'visualizar' then cp.pode_visualizar
        when 'criar' then cp.pode_criar
        when 'editar' then cp.pode_editar
        when 'excluir' then cp.pode_excluir
        else cp.permissoes_extras ? p_acao
      end
  );
$$;

-- Parceiro vinculado ao usuário autenticado (para escopo de leads por corretor).
-- security definer: precisa ler parceiros sem passar pela RLS de parceiros.
create or replace function public.parceiro_do_usuario()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from parceiros
  where perfil_id = auth.uid()
    and ativo
  limit 1;
$$;

revoke execute on function public.tem_permissao(text, text) from public, anon;
grant execute on function public.tem_permissao(text, text) to authenticated, service_role;
revoke execute on function public.parceiro_do_usuario() from public, anon;
grant execute on function public.parceiro_do_usuario() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 4) Policies
-- -----------------------------------------------------------------------------

-- 4a) Tabelas com regra padrão do módulo (CRUD ↔ tem_permissao)
do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('core_modulos', 'core'),
      ('core_permissoes', 'core'),
      ('parceiros', 'parceiros'),
      ('proprietarios', 'proprietarios'),
      ('imoveis_tipos', 'imoveis'),
      ('imoveis', 'imoveis'),
      ('imoveis_proprietarios', 'imoveis'),
      ('imoveis_fotos', 'imoveis'),
      ('imoveis_documentos', 'imoveis'),
      ('imoveis_fichas_captacao', 'imoveis'),
      ('leads_origens', 'leads'),
      ('leads_etapas', 'leads'),
      ('leads_interacoes', 'leads')
    ) as t (tabela, slug)
  loop
    execute format(
      $p$create policy %1$I_select on public.%1$I for select to authenticated
        using ((select tem_permissao(%2$L, 'visualizar')))$p$,
      rec.tabela, rec.slug
    );
    execute format(
      $p$create policy %1$I_insert on public.%1$I for insert to authenticated
        with check ((select tem_permissao(%2$L, 'criar')))$p$,
      rec.tabela, rec.slug
    );
    execute format(
      $p$create policy %1$I_update on public.%1$I for update to authenticated
        using ((select tem_permissao(%2$L, 'editar')))
        with check ((select tem_permissao(%2$L, 'editar')))$p$,
      rec.tabela, rec.slug
    );
    execute format(
      $p$create policy %1$I_delete on public.%1$I for delete to authenticated
        using ((select tem_permissao(%2$L, 'excluir')))$p$,
      rec.tabela, rec.slug
    );
  end loop;
end;
$$;

-- 4b) core_perfis: usuário sempre vê/edita o próprio perfil
create policy core_perfis_select on public.core_perfis
  for select to authenticated
  using (id = (select auth.uid()) or (select tem_permissao('core', 'visualizar')));

create policy core_perfis_insert on public.core_perfis
  for insert to authenticated
  with check ((select tem_permissao('core', 'criar')));

create policy core_perfis_update on public.core_perfis
  for update to authenticated
  using (id = (select auth.uid()) or (select tem_permissao('core', 'editar')))
  with check (id = (select auth.uid()) or (select tem_permissao('core', 'editar')));

create policy core_perfis_delete on public.core_perfis
  for delete to authenticated
  using ((select tem_permissao('core', 'excluir')));

-- 4c) leads: corretor só enxerga (e altera) os próprios leads, salvo 'ver_todos'
create policy leads_select on public.leads
  for select to authenticated
  using (
    (select tem_permissao('leads', 'visualizar'))
    and (
      (select tem_permissao('leads', 'ver_todos'))
      or corretor_id = (select parceiro_do_usuario())
    )
  );

create policy leads_insert on public.leads
  for insert to authenticated
  with check ((select tem_permissao('leads', 'criar')));

create policy leads_update on public.leads
  for update to authenticated
  using (
    (select tem_permissao('leads', 'editar'))
    and (
      (select tem_permissao('leads', 'ver_todos'))
      or corretor_id = (select parceiro_do_usuario())
    )
  )
  with check (
    (select tem_permissao('leads', 'editar'))
    and (
      (select tem_permissao('leads', 'ver_todos'))
      or corretor_id = (select parceiro_do_usuario())
    )
  );

create policy leads_delete on public.leads
  for delete to authenticated
  using (
    (select tem_permissao('leads', 'excluir'))
    and (
      (select tem_permissao('leads', 'ver_todos'))
      or corretor_id = (select parceiro_do_usuario())
    )
  );

-- 4d) proprietarios_dados_bancarios: exige a ação especial 'financeiro'
create policy proprietarios_dados_bancarios_select on public.proprietarios_dados_bancarios
  for select to authenticated
  using ((select tem_permissao('proprietarios', 'financeiro')));

create policy proprietarios_dados_bancarios_insert on public.proprietarios_dados_bancarios
  for insert to authenticated
  with check (
    (select tem_permissao('proprietarios', 'financeiro'))
    and (select tem_permissao('proprietarios', 'criar'))
  );

create policy proprietarios_dados_bancarios_update on public.proprietarios_dados_bancarios
  for update to authenticated
  using (
    (select tem_permissao('proprietarios', 'financeiro'))
    and (select tem_permissao('proprietarios', 'editar'))
  )
  with check (
    (select tem_permissao('proprietarios', 'financeiro'))
    and (select tem_permissao('proprietarios', 'editar'))
  );

create policy proprietarios_dados_bancarios_delete on public.proprietarios_dados_bancarios
  for delete to authenticated
  using (
    (select tem_permissao('proprietarios', 'financeiro'))
    and (select tem_permissao('proprietarios', 'excluir'))
  );
