/**
 * Ações especiais por módulo, armazenadas em `core_permissoes.permissoes_extras`
 * (jsonb array de chaves). Lista fixa hoje — mesmas chaves usadas em
 * supabase/seeds/seed_admin.sql.
 */
export const EXTRAS_POR_MODULO: Record<string, { chave: string; label: string }[]> = {
  leads: [{ chave: "ver_todos", label: "Ver leads de todos os corretores" }],
  proprietarios: [{ chave: "financeiro", label: "Ver dados bancários" }],
};
