import Link from "next/link";
import { ArrowRight, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { KpiStrip, type Kpi } from "@/components/kpi-strip";
import { LeadsLineChart, type LeadsPorMes } from "@/components/charts/leads-line-chart";
import { PortfolioComposition, type PortfolioItem } from "@/components/portfolio-composition";
import { PropertiesTable, type PropertiesTableItem } from "@/components/properties-table";
import { LeadsRecentes, type LeadRecente } from "@/components/leads-recentes";
import { statusOptions } from "@/lib/imoveis/constants";
import type { ImovelStatus } from "@/lib/supabase/types";

const today = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

const MESES_ABREV = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

type ImovelRecente = {
  id: string;
  cidade: string | null;
  status: ImovelStatus;
  finalidade: "venda" | "locacao" | "ambos";
  valor_venda: number | null;
  valor_locacao: number | null;
  tipo: { nome: string } | null;
  proprietarios: { principal: boolean; proprietario: { nome_completo: string } | null }[];
};

type ImovelResumo = {
  status: ImovelStatus;
  finalidade: "venda" | "locacao" | "ambos";
  tipo_id: string | null;
  endereco_completo: string | null;
  cidade: string | null;
  valor_venda: number | null;
  valor_locacao: number | null;
};

type LeadLinha = {
  id: string;
  nome_completo: string;
  created_at: string;
  etapa: { nome: string } | null;
};

export default async function Home() {
  const supabase = await createClient();

  const [
    { data: imoveisStatus },
    { data: leadsData },
    { data: imoveisRecentesData },
    { data: leadsRecentesData },
  ] = await Promise.all([
    supabase
      .from("imoveis")
      .select("status, finalidade, tipo_id, endereco_completo, cidade, valor_venda, valor_locacao")
      .eq("ativo", true),
    supabase
      .from("leads")
      .select("id, created_at, etapa:leads_etapas(nome)")
      .eq("ativo", true),
    supabase
      .from("imoveis")
      .select(
        "id, cidade, status, finalidade, valor_venda, valor_locacao, tipo:imoveis_tipos(nome), proprietarios:imoveis_proprietarios(principal, proprietario:proprietarios(nome_completo))",
      )
      .eq("ativo", true)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("leads")
      .select("id, nome_completo, created_at, etapa:leads_etapas(nome)")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const imoveisResumo = (imoveisStatus ?? []) as ImovelResumo[];
  const statusList = imoveisResumo.map((imovel) => imovel.status);
  const totalImoveis = statusList.length;
  const imoveisAtivos = statusList.filter((s) => s === "ativo").length;
  const imoveisReservados = statusList.filter((s) => s === "reservado").length;

  const breakdown: PortfolioItem[] = statusOptions
    .map(([status, label]) => ({
      status,
      label,
      count: statusList.filter((s) => s === status).length,
    }))
    .filter((item) => item.count > 0);

  const leadsList = (leadsData ?? []) as unknown as Pick<LeadLinha, "id" | "created_at" | "etapa">[];
  const leadsAbertos = leadsList.filter(
    (l) => !["fechado", "perdido"].includes((l.etapa?.nome ?? "").toLowerCase()),
  ).length;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const leadsNovosMes = leadsList.filter(
    (l) => new Date(l.created_at) >= inicioMes,
  ).length;

  const imoveisIncompletos = imoveisResumo.filter((imovel) => {
    const semValorVenda =
      imovel.finalidade !== "locacao" && imovel.valor_venda == null;
    const semValorLocacao =
      imovel.finalidade !== "venda" && imovel.valor_locacao == null;
    return (
      !imovel.tipo_id ||
      !imovel.endereco_completo ||
      !imovel.cidade ||
      semValorVenda ||
      semValorLocacao
    );
  }).length;

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const leadsAntigosEmAberto = leadsList.filter(
    (lead) =>
      !["fechado", "perdido"].includes((lead.etapa?.nome ?? "").toLowerCase()) &&
      new Date(lead.created_at) < seteDiasAtras,
  ).length;

  const kpis: Kpi[] = [
    {
      label: "Imóveis ativos",
      value: String(imoveisAtivos),
      subtitle: `${totalImoveis} imóveis na carteira`,
      href: "/imoveis?status=ativo",
    },
    {
      label: "Imóveis reservados",
      value: String(imoveisReservados),
      subtitle: "Aguardando fechamento",
      href: "/imoveis?status=reservado",
    },
    {
      label: "Leads em aberto",
      value: String(leadsAbertos),
      subtitle: `${leadsList.length} leads no total`,
      href: "/leads",
    },
    {
      label: "Leads novos no mês",
      value: String(leadsNovosMes),
      subtitle: "Desde o dia 1º",
      href: "/leads",
    },
  ];

  const hoje = new Date();
  const meses: { key: string; month: string; leads: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MESES_ABREV[d.getMonth()], leads: 0 });
  }
  for (const lead of leadsList) {
    const d = new Date(lead.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = meses.find((m) => m.key === key);
    if (bucket) bucket.leads += 1;
  }
  const leadsPorMes: LeadsPorMes[] = meses.map(({ month, leads }) => ({ month, leads }));

  const imoveisRecentes: PropertiesTableItem[] = (
    (imoveisRecentesData ?? []) as unknown as ImovelRecente[]
  ).map((imovel) => {
    const principal =
      imovel.proprietarios.find((v) => v.principal) ?? imovel.proprietarios[0];
    return {
      id: imovel.id,
      titulo: imovel.tipo?.nome ?? "Imóvel",
      cidade: imovel.cidade,
      proprietario: principal?.proprietario?.nome_completo ?? null,
      valor: imovel.finalidade === "locacao" ? imovel.valor_locacao : imovel.valor_venda,
      status: imovel.status,
    };
  });

  const leadsRecentes: LeadRecente[] = (
    (leadsRecentesData ?? []) as unknown as LeadLinha[]
  ).map((lead) => ({
    id: lead.id,
    nome_completo: lead.nome_completo,
    etapaNome: lead.etapa?.nome ?? null,
    created_at: lead.created_at,
  }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-10 pb-7">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Operação Atma
          </p>
          <h1 className="mt-1 text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
            Painel geral
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Visão consolidada dos imóveis administrados e da carteira de
            clientes.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground first-letter:uppercase">
          {today}
        </p>
      </div>

      <KpiStrip items={kpis} />

      <section aria-labelledby="atencao-heading" className="border-b border-line py-8">
        <div className="flex items-center gap-2">
          <WarningCircle size={18} className="text-gold" weight="fill" aria-hidden />
          <h2
            id="atencao-heading"
            className="text-sm font-semibold tracking-[0.12em] text-ink uppercase"
          >
            Atenção hoje
          </h2>
        </div>
        <div className="mt-4 grid gap-x-12 lg:grid-cols-2">
          <Link
            href="/imoveis"
            className="group flex min-h-12 items-center justify-between gap-4 border-t border-line py-3 text-sm text-ink"
          >
            <span>Cadastros de imóveis com informações essenciais pendentes</span>
            <span className="flex shrink-0 items-center gap-3 font-mono">
              {imoveisIncompletos}
              <ArrowRight size={15} className="text-strong-line group-hover:text-primary" aria-hidden />
            </span>
          </Link>
          <Link
            href="/leads"
            className="group flex min-h-12 items-center justify-between gap-4 border-t border-line py-3 text-sm text-ink"
          >
            <span>Leads em aberto cadastrados há mais de 7 dias</span>
            <span className="flex shrink-0 items-center gap-3 font-mono">
              {leadsAntigosEmAberto}
              <ArrowRight size={15} className="text-strong-line group-hover:text-primary" aria-hidden />
            </span>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-12 pt-12 pb-14 lg:grid-cols-12">
        <section aria-labelledby="leads-heading" className="lg:col-span-7">
          <div className="border-b-2 border-ink pb-4">
            <h2
              id="leads-heading"
              className="text-xl font-semibold tracking-tight text-ink"
            >
              Novos leads
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Captação mensal nos últimos 6 meses
            </p>
          </div>
          <div className="pt-6">
            <LeadsLineChart data={leadsPorMes} />
          </div>
        </section>

        <section
          aria-labelledby="portfolio-heading"
          className="lg:col-span-5 lg:border-l lg:border-line lg:pl-12"
        >
          <div className="border-b-2 border-ink pb-4">
            <h2
              id="portfolio-heading"
              className="text-xl font-semibold tracking-tight text-ink"
            >
              Carteira de imóveis
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Distribuição por status atual
            </p>
          </div>
          <div className="pt-6">
            <PortfolioComposition items={breakdown} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-12 border-t border-line pt-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <PropertiesTable items={imoveisRecentes} />
        </div>
        <div className="lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
          <LeadsRecentes leads={leadsRecentes} />
        </div>
      </div>

      <footer className="mt-20 flex items-center justify-between border-t border-line pt-5">
        <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Atma Consultoria Imobiliária
        </p>
      </footer>
    </>
  );
}
