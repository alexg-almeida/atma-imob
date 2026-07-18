import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ImovelForm } from "@/components/imoveis/imovel-form";
import { FichaCaptacaoPanel } from "@/components/imoveis/ficha-captacao-panel";
import { finalidadeLabels } from "@/lib/imoveis/constants";
import type {
  Imovel,
  ImovelFichaCaptacao,
  ImovelProprietario,
  Proprietario,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Ficha de captação · Atma CRM",
};

type VinculoComProprietario = ImovelProprietario & {
  proprietario: Proprietario | null;
};

export default async function FichaCaptacaoPage(
  props: PageProps<"/imoveis/[id]/ficha-captacao">,
) {
  const { id } = await props.params;
  const podeEditar = await temPermissao("imoveis", "editar");

  if (!podeEditar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para captar ou editar imóveis.
        </p>
        <Link
          href={`/imoveis/${id}`}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar para o imóvel
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: imovelRaw } = await supabase
    .from("imoveis")
    .select("*, tipo:imoveis_tipos(nome), captador:parceiros(nome_completo)")
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (!imovelRaw) notFound();
  const imovel = imovelRaw as Imovel & {
    tipo: { nome: string } | null;
    captador: { nome_completo: string } | null;
  };

  const [
    { data: tipos },
    { data: parceiros },
    { data: proprietariosLista },
    { data: vinculos },
    { data: vinculosCompletos },
    { data: fichas },
    { data: termoConfig },
  ] = await Promise.all([
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
    supabase
      .from("imoveis_proprietarios")
      .select("*")
      .eq("imovel_id", id)
      .eq("ativo", true),
    supabase
      .from("imoveis_proprietarios")
      .select("*, proprietario:proprietarios(*)")
      .eq("imovel_id", id)
      .eq("ativo", true),
    supabase
      .from("imoveis_fichas_captacao")
      .select("*")
      .eq("imovel_id", id)
      .eq("ativo", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("fichas_captacao_configuracoes")
      .select("titulo, corpo")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const tipo = imovel.tipo;
  const captador = imovel.captador;
  const tituloImovel = [tipo?.nome ?? "Imóvel", imovel.cidade].filter(Boolean).join(" · ");

  const proprietariosParaPdf = (
    (vinculosCompletos ?? []) as unknown as VinculoComProprietario[]
  )
    .filter((v): v is VinculoComProprietario & { proprietario: Proprietario } =>
      Boolean(v.proprietario),
    )
    .map((v) => ({
      proprietario: v.proprietario,
      percentual_participacao: v.percentual_participacao,
      principal: v.principal,
    }));

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href={`/imoveis/${id}`}
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Detalhe do imóvel
        </Link>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {finalidadeLabels[imovel.finalidade]}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          Ficha de captação · {tituloImovel}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Revise ou preencha os dados do imóvel direto em campo e gere o PDF
          formal para o proprietário assinar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ImovelForm
            tipos={tipos ?? []}
            parceiros={parceiros ?? []}
            proprietarios={proprietariosLista ?? []}
            imovel={imovel as Imovel}
            vinculos={(vinculos ?? []) as ImovelProprietario[]}
            aoSalvarRedirecionarPara={`/imoveis/${id}/ficha-captacao`}
          />
        </div>

        <aside className="lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
          <FichaCaptacaoPanel
            imovel={imovel as Imovel}
            tipoNome={tipo?.nome ?? "Imóvel"}
            captadorNome={captador?.nome_completo ?? null}
            proprietarios={proprietariosParaPdf}
            fichas={(fichas ?? []) as ImovelFichaCaptacao[]}
            tituloImovel={tituloImovel}
            termoTitulo={termoConfig?.titulo ?? null}
            termoCorpo={termoConfig?.corpo ?? null}
          />
        </aside>
      </div>
    </>
  );
}
