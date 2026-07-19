import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client com a service role key — ignora RLS. Só para operações que exigem
 * a Auth Admin API (criar login novo). Nunca importar em componente
 * "use client": o `server-only` acima quebra o build se isso acontecer.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * E-mail de um único usuário (tela de detalhe/edição). `null` quando a
 * service role key não está configurada ou o usuário não é encontrado.
 */
export async function buscarEmailUsuario(id: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(id);
    if (error || !data.user) return null;
    return data.user.email ?? null;
  } catch {
    return null;
  }
}

/**
 * E-mail vive em `auth.users`, fora do alcance do client anon — usa a Auth
 * Admin API para montar um mapa id→email. Retorna `disponivel: false` (sem
 * lançar) quando a service role key não está configurada, para as telas de
 * /admin/usuarios funcionarem parcialmente sem ela.
 */
export async function mapaEmailsPorUsuario(): Promise<{
  emails: Record<string, string>;
  disponivel: boolean;
}> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { emails: {}, disponivel: false };
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error || !data) return { emails: {}, disponivel: false };
    return {
      emails: Object.fromEntries(data.users.map((u) => [u.id, u.email ?? ""])),
      disponivel: true,
    };
  } catch {
    return { emails: {}, disponivel: false };
  }
}
