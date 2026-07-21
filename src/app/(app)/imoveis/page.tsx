import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  ImovelCard,
  type ImovelListItem,
} from "@/components/imoveis/imovel-card";
import {
  ImoveisFiltros,
  type ImoveisFiltrosValues,
} from "@/components/imoveis/imoveis-filtros";

export const metadata: Metadata = {
  title: "Imóveis · Atma CRM",
};

function parseValor(raw?: string) {
  if (!raw) return null;
  const parsed = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Remove caracteres que quebram a sintaxe or() do PostgREST. */
function sanitize(term: string) {
  return term.replace(/[,()%]/g, " ").trim();
}

export default async function ImoveisPage(props: PageProps<"/imoveis">) {
  const searchParams = await props.searchParams;
  const values: ImoveisFiltrosValues = {
    finalidade:
      typeof searchParams.finalidade === "string"
        ? searchParams.finalidade
        : undefined,
    status:
      typeof searchParams.status === "string" ? searchParams.status : undefined,
    tipo: typeof searchParams.tipo === "string" ? searchParams.tipo : undefined,
    cidade:
      typeof searchParams.cidade === "string" ? searchParams.cidade : undefined,
    valor_min:
      typeof searchParams.valor_min === "string"
        ? searchParams.valor_min
        : undefined,
    valor_max:
      typeof searchParams.valor_max === "string"
        ? searchParams.valor_max
        : undefined,
  };

  const supabase = await createClient();

  const { data: tipos } = await supabase
    .from("imoveis_tipos")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  let query = supabase
    .from("imoveis")
    .select(
      "*, tipo:imoveis_tipos(nome), fotos:imoveis_fotos(url, capa, ordem, ativo)",
    )
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (values.finalidade === "venda" || values.finalidade === "locacao") {
    query = query.in("finalidade", [values.finalidade, "ambos"]);
  } else if (values.finalidade === "ambos") {
    query = query.eq("finalidade", "ambos");
  }

  if (values.status) {
    query = query.eq("status", values.status);
  }

  if (values.tipo) {
    query = query.eq("tipo_id", values.tipo);
  }

  if (values.cidade) {
    query = query.ilike("cidade", `%${sanitize(values.cidade)}%`);
  }

  const min = parseValor(values.valor_min);
  const max = parseValor(values.valor_max);
  // Faixa de valor: com finalidade filtrada, aplica no campo coerente;
  // sem finalidade, basta um dos dois valores estar na faixa.
  if (min != null || max != null) {
    const faixa = (campo: string) =>
      [
        min != null ? `${campo}.gte.${min}` : null,
        max != null ? `${campo}.lte.${max}` : null,
      ]
        .filter(Boolean)
        .join(",");
    if (values.finalidade === "locacao") {
      if (min != null) query = query.gte("valor_locacao", min);
      if (max != null) query = query.lte("valor_locacao", max);
    } else if (values.finalidade) {
      if (min != null) query = query.gte("valor_venda", min);
      if (max != null) query = query.lte("valor_venda", max);
    } else {
      query = query.or(
        `and(${faixa("valor_venda")}),and(${faixa("valor_locacao")})`,
      );
    }
  }

  const { data: imoveis, error } = await query;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5 pt-10 pb-7">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Carteira administrada
          </p>
          <h1 className="mt-1 text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
            Imóveis
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Carteira de imóveis administrados pela Atma.
          </p>
        </div>
        <Button asChild>
          <Link href="/imoveis/novo">Cadastrar imóvel</Link>
        </Button>
      </div>

      <ImoveisFiltros
        values={values}
        tipos={tipos ?? []}
        total={imoveis?.length ?? 0}
      />

      {error ? (
        <p className="py-12 text-center text-sm text-alert">
          Não foi possível carregar os imóveis: {error.message}
        </p>
      ) : null}

      {!error && (imoveis?.length ?? 0) === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum imóvel encontrado com os filtros atuais.
          </p>
          <Link
            href="/imoveis/novo"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
          >
            Cadastrar o primeiro imóvel →
          </Link>
        </div>
      ) : null}

      <div className="divide-y divide-line border-y border-line">
        {(imoveis as ImovelListItem[] | null)?.map((imovel) => (
          <ImovelCard key={imovel.id} imovel={imovel} />
        ))}
      </div>
    </>
  );
}
