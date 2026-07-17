-- =============================================================================
-- Atma CRM · Bucket de PDFs da Ficha de Captação
-- Público para leitura: o link é compartilhado por WhatsApp/e-mail com o
-- proprietário, que não é usuário autenticado do sistema.
-- Escrita/remoção exige tem_permissao('imoveis','editar').
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('imoveis-fichas', 'imoveis-fichas', true)
on conflict (id) do nothing;

create policy "imoveis_fichas_select"
  on storage.objects for select
  using (bucket_id = 'imoveis-fichas');

create policy "imoveis_fichas_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'imoveis-fichas'
    and (select public.tem_permissao('imoveis', 'editar'))
  );

create policy "imoveis_fichas_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'imoveis-fichas'
    and (select public.tem_permissao('imoveis', 'editar'))
  );

create policy "imoveis_fichas_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'imoveis-fichas'
    and (select public.tem_permissao('imoveis', 'editar'))
  );
