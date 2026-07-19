"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import type { PermissaoModuloEstado } from "@/components/admin/permissoes-matrix";

/**
 * Único ponto do app que precisa da service role key: criar login novo
 * exige a Auth Admin API (auth.users é inacessível ao client anon). O resto
 * do CRUD de usuários (editar perfil, permissões, desativar) segue a
 * convenção do projeto e chama o Supabase direto do client, protegido pela
 * RLS de core_perfis/core_permissoes.
 */
export async function criarUsuario(input: {
  nome_completo: string;
  email: string;
  senha: string;
  telefone: string | null;
  permissoes: PermissaoModuloEstado[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const podeCriar = await temPermissao("core", "criar");
  if (!podeCriar) {
    return { ok: false, error: "Sem permissão para criar usuários." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.",
    };
  }

  const supabaseAtual = await createClient();
  const { data: atual } = await supabaseAtual.auth.getUser();

  const { data: criado, error: erroCriacao } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.senha,
    email_confirm: true,
    user_metadata: { nome_completo: input.nome_completo },
  });

  if (erroCriacao || !criado.user) {
    return { ok: false, error: erroCriacao?.message ?? "Erro ao criar usuário." };
  }

  const userId = criado.user.id;

  if (input.telefone) {
    await admin.from("core_perfis").update({ telefone: input.telefone }).eq("id", userId);
  }

  const linhasPermissao = input.permissoes.filter(
    (p) =>
      p.pode_visualizar ||
      p.pode_criar ||
      p.pode_editar ||
      p.pode_excluir ||
      p.permissoes_extras.length > 0,
  );

  if (linhasPermissao.length > 0) {
    const { error: erroPermissoes } = await admin.from("core_permissoes").insert(
      linhasPermissao.map((p) => ({
        perfil_id: userId,
        modulo_id: p.modulo_id,
        pode_visualizar: p.pode_visualizar,
        pode_criar: p.pode_criar,
        pode_editar: p.pode_editar,
        pode_excluir: p.pode_excluir,
        permissoes_extras: p.permissoes_extras,
        created_by: atual.user?.id ?? null,
      })),
    );
    if (erroPermissoes) {
      return {
        ok: false,
        error: `Usuário criado, mas falhou ao salvar permissões: ${erroPermissoes.message}`,
      };
    }
  }

  return { ok: true, id: userId };
}

/**
 * Hard delete de usuário: apagar só `core_perfis` não bastaria (o login em
 * `auth.users` continuaria existindo) — precisa da Auth Admin API, que
 * cascade-apaga `core_perfis`/`core_permissoes` via FK. Único módulo do
 * projeto onde "Excluir definitivamente" não é um `.delete()` direto na
 * tabela porque o dado real (o login) vive fora do alcance da RLS/anon key.
 */
export async function excluirUsuarioDefinitivamente(
  id: string,
): Promise<{ error: string | null }> {
  const podeExcluir = await temPermissao("core", "editar");
  if (!podeExcluir) {
    return { error: "Sem permissão para excluir usuários definitivamente." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor." };
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };
  return { error: null };
}
