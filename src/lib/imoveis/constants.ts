import type {
  ImovelDocumentoTipo,
  ImovelFinalidade,
  ImovelStatus,
} from "@/lib/supabase/types";

export const finalidadeLabels: Record<ImovelFinalidade, string> = {
  venda: "Venda",
  locacao: "Locação",
  ambos: "Venda e locação",
};

export const statusLabels: Record<ImovelStatus, string> = {
  ativo: "Ativo",
  reservado: "Reservado",
  vendido: "Vendido",
  alugado: "Alugado",
  inativo: "Inativo",
};

/** Cores semânticas do design system (nunca o azul de ação). */
export const statusColors: Record<ImovelStatus, string> = {
  ativo: "var(--color-sage)",
  reservado: "var(--color-gold)",
  vendido: "var(--color-ink)",
  alugado: "var(--color-slate)",
  inativo: "var(--color-strong-line)",
};

export const documentoTipoLabels: Record<ImovelDocumentoTipo, string> = {
  matricula: "Matrícula",
  iptu: "IPTU",
  contrato: "Contrato",
  escritura: "Escritura",
  procuracao: "Procuração",
  ficha_captacao: "Ficha de Captação",
  outros: "Outros",
};

export const finalidadeOptions = Object.entries(finalidadeLabels) as [
  ImovelFinalidade,
  string,
][];

export const documentoTipoOptions = Object.entries(documentoTipoLabels) as [
  ImovelDocumentoTipo,
  string,
][];

export const statusOptions = Object.entries(statusLabels) as [
  ImovelStatus,
  string,
][];
