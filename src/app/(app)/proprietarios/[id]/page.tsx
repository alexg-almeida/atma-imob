import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockSimple, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ImovelStatusDot } from "@/components/imoveis/imovel-status";
import { ExcluirRegistroButton } from "@/components/excluir-registro-button";
import { Button } from "@/components/ui/button";
import { finalidadeLabels } from "@/lib/imoveis/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  ImovelFinalidade,
  ImovelStatus,
  Proprietario,
  ProprietarioDadosBancarios,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Proprietário · Atma CRM",
};

type VinculoComImovel = {
  id: string;
  percentual_participacao: number | null;
  principal: boolean;
  imovel: {
    id: string;
    finalidade: ImovelFinalidade;
    status: ImovelStatus;
    cidade: string | null;
    endereco_completo: string | null;
    valor_venda: number | null;
    valor_locacao: number | null;
    ativo: boolean;
    tipo: { nome: string } | null;
  } | null;
};

function InfoRow({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className={`text-right text-sm text-ink ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

export default async function ProprietarioPage(
  props: PageProps<"/proprietarios/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("proprietarios")
    .select("*")
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (!data) notFound();
  const proprietario = data as Proprietario;

  const [podeEditar, podeFinanceiro, podeExcluir, { data: vinculos }] = await Promise.all([
    temPermissao("proprietarios", "editar"),
    temPermissao("proprietarios", "financeiro"),
    temPermissao("proprietarios", "excluir"),
    supabase
      .from("imoveis_proprietarios")
      .select(
        "id, percentual_participacao, principal, imovel:imoveis(id, finalidade, status, cidade, endereco_completo, valor_venda, valor_locacao, ativo, tipo:imoveis_tipos(nome))",
      )
      .eq("proprietario_id", id)
      .eq("ativo", true),
  ]);

  const { data: dadosBancarios } = podeFinanceiro
    ? await supabase
        .from("proprietarios_dados_bancarios")
        .select("*")
        .eq("proprietario_id", id)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle()
    : { data: null };

  const bancarios = dadosBancarios as ProprietarioDadosBancarios | null;
  const imoveisVinculados = (
    (vinculos ?? []) as unknown as VinculoComImovel[]
  ).filter((v) => v.imovel?.ativo);

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href="/proprietarios"
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Proprietários
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {proprietario.nome_completo}
            </h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {[
                proprietario.cpf ? `CPF ${proprietario.cpf}` : null,
                proprietario.profissao,
              ]
                .filter(Boolean)
                .join(" · ") || " "}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {podeEditar ? (
              <Button size="sm" asChild>
                <Link href={`/proprietarios/${id}/editar`}>
                  <PencilSimple size={14} aria-hidden /> Editar
                </Link>
              </Button>
            ) : null}
            {podeExcluir ? (
              <ExcluirRegistroButton
                tabela="proprietarios"
                id={id}
                redirectTo="/proprietarios"
                titulo="Excluir proprietário"
                descricao="O proprietário será removido da listagem. Essa ação não pode ser desfeita."
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 border-t border-line pt-12 lg:grid-cols-12">
        {/* Imóveis vinculados */}
        <section
          aria-labelledby="imoveis-heading"
          className="lg:col-span-7"
        >
          <div className="border-b-2 border-ink pb-4">
            <h2
              id="imoveis-heading"
              className="text-xl font-semibold tracking-tight text-ink"
            >
              Imóveis vinculados
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Participações deste proprietário na carteira.
            </p>
          </div>

          {imoveisVinculados.length === 0 ? (
            <p className="pt-6 text-sm text-muted-foreground">
              Nenhum imóvel vinculado a este proprietário.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {imoveisVinculados.map((vinculo) => {
                const imovel = vinculo.imovel!;
                const titulo = [imovel.tipo?.nome ?? "Imóvel", imovel.cidade]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={vinculo.id}>
                    <Link
                      href={`/imoveis/${imovel.id}`}
                      className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 transition-colors hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink underline-offset-4 group-hover:underline">
                          {titulo}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {imovel.endereco_completo ?? "—"} ·{" "}
                          {finalidadeLabels[imovel.finalidade]}
                          {vinculo.percentual_participacao != null
                            ? ` · participação ${vinculo.percentual_participacao}%`
                            : ""}
                          {vinculo.principal ? " · principal" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-mono text-sm text-ink">
                          {imovel.finalidade === "locacao"
                            ? `${formatCurrency(imovel.valor_locacao)} /mês`
                            : formatCurrency(imovel.valor_venda)}
                        </span>
                        <ImovelStatusDot status={imovel.status} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Dados */}
        <aside className="space-y-12 lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
          <section aria-labelledby="contato-heading">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="contato-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Contato e dados pessoais
              </h2>
            </div>
            <dl className="divide-y divide-line">
              <InfoRow label="E-mail" value={proprietario.email} />
              <InfoRow label="WhatsApp" value={proprietario.whatsapp} mono />
              <InfoRow label="Telefone" value={proprietario.telefone} mono />
              <InfoRow
                label="Tel. comercial"
                value={proprietario.telefone_comercial}
                mono
              />
              <InfoRow
                label="Documento"
                value={
                  proprietario.doc_identidade_numero
                    ? `${proprietario.doc_identidade_tipo ?? "Doc"} ${proprietario.doc_identidade_numero}${proprietario.doc_identidade_orgao_exp ? ` · ${proprietario.doc_identidade_orgao_exp}` : ""}`
                    : null
                }
                mono
              />
              <InfoRow
                label="Nascimento"
                value={
                  proprietario.data_nascimento
                    ? formatDate(proprietario.data_nascimento)
                    : null
                }
                mono
              />
              <InfoRow label="Estado civil" value={proprietario.estado_civil} />
              <InfoRow label="Empresa" value={proprietario.empresa} />
              <InfoRow
                label="Endereço"
                value={proprietario.endereco_completo}
              />
              <InfoRow
                label="End. comercial"
                value={proprietario.endereco_comercial}
              />
            </dl>
          </section>

          {podeFinanceiro ? (
            <section
              aria-labelledby="bancarios-heading"
              className="rounded-md border border-gold/60 bg-gold/5 p-6"
            >
              <div className="border-b-2 border-ink pb-3">
                <h2
                  id="bancarios-heading"
                  className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink"
                >
                  <LockSimple size={16} aria-hidden />
                  Dados bancários
                </h2>
              </div>
              {bancarios ? (
                <dl className="divide-y divide-line">
                  <InfoRow label="Banco" value={bancarios.banco} />
                  <InfoRow label="Agência" value={bancarios.agencia} mono />
                  <InfoRow label="Conta" value={bancarios.conta} mono />
                  <InfoRow label="Tipo" value={bancarios.tipo_conta} />
                  <InfoRow label="PIX" value={bancarios.pix} mono />
                </dl>
              ) : (
                <p className="pt-4 text-sm text-muted-foreground">
                  Nenhum dado bancário cadastrado.
                </p>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
