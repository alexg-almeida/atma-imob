import { createClient } from "@/lib/supabase/server";

/**
 * Checa no servidor se o usuário autenticado tem a permissão pedida
 * (função SQL `tem_permissao`, security definer).
 */
export async function temPermissao(
  modulo: string,
  acao: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("tem_permissao", {
    p_modulo_slug: modulo,
    p_acao: acao,
  });
  return data === true;
}
