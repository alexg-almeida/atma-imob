import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { LeadForm } from "@/components/leads/lead-form";
import type { ImovelOption } from "@/components/leads/imovel-picker";
import type { Lead } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Editar lead · Atma CRM",
};

export default async function EditarLeadPage(
  props: PageProps<"/leads/[id]/editar">,
) {
  const { id } = await props.params;
  const podeEditar = await temPermissao("leads", "editar");

  if (!podeEditar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para editar este lead.
        </p>
        <Link
          href={`/leads/${id}`}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const podeVerTodos = await temPermissao("leads", "ver_todos");

  const [
    { data: lead },
    { data: origens },
    { data: etapas },
    { data: imoveis },
    { data: meuParceiroId },
    { data: corretores },
  ] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).eq("ativo", true).maybeSingle(),
    supabase.from("leads_origens").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("leads_etapas").select("id, nome, ordem").eq("ativo", true).order("ordem"),
    supabase
      .from("imoveis")
      .select("id, cidade, endereco_completo, tipo:imoveis_tipos(nome)")
      .eq("ativo", true)
      .order("created_at", { ascending: false }),
    supabase.rpc("parceiro_do_usuario"),
    podeVerTodos
      ? supabase
          .from("parceiros")
          .select("id, nome_completo")
          .eq("ativo", true)
          .in("tipo", ["corretor", "ambos"])
          .order("nome_completo")
      : Promise.resolve({ data: [] }),
  ]);

  if (!lead) notFound();

  const imoveisOptions: ImovelOption[] = (imoveis ?? []).map((imovel) => {
    const tipo = imovel.tipo as unknown as { nome: string } | null;
    return {
      id: imovel.id as string,
      label: [tipo?.nome ?? "Imóvel", imovel.cidade].filter(Boolean).join(" · "),
      sublabel: (imovel.endereco_completo as string | null) ?? "",
    };
  });

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href={`/leads/${id}`}
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Detalhe do lead
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
          Editar lead
        </h1>
      </div>

      <LeadForm
        lead={lead as Lead}
        origens={origens ?? []}
        etapas={etapas ?? []}
        imoveisOptions={imoveisOptions}
        podeVerTodos={podeVerTodos}
        corretores={corretores ?? []}
        meuParceiroId={(meuParceiroId as string | null) ?? null}
      />
    </>
  );
}
