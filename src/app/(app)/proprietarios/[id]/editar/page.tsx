import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ProprietarioForm } from "@/components/proprietarios/proprietario-form";
import type {
  Proprietario,
  ProprietarioDadosBancarios,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Editar proprietário · Atma CRM",
};

export default async function EditarProprietarioPage(
  props: PageProps<"/proprietarios/[id]/editar">,
) {
  const { id } = await props.params;
  const [podeEditar, podeFinanceiro] = await Promise.all([
    temPermissao("proprietarios", "editar"),
    temPermissao("proprietarios", "financeiro"),
  ]);

  if (!podeEditar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para editar proprietários.
        </p>
        <Link
          href={`/proprietarios/${id}`}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: proprietario } = await supabase
    .from("proprietarios")
    .select("*")
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (!proprietario) notFound();

  // Sem a permissão 'financeiro' a RLS devolve vazio aqui — a seção nem renderiza.
  const { data: dadosBancarios } = podeFinanceiro
    ? await supabase
        .from("proprietarios_dados_bancarios")
        .select("*")
        .eq("proprietario_id", id)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href={`/proprietarios/${id}`}
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Detalhe do proprietário
        </Link>
        <h1 className="mt-4 text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
          Editar proprietário
        </h1>
      </div>

      <ProprietarioForm
        proprietario={proprietario as Proprietario}
        dadosBancarios={dadosBancarios as ProprietarioDadosBancarios | null}
        podeFinanceiro={podeFinanceiro}
      />
    </>
  );
}
