import Link from "next/link";
import { finalidadeOptions, statusOptions } from "@/lib/imoveis/constants";
import { FiltroValorInput } from "@/components/imoveis/filtro-valor-input";
import type { ImovelTipo } from "@/lib/supabase/types";

const selectBase =
  "min-h-10 w-full cursor-pointer border-0 border-b border-line bg-transparent py-2 text-sm text-ink outline-none transition-colors duration-150 focus:border-primary";

const inputBase =
  "min-h-10 w-full border-0 border-b border-line bg-transparent py-2 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-muted-foreground focus:border-primary";

/** Mesmo visual de `inputBase`, mas para o componente shadcn Input (que traz
 * borda/raio/padding próprios que precisam ser zerados). */
const currencyInputBase =
  "min-h-10 rounded-none border-0 border-b border-line bg-transparent px-0 py-2 text-sm text-ink shadow-none outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0";

const labelBase =
  "text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

export type ImoveisFiltrosValues = {
  finalidade?: string;
  status?: string;
  tipo?: string;
  cidade?: string;
  valor_min?: string;
  valor_max?: string;
};

export function ImoveisFiltros({
  values,
  tipos,
  total,
}: {
  values: ImoveisFiltrosValues;
  tipos: Pick<ImovelTipo, "id" | "nome">[];
  total: number;
}) {
  const temFiltro = Object.values(values).some(Boolean);

  return (
    <form
      method="get"
      action="/imoveis"
      className="border-t border-line py-6"
      aria-label="Filtros de imóveis"
    >
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Refinar carteira
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {total} {total === 1 ? "imóvel encontrado" : "imóveis encontrados"}
        </p>
      </div>

      <div className="grid grid-cols-2 items-end gap-x-5 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={labelBase}>Finalidade</span>
          <select
            name="finalidade"
            defaultValue={values.finalidade ?? ""}
            className={`${selectBase} w-full`}
          >
            <option value="">Todas</option>
            {finalidadeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={labelBase}>Status</span>
          <select
            name="status"
            defaultValue={values.status ?? ""}
            className={`${selectBase} w-full`}
          >
            <option value="">Todos</option>
            {statusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={labelBase}>Tipo</span>
          <select
            name="tipo"
            defaultValue={values.tipo ?? ""}
            className={`${selectBase} w-full`}
          >
            <option value="">Todos</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={labelBase}>Cidade</span>
          <input
            type="text"
            name="cidade"
            defaultValue={values.cidade ?? ""}
            placeholder="Ribeirão Preto"
            className={inputBase}
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={labelBase}>Valor de</span>
          <FiltroValorInput
            name="valor_min"
            defaultValue={values.valor_min ?? ""}
            placeholder="0,00"
            className={`${currencyInputBase} font-mono`}
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={labelBase}>Valor até</span>
          <FiltroValorInput
            name="valor_max"
            defaultValue={values.valor_max ?? ""}
            placeholder="2.000.000,00"
            className={`${currencyInputBase} font-mono`}
          />
        </label>

        <div className="col-span-2 flex min-h-11 items-center gap-5 sm:col-span-3 lg:col-span-6">
          <button
            type="submit"
            className="min-h-11 rounded-sm bg-primary px-5 text-[12px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Filtrar
          </button>
          {temFiltro ? (
            <Link
              href="/imoveis"
              className="text-[12px] font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
            >
              Limpar
            </Link>
          ) : null}
        </div>
      </div>

    </form>
  );
}
