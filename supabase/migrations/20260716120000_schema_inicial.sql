-- =============================================================================
-- Atma CRM · Migration inicial: modelagem completa (core, leads, proprietarios,
-- parceiros, imoveis).
-- RLS habilitado em TODAS as tabelas SEM policies (bloqueia tudo até a próxima
-- migration definir as policies).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.parceiro_tipo as enum ('corretor', 'captador', 'ambos');
create type public.imovel_finalidade as enum ('venda', 'locacao', 'ambos');
create type public.imovel_status as enum ('ativo', 'reservado', 'vendido', 'alugado', 'inativo');
create type public.ficha_captacao_status as enum ('rascunho', 'gerada', 'enviada');

-- -----------------------------------------------------------------------------
-- Função genérica de updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- MÓDULO CORE
-- =============================================================================

-- Perfil de usuário do sistema (1:1 com auth.users)
create table public.core_perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text not null,
  telefone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create table public.core_modulos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique, -- leads, imoveis, proprietarios, parceiros, core
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create table public.core_permissoes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.core_perfis (id) on delete cascade,
  modulo_id uuid not null references public.core_modulos (id) on delete cascade,
  pode_visualizar boolean not null default false,
  pode_criar boolean not null default false,
  pode_editar boolean not null default false,
  pode_excluir boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true,
  unique (perfil_id, modulo_id)
);

create index core_permissoes_perfil_id_idx on public.core_permissoes (perfil_id);
create index core_permissoes_modulo_id_idx on public.core_permissoes (modulo_id);

-- =============================================================================
-- MÓDULO PARCEIROS (antes de leads/imoveis, que referenciam parceiros)
-- =============================================================================

