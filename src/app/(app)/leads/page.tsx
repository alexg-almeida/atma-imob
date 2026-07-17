import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { LeadsTabela, type LeadTabelaItem } from "@/components/leads/leads-tabela";

export const metadata: Metadata = {
  title: "Leads · Atma CRM",
};

export default async function LeadsPage() {
  const supabase = await createClient();

  const [{ data: etapas }, { data: leads }, podeEditar] = await Promise.all([
    supabase
      .from("leads_etapas")
      .select("id, nome, ordem")
      .eq("ativo", true)
      .order("ordem"),
    supabase
      .from("leads")
      .select(
        "*, corretor:parceiros(nome_completo), imovel_interesse:imoveis(cidade, tipo:imoveis_tipos(nome))",
      )
      .eq("ativo", true)
      .order("updated_at", { ascending: false }),
    temPermissao("leads", "editar"),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-12 pb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-ink">
            Leads
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Clique na etapa de um lead para atualizá-la.
          </p>
        </div>
        <Link
          href="/leads/novo"
          className="rounded-sm bg-primary px-4 py-3 text-[13px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Novo lead
        </Link>
      </div>

      {!etapas || etapas.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhuma etapa de funil cadastrada.
        </p>
      ) : (
        <LeadsTabela
          etapas={etapas}
          leads={(leads ?? []) as LeadTabelaItem[]}
          podeEditar={podeEditar}
        />
      )}
    </>
  );
}
