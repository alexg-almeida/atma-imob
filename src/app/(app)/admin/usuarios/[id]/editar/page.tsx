import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { UsuarioForm } from "@/components/admin/usuario-form";
import type { CoreModulo, CorePerfil, CorePermissao } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Editar usuário · Atma CRM",
};

export default async function EditarUsuarioPage(
  props: PageProps<"/admin/usuarios/[id]/editar">,
) {
  const { id } = await props.params;
  const podeEditar = await temPermissao("core", "editar");

  if (!podeEditar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para editar usuários.
        </p>
        <Link
          href={`/admin/usuarios/${id}`}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: perfil }, { data: modulos }, { data: permissoes }] = await Promise.all([
    supabase.from("core_perfis").select("*").eq("id", id).eq("ativo", true).maybeSingle(),
    supabase.from("core_modulos").select("*").eq("ativo", true).order("nome"),
    supabase.from("core_permissoes").select("*").eq("perfil_id", id).eq("ativo", true),
  ]);

  if (!perfil) notFound();

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href={`/admin/usuarios/${id}`}
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Detalhe do usuário
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
          Editar usuário
        </h1>
      </div>

      <UsuarioForm
        perfil={perfil as CorePerfil}
        modulos={(modulos ?? []) as CoreModulo[]}
        permissoesAtuais={(permissoes ?? []) as CorePermissao[]}
      />
    </>
  );
}
