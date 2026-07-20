-- Converte imoveis_documentos.tipo_documento de texto livre para enum,
-- adicionando 'ficha_captacao' às opções. Valores legados (rótulos em
-- pt-BR gravados pelo front) são mapeados para os slugs; NULL permanece
-- NULL; qualquer outro valor desconhecido vira 'outros'.

create type public.imovel_documento_tipo as enum (
  'matricula',
  'iptu',
  'contrato',
  'escritura',
  'procuracao',
  'ficha_captacao',
  'outros'
);

alter table public.imoveis_documentos
  alter column tipo_documento drop default;

alter table public.imoveis_documentos
  alter column tipo_documento type public.imovel_documento_tipo
  using (
    case
      when tipo_documento is null then null
      when tipo_documento = 'Matrícula' then 'matricula'
      when tipo_documento = 'IPTU' then 'iptu'
      when tipo_documento = 'Contrato' then 'contrato'
      when tipo_documento = 'Escritura' then 'escritura'
      when tipo_documento = 'Procuração' then 'procuracao'
      else 'outros'
    end
  )::public.imovel_documento_tipo;

alter table public.imoveis_documentos
  alter column tipo_documento set default 'outros';
