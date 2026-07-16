"use client";

import { useMemo, useState } from "react";
import { properties } from "@/lib/mock-data";
import { StatusDot } from "@/components/ui/status-dot";
import { Toggle } from "@/components/ui/toggle";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function PropertiesTable() {
  const [onlyActive, setOnlyActive] = useState(false);

  const rows = useMemo(
    () =>
      onlyActive
        ? properties.filter((property) => property.status !== "Vendido")
        : properties,
    [onlyActive],
  );

  return (
    <section aria-labelledby="properties-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <h2
            id="properties-heading"
            className="text-xl font-semibold tracking-tight text-ink"
          >
            Imóveis recentes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Últimas atualizações na carteira administrada
          </p>
        </div>
        <Toggle
          id="only-active"
          checked={onlyActive}
          onChange={setOnlyActive}
          label="Somente ativos"
        />
      </div>

      <table className="w-full border-collapse text-sm">
        <colgroup>
          <col className="w-[44%]" />
          <col className="w-[22%]" />
          <col className="w-[18%]" />
          <col className="w-[16%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-line text-left text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            <th className="py-3 pr-3 font-semibold">Imóvel</th>
            <th className="px-3 py-3 font-semibold max-md:hidden">
              Proprietário
            </th>
            <th className="px-3 py-3 font-semibold">Valor</th>
            <th className="py-3 pl-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((property) => (
            <tr
              key={property.id}
              className="group border-b border-line transition-colors duration-150 last:border-0 hover:bg-surface"
            >
              <td className="py-4 pr-3">
                <p className="font-medium text-ink">{property.title}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {property.id} · {property.neighborhood}
                </p>
              </td>
              <td className="px-3 py-4 text-ink max-md:hidden">
                {property.owner}
              </td>
              <td className="px-3 py-4">
                <p className="font-mono text-ink">
                  {currency.format(property.value)}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {property.area} m²
                </p>
              </td>
              <td className="py-4 pl-3">
                <StatusDot status={property.status} />
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-12 text-center text-muted-foreground">
                Nenhum imóvel ativo encontrado.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
