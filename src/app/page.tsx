import { Masthead } from "@/components/masthead";
import { KpiStrip } from "@/components/kpi-strip";
import { LeadsLineChart } from "@/components/charts/leads-line-chart";
import { PortfolioComposition } from "@/components/portfolio-composition";
import { PropertiesTable } from "@/components/properties-table";
import { LeadForm } from "@/components/lead-form";

const today = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

export default function Home() {
  return (
    <>
      <Masthead />

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4 pt-12 pb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-ink">
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

        <KpiStrip />

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
              <LeadsLineChart />
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
              <PortfolioComposition />
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-12 border-t border-line pt-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <PropertiesTable />
          </div>
          <div className="lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
            <LeadForm />
          </div>
        </div>

        <footer className="mt-20 flex items-center justify-between border-t border-line pt-5">
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            Atma Consultoria Imobiliária
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">CRM · v0.1 (mockup)</p>
        </footer>
      </main>
    </>
  );
}
