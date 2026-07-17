-- =============================================================================
-- Atma CRM · Leads: seed de etapas/origens, bucket de fotos e reforço de RLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Seed: etapas do funil (ordem define a coluna no Kanban)
-- -----------------------------------------------------------------------------
insert into public.leads_etapas (nome, ordem)
values
  ('Novo', 1),
  ('Em atendimento', 2),
  ('Visita', 3),
  ('Proposta', 4),
  ('Fechado', 5),
  ('Perdido', 6)
on conflict (nome) do nothing;

-- -----------------------------------------------------------------------------
-- Seed: origens de captação
-- -----------------------------------------------------------------------------
insert into public.leads_origens (nome)
values
  ('Site Atma'),
  ('Portal imobiliário'),
  ('Indicação'),
  ('WhatsApp'),
  ('Instagram'),
  ('Evento')
on conflict (nome) do nothing;

-- -----------------------------------------------------------------------------
-- Bucket de fotos de leads (público para leitura, como o de imóveis)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('leads', 'leads', true)
on conflict (id) do nothing;

create policy "leads_fotos_select"
  on storage.objects for select
  using (bucket_id = 'leads');

create policy "leads_fotos_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'leads'
    and (
      (select public.tem_permissao('leads', 'criar'))
      or (select public.tem_permissao('leads', 'editar'))
    )
  );

create policy "leads_fotos_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'leads'
    and (
      (select public.tem_permissao('leads', 'criar'))
      or (select public.tem_permissao('leads', 'editar'))
    )
  );

create policy "leads_fotos_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'leads'
    and (
      (select public.tem_permissao('leads', 'criar'))
      or (select public.tem_permissao('leads', 'editar'))
    )
  );

-- -----------------------------------------------------------------------------
-- Reforço de RLS: ao criar um lead, um corretor sem 'ver_todos' só pode
-- atribuí-lo a si mesmo (evita contornar o escopo por corretor via INSERT).
-- -----------------------------------------------------------------------------
drop policy leads_insert on public.leads;

create policy leads_insert on public.leads
  for insert to authenticated
  with check (
    (select tem_permissao('leads', 'criar'))
    and (
      (select tem_permissao('leads', 'ver_todos'))
      or corretor_id = (select parceiro_do_usuario())
    )
  );
