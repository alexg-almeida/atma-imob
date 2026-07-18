// Tipos das tabelas do Supabase (mantidos à mão — gerar via CLI quando o
// pooler tiver TLS). Numéricos do Postgres chegam como number pelo PostgREST.

export type ImovelFinalidade = "venda" | "locacao" | "ambos";
export type ImovelStatus =
  | "ativo"
  | "reservado"
  | "vendido"
  | "alugado"
  | "inativo";

export type ImovelTipo = {
  id: string;
  nome: string;
  ativo: boolean;
};

export type Imovel = {
  id: string;
  tipo_id: string;
  finalidade: ImovelFinalidade;
  status: ImovelStatus;
  descricao: string | null;
  endereco_completo: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  area_interna: number | null;
  area_externa: number | null;
  area_lote: number | null;
  andar: number | null;
  salas: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  varandas: number | null;
  vagas: number | null;
  numero_vaga: string | null;
  tipo_vaga: string | null;
  piso_acabamento: string | null;
  fachada: string | null;
  comodidades_internas: string[];
  instalacoes: string[];
  lazer: string[];
  inscricao_imobiliaria: string | null;
  data_captacao: string | null;
  comissao_percentual: number | null;
  observacoes: string | null;
  valor_condominio: number | null;
  outras_taxas: number | null;
  numero_matricula: string | null;
  captador_id: string | null;
  valor_venda: number | null;
  valor_locacao: number | null;
  iptu_mensal: number | null;
  repasse_iptu: boolean;
  taxa_lixo: number | null;
  parcela_taxa_lixo: string | null;
  frase_destaque: string | null;
  diferenciais: string[];
  created_at: string;
  updated_at: string;
  ativo: boolean;
};

export type ImovelFoto = {
  id: string;
  imovel_id: string;
  url: string;
  ordem: number;
  capa: boolean;
  destaque: string | null;
  usar_no_book: boolean;
  ativo: boolean;
};

export type ImovelDocumento = {
  id: string;
  imovel_id: string;
  /** Caminho do objeto no bucket privado 'imoveis-documentos'. */
  url: string;
  nome_arquivo: string;
  tipo_documento: string | null;
  created_at: string;
  ativo: boolean;
};

export type ImovelProprietario = {
  id: string;
  imovel_id: string;
  proprietario_id: string;
  percentual_participacao: number | null;
  principal: boolean;
  ativo: boolean;
};

export type Proprietario = {
  id: string;
  nome_completo: string;
  cpf: string | null;
  doc_identidade_numero: string | null;
  doc_identidade_tipo: string | null;
  doc_identidade_orgao_exp: string | null;
  email: string | null;
  whatsapp: string | null;
  telefone: string | null;
  telefone_comercial: string | null;
  endereco_completo: string | null;
  endereco_comercial: string | null;
  data_nascimento: string | null;
  estado_civil: string | null;
  profissao: string | null;
  empresa: string | null;
  created_at: string;
  updated_at: string;
  ativo: boolean;
};

export type ProprietarioDadosBancarios = {
  id: string;
  proprietario_id: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  pix: string | null;
  ativo: boolean;
};

export type ParceiroTipo = "corretor" | "captador" | "ambos";

export const parceiroTipos: ParceiroTipo[] = ["corretor", "captador", "ambos"];

export const parceiroTipoLabels: Record<ParceiroTipo, string> = {
  corretor: "Corretor",
  captador: "Captador",
  ambos: "Corretor e captador",
};

export type Parceiro = {
  id: string;
  tipo: ParceiroTipo;
  nome_completo: string;
  creci: string | null;
  comissao_padrao_percentual: number | null;
  email: string | null;
  whatsapp: string | null;
  telefone: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  pix: string | null;
  perfil_id: string | null;
  created_at: string;
  updated_at: string;
  ativo: boolean;
};

export type CorePerfil = {
  id: string;
  nome_completo: string;
  telefone: string | null;
  avatar_url: string | null;
  ativo: boolean;
};

export type LeadEtapa = {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
};

export type LeadOrigem = {
  id: string;
  nome: string;
  ativo: boolean;
};

export type Lead = {
  id: string;
  nome_completo: string;
  foto_url: string | null;
  whatsapp: string | null;
  telefone_1: string | null;
  telefone_2: string | null;
  email: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  endereco_completo: string | null;
  origem_id: string | null;
  etapa_id: string | null;
  corretor_id: string | null;
  imovel_interesse_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  ativo: boolean;
};

export type FichaCaptacaoStatus = "rascunho" | "gerada" | "enviada";

export type ImovelFichaCaptacao = {
  id: string;
  imovel_id: string;
  status: FichaCaptacaoStatus;
  link_token: string | null;
  enviado_em: string | null;
  pdf_final_url: string | null;
  // Extensão futura de assinatura digital — ver TODO(assinatura-digital) em
  // src/lib/pdf/ficha-captacao.ts.
  provedor_assinatura: string | null;
  assinatura_url: string | null;
  assinado_em: string | null;
  hash_documento: string | null;
  created_at: string;
  updated_at: string;
  ativo: boolean;
};

/**
 * Texto do Termo de Autorização e Aceite anexado ao final da Ficha de
 * Captação — editável na tela Admin (só superadmin), com variáveis
 * `{{chave}}` substituídas na geração do PDF. Ver `TERMO_VARIAVEIS` em
 * src/lib/pdf/ficha-captacao.ts para a lista de variáveis disponíveis.
 */
export type FichaCaptacaoConfiguracao = {
  id: string;
  titulo: string;
  corpo: string;
  created_at: string;
  updated_at: string;
  ativo: boolean;
};

export type LeadInteracao = {
  id: string;
  lead_id: string;
  tipo: string;
  descricao: string | null;
  data_interacao: string;
  usuario_id: string | null;
  created_at: string;
  ativo: boolean;
};
