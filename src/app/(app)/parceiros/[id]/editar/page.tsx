import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ParceiroForm } from "@/components/parceiros/parceiro-form";
import type { Parceiro } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Editar parceiro · Atma CRM",
};

export default async function EditarParceiroPage(
  props: PageProps<"/parceiros/[id]/editar">,
) {
  const { id } = await props.params;
  const podeEditar = await temPermissao("parceiros", "editar");

  if (!podeEditar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para editar parceiros.
        </p>
        <Link
          href={`/parceiros/${id}`}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: parceiro }, { data: perfis }] = await Promise.all([
    supabase
      .from("parceiros")
      .select("*")
      .eq("id", id)
      .eq("ativo", true)
      .maybeSingle(),
    supabase
      .from("core_perfis")
      .select("id, nome_completo")
      .eq("ativo", true)
      .order("nome_completo"),
  ]);

  if (!parceiro) notFound();

  return (
    <>
      <div className="pt-12 pb-10">
        <Link
          href={`/parceiros/${id}`}
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Detalhe do parceiro
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">
          Editar parceiro
        </h1>
      </div>

      <ParceiroForm parceiro={parceiro as Parceiro} perfis={perfis ?? []} />
    </>
  );
}
