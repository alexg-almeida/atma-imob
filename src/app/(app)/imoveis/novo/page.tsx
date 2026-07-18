import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ImovelForm } from "@/components/imoveis/imovel-form";

export const metadata: Metadata = {
  title: "Cadastrar imóvel · Atma CRM",
};

export default async function NovoImovelPage() {
  const podeCriar = await temPermissao("imoveis", "criar");

  if (!podeCriar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para cadastrar imóveis.
        </p>
        <Link
          href="/imoveis"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar para imóveis
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: tipos }, { data: parceiros }, { data: proprietarios }] =
    await Promise.all([
      supabase.from("imoveis_tipos").select("id, nome").eq("ativo", true).order("nome"),
      supabase
        .from("parceiros")
        .select("id, nome_completo")
        .eq("ativo", true)
        .in("tipo", ["captador", "ambos"])
        .order("nome_completo"),
      supabase
        .from("proprietarios")
        .select("id, nome_completo")
        .eq("ativo", true)
        .order("nome_completo"),
    ]);

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href="/imoveis"
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Imóveis
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
          Cadastrar imóvel
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Fotos e documentos podem ser anexados após salvar o cadastro.
        </p>
      </div>

      <ImovelForm
        tipos={tipos ?? []}
        parceiros={parceiros ?? []}
        proprietarios={proprietarios ?? []}
      />
    </>
  );
}
