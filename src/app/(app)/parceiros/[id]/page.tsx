import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilSimple, UserCircleCheck } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ImovelStatusDot } from "@/components/imoveis/imovel-status";
import { ExcluirRegistroButton } from "@/components/excluir-registro-button";
import { Button } from "@/components/ui/button";
import { finalidadeLabels } from "@/lib/imoveis/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { parceiroTipoLabels } from "@/lib/supabase/types";
import type {
  ImovelFinalidade,
  ImovelStatus,
  Parceiro,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Parceiro · Atma CRM",
};

type ImovelCaptado = {
  id: string;
  finalidade: ImovelFinalidade;
  status: ImovelStatus;
  cidade: string | null;
  valor_venda: number | null;
  valor_locacao: number | null;
  ativo: boolean;
  tipo: { nome: string } | null;
};

type LeadAtribuido = {
  id: string;
  nome_completo: string;
  whatsapp: string | null;
  updated_at: string;
  ativo: boolean;
  etapa: { nome: string } | null;
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

export default async function ParceiroPage(
  props: PageProps<"/parceiros/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("parceiros")
    .select("*, perfil:core_perfis(nome_completo)")
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (!data) notFound();
  const parceiro = data as Parceiro & { perfil: { nome_completo: string } | null };

  const ehCaptador = parceiro.tipo === "captador" || parceiro.tipo === "ambos";
  const ehCorretor = parceiro.tipo === "corretor" || parceiro.tipo === "ambos";

  const [
    podeEditar,
    podeExcluir,
    podeExcluirDefinitivamente,
    { data: imoveis },
    { data: leads },
  ] = await Promise.all([
    temPermissao("parceiros", "editar"),
    temPermissao("parceiros", "excluir"),
    temPermissao("core", "editar"),
    ehCaptador
      ? supabase
          .from("imoveis")
          .select(
            "id, finalidade, status, cidade, valor_venda, valor_locacao, ativo, tipo:imoveis_tipos(nome)",
          )
          .eq("captador_id", id)
          .eq("ativo", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as ImovelCaptado[] }),
    ehCorretor
      ? supabase
          .from("leads")
          .select("id, nome_completo, whatsapp, updated_at, ativo, etapa:leads_etapas(nome)")
          .eq("corretor_id", id)
          .eq("ativo", true)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] as LeadAtribuido[] }),
  ]);

  const imoveisCaptados = ((imoveis ?? []) as unknown as ImovelCaptado[]).filter(
    (i) => i.ativo,
  );
  const leadsAtribuidos = ((leads ?? []) as unknown as LeadAtribuido[]).filter(
    (l) => l.ativo,
  );

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href="/parceiros"
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Parceiros
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {parceiroTipoLabels[parceiro.tipo]}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              {parceiro.nome_completo}
            </h1>
            {parceiro.perfil ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-primary">
                <UserCircleCheck size={16} aria-hidden />
                Acessa o sistema como {parceiro.perfil.nome_completo}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {podeEditar ? (
              <Button size="sm" asChild>
                <Link href={`/parceiros/${id}/editar`}>
                  <PencilSimple size={14} aria-hidden /> Editar
                </Link>
              </Button>
            ) : null}
            {podeExcluir ? (
              <ExcluirRegistroButton
                tabela="parceiros"
                id={id}
                redirectTo="/parceiros"
                titulo="Excluir parceiro"
                descricao="O parceiro será removido da listagem. Essa ação não pode ser desfeita."
                podeExcluirDefinitivamente={podeExcluirDefinitivamente}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 border-t border-line pt-12 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          {ehCaptador ? (
            <section aria-labelledby="captados-heading">
              <div className="border-b-2 border-ink pb-4">
                <h2
                  id="captados-heading"
                  className="text-xl font-semibold tracking-tight text-ink"
                >
                  Imóveis captados
                </h2>
              </div>
              {imoveisCaptados.length === 0 ? (
                <p className="pt-6 text-sm text-muted-foreground">
                  Nenhum imóvel captado por este parceiro.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {imoveisCaptados.map((imovel) => {
                    const titulo = [imovel.tipo?.nome ?? "Imóvel", imovel.cidade]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <li key={imovel.id}>
                        <Link
                          href={`/imoveis/${imovel.id}`}
                          className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 transition-colors hover:bg-surface"
                        >
                          <div>
                            <p className="font-medium text-ink underline-offset-4 group-hover:underline">
                              {titulo}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {finalidadeLabels[imovel.finalidade]}
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
          ) : null}

          {ehCorretor ? (
            <section aria-labelledby="leads-heading">
              <div className="border-b-2 border-ink pb-4">
                <h2
                  id="leads-heading"
                  className="text-xl font-semibold tracking-tight text-ink"
                >
                  Leads atribuídos
                </h2>
              </div>
              {leadsAtribuidos.length === 0 ? (
                <p className="pt-6 text-sm text-muted-foreground">
                  Nenhum lead atribuído a este corretor.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {leadsAtribuidos.map((lead) => (
                    <li key={lead.id}>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 transition-colors hover:bg-surface"
                      >
                        <div>
                          <p className="font-medium text-ink underline-offset-4 group-hover:underline">
                            {lead.nome_completo}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {lead.whatsapp ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-sm text-ink">
                            {lead.etapa?.nome ?? "—"}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatDate(lead.updated_at)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>

        <aside className="lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
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
              <InfoRow label="E-mail" value={parceiro.email} />
              <InfoRow label="WhatsApp" value={parceiro.whatsapp} mono />
              <InfoRow label="Telefone" value={parceiro.telefone} mono />
              <InfoRow label="CRECI" value={parceiro.creci} mono />
              <InfoRow
                label="Comissão padrão"
                value={
                  parceiro.comissao_padrao_percentual != null
                    ? `${parceiro.comissao_padrao_percentual}%`
                    : null
                }
                mono
              />
            </dl>
          </section>

          <section aria-labelledby="bancarios-heading" className="mt-12">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="bancarios-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Dados bancários
              </h2>
            </div>
            <dl className="divide-y divide-line">
              <InfoRow label="Banco" value={parceiro.banco} />
              <InfoRow label="Agência" value={parceiro.agencia} mono />
              <InfoRow label="Conta" value={parceiro.conta} mono />
              <InfoRow label="Tipo" value={parceiro.tipo_conta} />
              <InfoRow label="PIX" value={parceiro.pix} mono />
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