create table public.parceiros (
  id uuid primary key default gen_random_uuid(),
  tipo public.parceiro_tipo not null,
  nome_completo text not null,
  creci text,
  comissao_padrao_percentual numeric(5, 2),
  email text,
  whatsapp text,
  telefone text,
  banco text,
  agencia text,
  conta text,
  tipo_conta text,
  pix text,
  -- Preenchido apenas se o parceiro também for usuário do sistema
  perfil_id uuid references public.core_perfis (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create index parceiros_perfil_id_idx on public.parceiros (perfil_id);
create index parceiros_tipo_idx on public.parceiros (tipo);

-- =============================================================================
-- MÓDULO PROPRIETARIOS
-- =============================================================================

create table public.proprietarios (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  cpf text unique,
  doc_identidade_numero text,
  doc_identidade_tipo text,
  doc_identidade_orgao_exp text,
  email text,
  whatsapp text,
  telefone text,
  telefone_comercial text,
  endereco_completo text,
  endereco_comercial text,
  data_nascimento date,
  estado_civil text,
  profissao text,
  empresa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create table public.proprietarios_dados_bancarios (
  id uuid primary key default gen_random_uuid(),
  proprietario_id uuid not null references public.proprietarios (id) on delete cascade,
  banco text,
  agencia text,
  conta text,
  tipo_conta text,
  pix text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create index proprietarios_dados_bancarios_proprietario_id_idx
  on public.proprietarios_dados_bancarios (proprietario_id);

-- =============================================================================
-- MÓDULO IMOVEIS
-- =============================================================================

create table public.imoveis_tipos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique, -- casa, apartamento, terreno, comercial...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create table public.imoveis (
  id uuid primary key default gen_random_uuid(),
  tipo_id uuid not null references public.imoveis_tipos (id),
  finalidade public.imovel_finalidade not null,
  status public.imovel_status not null default 'ativo',
  descricao text,
  endereco_completo text,
  cidade text,
  estado text,
  cep text,
  area_interna numeric(10, 2),
  area_externa numeric(10, 2),
  area_lote numeric(10, 2),
  andar smallint,
  salas smallint,
  quartos smallint,
  suites smallint,
  banheiros smallint,
  varandas smallint,
  vagas smallint,
  numero_vaga text,
  tipo_vaga text,
  piso_acabamento text,
  fachada text,
  comodidades_internas jsonb not null default '[]'::jsonb,
  instalacoes jsonb not null default '[]'::jsonb,
  lazer jsonb not null default '[]'::jsonb,
  inscricao_imobiliaria text,
  data_captacao date,
  comissao_percentual numeric(5, 2),
  observacoes text,
  valor_condominio numeric(14, 2),
  outras_taxas numeric(14, 2),
  numero_matricula text,
  captador_id uuid references public.parceiros (id),
  valor_venda numeric(14, 2),
  valor_locacao numeric(14, 2),
  iptu_mensal numeric(14, 2),
  repasse_iptu boolean not null default false,
  taxa_lixo numeric(14, 2),
  parcela_taxa_lixo text,
  frase_destaque text,
  diferenciais jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create index imoveis_tipo_id_idx on public.imoveis (tipo_id);
create index imoveis_captador_id_idx on public.imoveis (captador_id);
create index imoveis_status_idx on public.imoveis (status);
create index imoveis_finalidade_idx on public.imoveis (finalidade);
create index imoveis_cidade_idx on public.imoveis (cidade);

create table public.imoveis_proprietarios (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  proprietario_id uuid not null references public.proprietarios (id) on delete cascade,
  percentual_participacao numeric(5, 2),
  principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true,
  unique (imovel_id, proprietario_id)
);

create index imoveis_proprietarios_imovel_id_idx on public.imoveis_proprietarios (imovel_id);
create index imoveis_proprietarios_proprietario_id_idx on public.imoveis_proprietarios (proprietario_id);

create table public.imoveis_fotos (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  url text not null,
  ordem integer not null default 0,
  capa boolean not null default false,
  destaque text, -- legenda curta opcional
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create index imoveis_fotos_imovel_id_idx on public.imoveis_fotos (imovel_id);

create table public.imoveis_documentos (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  url text not null,
  nome_arquivo text not null,
  tipo_documento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create index imoveis_documentos_imovel_id_idx on public.imoveis_documentos (imovel_id);

create table public.imoveis_fichas_captacao (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis (id) on delete cascade,
  status public.ficha_captacao_status not null default 'rascunho',
  link_token text unique,
  enviado_em timestamptz,
  pdf_final_url text,
  provedor_assinatura text,
  assinatura_url text,
  assinado_em timestamptz,
  hash_documento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create index imoveis_fichas_captacao_imovel_id_idx on public.imoveis_fichas_captacao (imovel_id);
create index imoveis_fichas_captacao_status_idx on public.imoveis_fichas_captacao (status);

-- =============================================================================
-- MÓDULO LEADS
-- =============================================================================

create table public.leads_origens (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique, -- site, portal, indicação, whatsapp...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create table public.leads_etapas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique, -- novo, em atendimento, visita, proposta, fechado, perdido
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  foto_url text,
  whatsapp text,
  telefone_1 text,
  telefone_2 text,
  email text,
  cidade text,
  estado text,
  cep text,
  endereco_completo text,
  origem_id uuid references public.leads_origens (id),
  etapa_id uuid references public.leads_etapas (id),
  corretor_id uuid references public.parceiros (id),
  imovel_interesse_id uuid references public.imoveis (id),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create index leads_origem_id_idx on public.leads (origem_id);
create index leads_etapa_id_idx on public.leads (etapa_id);
create index leads_corretor_id_idx on public.leads (corretor_id);
create index leads_imovel_interesse_id_idx on public.leads (imovel_interesse_id);
create index leads_cidade_idx on public.leads (cidade);

create table public.leads_interacoes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  tipo text not null, -- ligação, whatsapp, e-mail, visita...
  descricao text,
  data_interacao timestamptz not null default now(),
  usuario_id uuid references public.core_perfis (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create index leads_interacoes_lead_id_idx on public.leads_interacoes (lead_id);
create index leads_interacoes_usuario_id_idx on public.leads_interacoes (usuario_id);
create index leads_interacoes_data_interacao_idx on public.leads_interacoes (data_interacao);

-- =============================================================================
-- Trigger de updated_at + RLS em todas as tabelas (sem policies por enquanto)
-- =============================================================================
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'core_perfis',
    'core_modulos',
    'core_permissoes',
    'parceiros',
    'proprietarios',
    'proprietarios_dados_bancarios',
    'imoveis_tipos',
    'imoveis',
    'imoveis_proprietarios',
    'imoveis_fotos',
    'imoveis_documentos',
    'imoveis_fichas_captacao',
    'leads_origens',
    'leads_etapas',
    'leads',
    'leads_interacoes'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
      tbl
    );
    execute format('alter table public.%I enable row level security', tbl);
  end loop;
end;
$$;
