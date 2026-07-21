import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ParceiroForm } from "@/components/parceiros/parceiro-form";

export const metadata: Metadata = {
  title: "Novo parceiro · Atma CRM",
};

export default async function NovoParceiroPage() {
  const podeCriar = await temPermissao("parceiros", "criar");

  if (!podeCriar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para cadastrar parceiros.
        </p>
        <Link
          href="/parceiros"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: perfis } = await supabase
    .from("core_perfis")
    .select("id, nome_completo")
    .eq("ativo", true)
    .order("nome_completo");

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href="/parceiros"
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Parceiros
        </Link>
        <h1 className="mt-4 text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
          Novo parceiro
        </h1>
      </div>

      <ParceiroForm perfis={perfis ?? []} />
    </>
  );
}
