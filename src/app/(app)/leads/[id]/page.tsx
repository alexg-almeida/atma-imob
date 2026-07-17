import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilSimple, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ImovelStatusDot } from "@/components/imoveis/imovel-status";
import {
  InteracoesManager,
  type InteracaoComUsuario,
} from "@/components/leads/interacoes-manager";
import { finalidadeLabels } from "@/lib/imoveis/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  ImovelFinalidade,
  ImovelStatus,
  Lead,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Lead · Atma CRM",
};

type LeadDetalhe = Lead & {
  origem: { nome: string } | null;
  etapa: { nome: string } | null;
  corretor: { nome_completo: string } | null;
  imovel_interesse:
    | {
        id: string;
        cidade: string | null;
        finalidade: ImovelFinalidade;
        status: ImovelStatus;
        valor_venda: number | null;
        valor_locacao: number | null;
        tipo: { nome: string } | null;
      }
    | null;
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

export default async function LeadPage(props: PageProps<"/leads/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select(
      "*, origem:leads_origens(nome), etapa:leads_etapas(nome), corretor:parceiros(nome_completo), imovel_interesse:imoveis(id, cidade, finalidade, status, valor_venda, valor_locacao, tipo:imoveis_tipos(nome))",
    )
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (!data) notFound();
  const lead = data as unknown as LeadDetalhe;

  const [podeEditar, podeRegistrar, { data: interacoes }] = await Promise.all([
    temPermissao("leads", "editar"),
    temPermissao("leads", "criar"),
    supabase
      .from("leads_interacoes")
      .select("*, usuario:core_perfis(nome_completo)")
      .eq("lead_id", id)
      .eq("ativo", true)
      .order("data_interacao", { ascending: false }),
  ]);

  return (
    <>
      <div className="pt-12 pb-10">
        <Link
          href="/leads"
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Leads
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface">
              {lead.foto_url ? (
                <Image
                  src={lead.foto_url}
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle size={30} className="text-strong-line" aria-hidden />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {lead.etapa?.nome ?? "Sem etapa"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
                {lead.nome_completo}
              </h1>
            </div>
          </div>
          {podeEditar ? (
            <Link
              href={`/leads/${id}/editar`}
              className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <PencilSimple size={14} aria-hidden /> Editar
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 border-t border-line pt-12 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          <section aria-labelledby="interacoes-heading">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="interacoes-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Histórico de interações
              </h2>
            </div>
            <div className="pt-6">
              <InteracoesManager
                leadId={id}
                interacoes={(interacoes ?? []) as InteracaoComUsuario[]}
                podeRegistrar={podeRegistrar}
              />
            </div>
          </section>

          {lead.observacoes ? (
            <section aria-labelledby="observacoes-heading">
              <div className="border-b-2 border-ink pb-4">
                <h2
                  id="observacoes-heading"
                  className="text-xl font-semibold tracking-tight text-ink"
                >
                  Observações
                </h2>
              </div>
              <p className="pt-6 text-sm leading-relaxed whitespace-pre-line text-ink">
                {lead.observacoes}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-12 lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
          <section aria-labelledby="contato-heading">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="contato-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Contato
              </h2>
            </div>
            <dl className="divide-y divide-line">
              <InfoRow label="WhatsApp" value={lead.whatsapp} mono />
              <InfoRow label="Telefone 1" value={lead.telefone_1} mono />
              <InfoRow label="Telefone 2" value={lead.telefone_2} mono />
              <InfoRow label="E-mail" value={lead.email} />
              <InfoRow label="Endereço" value={lead.endereco_completo} />
              <InfoRow
                label="Cidade"
                value={[lead.cidade, lead.estado].filter(Boolean).join(" · ") || null}
              />
            </dl>
          </section>

          <section aria-labelledby="atendimento-heading">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="atendimento-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Atendimento
              </h2>
            </div>
            <dl className="divide-y divide-line">
              <InfoRow label="Origem" value={lead.origem?.nome ?? null} />
              <InfoRow label="Corretor" value={lead.corretor?.nome_completo ?? null} />
              <InfoRow label="Última atualização" value={formatDate(lead.updated_at)} mono />
            </dl>
          </section>

          {lead.imovel_interesse ? (
            <section aria-labelledby="interesse-heading">
              <div className="border-b-2 border-ink pb-4">
                <h2
                  id="interesse-heading"
                  className="text-xl font-semibold tracking-tight text-ink"
                >
                  Imóvel de interesse
                </h2>
              </div>
              <Link
                href={`/imoveis/${lead.imovel_interesse.id}`}
                className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-surface"
              >
                <div>
                  <p className="font-medium text-ink underline-offset-4 group-hover:underline">
                    {[lead.imovel_interesse.tipo?.nome ?? "Imóvel", lead.imovel_interesse.cidade]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {finalidadeLabels[lead.imovel_interesse.finalidade]}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono text-sm text-ink">
                    {lead.imovel_interesse.finalidade === "locacao"
                      ? `${formatCurrency(lead.imovel_interesse.valor_locacao)} /mês`
                      : formatCurrency(lead.imovel_interesse.valor_venda)}
                  </span>
                  <ImovelStatusDot status={lead.imovel_interesse.status} />
                </div>
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
