-- =============================================================================
-- Atma CRM · Tipos de imóvel (seed) + buckets de Storage com policies
-- Bucket 'imoveis' (fotos): leitura pública (material de divulgação);
--   escrita/remoção exige tem_permissao('imoveis','editar').
-- Bucket 'imoveis-documentos' (PDFs): privado; leitura exige
--   tem_permissao('imoveis','visualizar') via URL assinada; escrita/remoção
--   exige tem_permissao('imoveis','editar').
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Seed: tipos de imóvel
-- -----------------------------------------------------------------------------
insert into public.imoveis_tipos (nome)
values
  ('Apartamento'),
  ('Casa'),
  ('Sobrado'),
  ('Cobertura'),
  ('Studio'),
  ('Terreno'),
  ('Comercial'),
  ('Chácara')
on conflict (nome) do nothing;

-- -----------------------------------------------------------------------------
-- Buckets
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('imoveis', 'imoveis', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('imoveis-documentos', 'imoveis-documentos', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Policies de storage.objects
-- -----------------------------------------------------------------------------

-- Fotos: leitura para qualquer um (bucket público)
create policy "imoveis_fotos_select"
  on storage.objects for select
  using (bucket_id = 'imoveis');

create policy "imoveis_fotos_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'imoveis'
    and (select public.tem_permissao('imoveis', 'editar'))
  );

create policy "imoveis_fotos_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'imoveis'
    and (select public.tem_permissao('imoveis', 'editar'))
  );

create policy "imoveis_fotos_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'imoveis'
    and (select public.tem_permissao('imoveis', 'editar'))
  );

-- Documentos: leitura restrita a quem visualiza imóveis
create policy "imoveis_documentos_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'imoveis-documentos'
    and (select public.tem_permissao('imoveis', 'visualizar'))
  );

create policy "imoveis_documentos_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'imoveis-documentos'
    and (select public.tem_permissao('imoveis', 'editar'))
  );

create policy "imoveis_documentos_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'imoveis-documentos'
    and (select public.tem_permissao('imoveis', 'editar'))
  );
