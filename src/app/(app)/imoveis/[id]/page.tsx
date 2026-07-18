import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ImovelStatusDot } from "@/components/imoveis/imovel-status";
import { DocumentosManager } from "@/components/imoveis/documentos-manager";
import { GaleriaImovel } from "@/components/imoveis/galeria-imovel";
import { GerarBookButton } from "@/components/imoveis/book/gerar-book-button";
import { ExcluirRegistroButton } from "@/components/excluir-registro-button";
import { Button } from "@/components/ui/button";
import { finalidadeLabels } from "@/lib/imoveis/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  Imovel,
  ImovelDocumento,
  ImovelFoto,
} from "@/lib/supabase/types";

type ImovelDetalhe = Imovel & {
  tipo: { nome: string } | null;
  captador: { nome_completo: string } | null;
};

type VinculoComProprietario = {
  id: string;
  percentual_participacao: number | null;
  principal: boolean;
  proprietario: { id: string; nome_completo: string } | null;
};

export const metadata: Metadata = {
  title: "Imóvel · Atma CRM",
};

function ChipsGroup({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {titulo}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {itens.map((item) => (
          <span
            key={item}
            className="rounded-sm bg-surface px-2 py-1 text-xs text-ink"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function ImovelPage(props: PageProps<"/imoveis/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("imoveis")
    .select(
      "*, tipo:imoveis_tipos(nome), captador:parceiros(nome_completo)",
    )
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (!data) notFound();
  const imovel = data as ImovelDetalhe;

  const [{ data: fotos }, { data: documentos }, { data: vinculos }, podeEditar, podeExcluir] =
    await Promise.all([
      supabase
        .from("imoveis_fotos")
        .select("*")
        .eq("imovel_id", id)
        .eq("ativo", true)
        .order("ordem"),
      supabase
        .from("imoveis_documentos")
        .select("*")
        .eq("imovel_id", id)
        .eq("ativo", true)
        .order("created_at"),
      supabase
        .from("imoveis_proprietarios")
        .select(
          "id, percentual_participacao, principal, proprietario:proprietarios(id, nome_completo)",
        )
        .eq("imovel_id", id)
        .eq("ativo", true),
      temPermissao("imoveis", "editar"),
      temPermissao("imoveis", "excluir"),
    ]);

  const galeria = (fotos ?? []) as ImovelFoto[];

  const titulo = [imovel.tipo?.nome ?? "Imóvel", imovel.cidade]
    .filter(Boolean)
    .join(" · ");

  const facts: { label: string; value: string }[] = [
    ...(imovel.finalidade !== "locacao"
      ? [{ label: "Valor de venda", value: formatCurrency(imovel.valor_venda) }]
      : []),
    ...(imovel.finalidade !== "venda"
      ? [
          {
            label: "Aluguel mensal",
            value: formatCurrency(imovel.valor_locacao),
          },
        ]
      : []),
    ...(imovel.area_interna != null
      ? [{ label: "Área interna", value: `${imovel.area_interna} m²` }]
      : []),
    ...(imovel.quartos != null
      ? [{ label: "Quartos", value: String(imovel.quartos) }]
      : []),
    ...(imovel.suites != null
      ? [{ label: "Suítes", value: String(imovel.suites) }]
      : []),
    ...(imovel.banheiros != null
      ? [{ label: "Banheiros", value: String(imovel.banheiros) }]
      : []),
    ...(imovel.vagas != null
      ? [{ label: "Vagas", value: String(imovel.vagas) }]
      : []),
  ];

  const encargos: { label: string; value: string }[] = [
    ...(imovel.valor_condominio != null
      ? [{ label: "Condomínio", value: formatCurrency(imovel.valor_condominio) }]
      : []),
    ...(imovel.iptu_mensal != null
      ? [
          {
            label: `IPTU mensal${imovel.repasse_iptu ? " (repassado)" : ""}`,
            value: formatCurrency(imovel.iptu_mensal),
          },
        ]
      : []),
    ...(imovel.taxa_lixo != null
      ? [
          {
            label: `Taxa de lixo${imovel.parcela_taxa_lixo ? ` (${imovel.parcela_taxa_lixo})` : ""}`,
            value: formatCurrency(imovel.taxa_lixo),
          },
        ]
      : []),
    ...(imovel.outras_taxas != null
      ? [{ label: "Outras taxas", value: formatCurrency(imovel.outras_taxas) }]
      : []),
    ...(imovel.comissao_percentual != null
      ? [{ label: "Comissão", value: `${imovel.comissao_percentual}%` }]
      : []),
  ];

  return (
    <>
      <div className="pt-8 pb-5">
        <Link
          href="/imoveis"
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Imóveis
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {finalidadeLabels[imovel.finalidade]}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              {titulo}
            </h1>
            {imovel.frase_destaque ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {imovel.frase_destaque}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ImovelStatusDot status={imovel.status} />
            <GerarBookButton imovel={imovel} fotos={galeria} />
            {podeEditar ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/imoveis/${id}/ficha-captacao`}>Ficha de captação</Link>
              </Button>
            ) : null}
            {podeEditar ? (
              <Button size="sm" asChild>
                <Link href={`/imoveis/${id}/editar`}>
                  <PencilSimple size={14} aria-hidden /> Editar
                </Link>
              </Button>
            ) : null}
            {podeExcluir ? (
              <ExcluirRegistroButton
                tabela="imoveis"
                id={id}
                redirectTo="/imoveis"
                titulo="Excluir imóvel"
                descricao="O imóvel será removido da listagem. Essa ação não pode ser desfeita."
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Galeria */}
      <GaleriaImovel fotos={galeria} titulo={titulo} />

      {/* Fatos principais */}
      {facts.length > 0 ? (
        <dl className="mt-10 grid grid-cols-2 gap-y-8 border-y border-line py-8 sm:grid-cols-3 lg:flex lg:justify-between">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="px-4 first:pl-0 last:pr-0 lg:border-l lg:border-line lg:first:border-0"
            >
              <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {fact.label}
              </dt>
              <dd className="mt-2 font-mono text-2xl font-medium text-ink">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="grid grid-cols-1 gap-12 pt-12 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          {imovel.descricao ? (
            <section aria-labelledby="descricao-heading">
              <div className="border-b-2 border-ink pb-4">
                <h2
                  id="descricao-heading"
                  className="text-xl font-semibold tracking-tight text-ink"
                >
                  Descrição
                </h2>
              </div>
              <p className="max-w-prose pt-6 text-sm leading-relaxed whitespace-pre-line text-ink">
                {imovel.descricao}
              </p>
            </section>
          ) : null}

          <section aria-labelledby="endereco-heading">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="endereco-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Endereço
              </h2>
            </div>
            <p className="pt-6 text-sm text-ink">
              {imovel.endereco_completo ?? "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {[imovel.cidade, imovel.estado, imovel.cep]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </section>

          {imovel.comodidades_internas.length > 0 ||
          imovel.instalacoes.length > 0 ||
          imovel.lazer.length > 0 ||
          imovel.diferenciais.length > 0 ? (
            <section aria-labelledby="caracteristicas-heading">
              <div className="border-b-2 border-ink pb-4">
                <h2
                  id="caracteristicas-heading"
                  className="text-xl font-semibold tracking-tight text-ink"
                >
                  Características
                </h2>
              </div>
              <div className="space-y-5 pt-6">
                <ChipsGroup
                  titulo="Comodidades internas"
                  itens={imovel.comodidades_internas}
                />
                <ChipsGroup titulo="Instalações" itens={imovel.instalacoes} />
                <ChipsGroup titulo="Lazer" itens={imovel.lazer} />
                <ChipsGroup titulo="Diferenciais" itens={imovel.diferenciais} />
              </div>
            </section>
          ) : null}

          <section aria-labelledby="documentos-heading">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="documentos-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Documentos
              </h2>
            </div>
            <div className="pt-6">
              <DocumentosManager
                imovelId={id}
                documentos={(documentos ?? []) as ImovelDocumento[]}
                readOnly={!podeEditar}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-12 lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
          <section aria-labelledby="proprietarios-heading">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="proprietarios-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Proprietários
              </h2>
            </div>
            {(vinculos ?? []).length === 0 ? (
              <p className="pt-5 text-sm text-muted-foreground">
                Nenhum proprietário vinculado.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {((vinculos ?? []) as unknown as VinculoComProprietario[]).map(
                  (vinculo) => (
                    <li
                      key={vinculo.id}
                      className="flex items-baseline justify-between gap-4 py-4"
                    >
                      <div>
                        <Link
                          href={`/proprietarios/${vinculo.proprietario?.id}`}
                          className="text-sm font-medium text-ink underline-offset-4 hover:underline"
                        >
                          {vinculo.proprietario?.nome_completo ?? "—"}
                        </Link>
                        {vinculo.principal ? (
                          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                            Principal
                          </p>
                        ) : null}
                      </div>
                      {vinculo.percentual_participacao != null ? (
                        <span className="font-mono text-sm text-ink">
                          {vinculo.percentual_participacao}%
                        </span>
                      ) : null}
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>

          {encargos.length > 0 ? (
            <section aria-labelledby="encargos-heading">
              <div className="border-b-2 border-ink pb-4">
                <h2
                  id="encargos-heading"
                  className="text-xl font-semibold tracking-tight text-ink"
                >
                  Valores e encargos
                </h2>
              </div>
              <dl className="divide-y divide-line">
                {encargos.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between gap-4 py-4"
                  >
                    <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {item.label}
                    </dt>
                    <dd className="font-mono text-sm text-ink">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section aria-labelledby="registro-heading">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="registro-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Registro
              </h2>
            </div>
            <dl className="divide-y divide-line">
              {imovel.captador ? (
                <div className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Captador
                  </dt>
                  <dd className="text-sm text-ink">
                    {imovel.captador.nome_completo}
                  </dd>
                </div>
              ) : null}
              {imovel.data_captacao ? (
                <div className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Captação
                  </dt>
                  <dd className="font-mono text-sm text-ink">
                    {formatDate(imovel.data_captacao)}
                  </dd>
                </div>
              ) : null}
              {imovel.inscricao_imobiliaria ? (
                <div className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Inscrição imobiliária
                  </dt>
                  <dd className="font-mono text-sm text-ink">
                    {imovel.inscricao_imobiliaria}
                  </dd>
                </div>
              ) : null}
              {imovel.numero_matricula ? (
                <div className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Matrícula
                  </dt>
                  <dd className="font-mono text-sm text-ink">
                    {imovel.numero_matricula}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Última atualização
                </dt>
                <dd className="font-mono text-sm text-ink">
                  {formatDate(imovel.updated_at)}
                </dd>
              </div>
            </dl>
          </section>

          {imovel.observacoes ? (
            <section aria-labelledby="observacoes-heading">
              <div className="border-b-2 border-ink pb-4">
                <h2
                  id="observacoes-heading"
                  className="text-xl font-semibold tracking-tight text-ink"
                >
                  Observações internas
                </h2>
              </div>
              <p className="pt-5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {imovel.observacoes}
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
