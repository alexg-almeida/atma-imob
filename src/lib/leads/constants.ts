/** Cor semântica do ponto de etapa, por nome (fallback neutro para etapas customizadas). */
const CORES_POR_NOME: Record<string, string> = {
  novo: "var(--color-slate)",
  "em atendimento": "var(--color-gold)",
  visita: "var(--color-gold)",
  proposta: "var(--color-gold)",
  fechado: "var(--color-sage)",
  perdido: "var(--color-alert)",
};

export function corEtapa(nome: string): string {
  return CORES_POR_NOME[nome.trim().toLowerCase()] ?? "var(--color-strong-line)";
}
