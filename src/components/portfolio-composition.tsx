import { statusColors } from "@/lib/imoveis/constants";
import type { ImovelStatus } from "@/lib/supabase/types";

export type PortfolioItem = {
  status: ImovelStatus;
  label: string;
  count: number;
};

export function PortfolioComposition({ items }: { items: PortfolioItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum imóvel cadastrado ainda.
      </p>
    );
  }

  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`Composição da carteira: ${items
          .map((item) => `${item.label} ${item.count}`)
          .join(", ")}`}
      >
        {items.map((item) => (
          <div
            key={item.status}
            style={{
              width: `${(item.count / total) * 100}%`,
              backgroundColor: statusColors[item.status],
            }}
          />
        ))}
      </div>

      <ul className="mt-6">
        {items.map((item) => (
          <li
            key={item.status}
            className="flex items-baseline justify-between border-b border-line py-3.5 last:border-0"
          >
            <span className="flex items-center gap-2.5 text-sm text-ink">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: statusColors[item.status] }}
                aria-hidden
              />
              {item.label}
            </span>
            <span className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-ink">{item.count}</span>
              <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                {Math.round((item.count / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted-foreground">
        {total} imóveis sob administração da Atma
      </p>
    </div>
  );
}
