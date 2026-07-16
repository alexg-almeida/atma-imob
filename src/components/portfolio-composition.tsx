import { portfolioBreakdown, type PropertyStatus } from "@/lib/mock-data";

const STATUS_COLORS: Record<PropertyStatus, string> = {
  Disponível: "var(--color-sage)",
  Reservado: "var(--color-gold)",
  Alugado: "var(--color-slate)",
  Vendido: "var(--color-ink)",
};

const total = portfolioBreakdown.reduce((sum, item) => sum + item.count, 0);

export function PortfolioComposition() {
  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`Composição da carteira: ${portfolioBreakdown
          .map((item) => `${item.status} ${item.count}`)
          .join(", ")}`}
      >
        {portfolioBreakdown.map((item) => (
          <div
            key={item.status}
            style={{
              width: `${(item.count / total) * 100}%`,
              backgroundColor: STATUS_COLORS[item.status],
            }}
          />
        ))}
      </div>

      <ul className="mt-6">
        {portfolioBreakdown.map((item) => (
          <li
            key={item.status}
            className="flex items-baseline justify-between border-b border-line py-3.5 last:border-0"
          >
            <span className="flex items-center gap-2.5 text-sm text-ink">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] }}
                aria-hidden
              />
              {item.status}
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
