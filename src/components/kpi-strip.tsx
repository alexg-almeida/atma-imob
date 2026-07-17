export type Kpi = {
  label: string;
  value: string;
  subtitle: string;
};

const CELL_BORDERS = [
  "",
  "border-l",
  "max-xl:border-t xl:border-l",
  "border-l max-xl:border-t",
];

export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 border-y border-line xl:grid-cols-4">
      {items.map((kpi, index) => (
        <div
          key={kpi.label}
          className={`border-line px-5 py-7 sm:px-6 ${CELL_BORDERS[index]}`}
        >
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {kpi.label}
          </p>
          <p className="mt-3 font-mono text-[2.6rem] leading-none font-medium tracking-tight text-ink">
            {kpi.value}
          </p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            {kpi.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
