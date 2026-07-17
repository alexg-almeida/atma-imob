import Link from "next/link";
import { corEtapa } from "@/lib/leads/constants";
import { formatDate } from "@/lib/format";

export type LeadRecente = {
  id: string;
  nome_completo: string;
  etapaNome: string | null;
  created_at: string;
};

export function LeadsRecentes({ leads }: { leads: LeadRecente[] }) {
  return (
    <section aria-labelledby="leads-recentes-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <h2
            id="leads-recentes-heading"
            className="text-xl font-semibold tracking-tight text-ink"
          >
            Leads recentes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Últimos contatos registrados na carteira
          </p>
        </div>
        <Link
          href="/leads/novo"
          className="rounded-sm bg-primary px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Novo lead
        </Link>
      </div>

      {leads.length === 0 ? (
        <p className="pt-6 text-sm text-muted-foreground">
          Nenhum lead cadastrado ainda.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {leads.map((lead) => (
            <li key={lead.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <Link
                  href={`/leads/${lead.id}`}
                  className="block truncate text-sm font-medium text-ink underline-offset-4 hover:underline"
                >
                  {lead.nome_completo}
                </Link>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: corEtapa(lead.etapaNome ?? "") }}
                    aria-hidden
                  />
                  {lead.etapaNome ?? "Sem etapa"}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {formatDate(lead.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
