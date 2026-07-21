import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { UsuarioNovoForm } from "@/components/admin/usuario-novo-form";
import type { CoreModulo } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Novo usuário · Atma CRM",
};

export default async function NovoUsuarioPage() {
  const podeCriar = await temPermissao("core", "criar");

  if (!podeCriar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para criar usuários.
        </p>
        <Link
          href="/admin/usuarios"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Configuração pendente</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Criar login novo exige a chave de serviço do Supabase. Adicione{" "}
          <code className="font-mono text-ink">SUPABASE_SERVICE_ROLE_KEY</code> no{" "}
          <code className="font-mono text-ink">.env.local</code> (e nas variáveis de
          ambiente de runtime em produção) e reinicie o servidor.
        </p>
        <Link
          href="/admin/usuarios"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: modulos } = await supabase
    .from("core_modulos")
    .select("*")
    .eq("ativo", true)
    .order("nome");

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href="/admin/usuarios"
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Usuários
        </Link>
        <h1 className="mt-4 text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
          Novo usuário
        </h1>
      </div>

      <UsuarioNovoForm modulos={(modulos ?? []) as CoreModulo[]} />
    </>
  );
}
