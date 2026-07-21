import Link from "next/link";

export type Kpi = {
  label: string;
  value: string;
  subtitle: string;
  href?: string;
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
          className={`border-line ${CELL_BORDERS[index]}`}
        >
          <Link
            href={kpi.href ?? "#"}
            aria-disabled={!kpi.href}
            tabIndex={kpi.href ? undefined : -1}
            className={`group block px-5 py-7 sm:px-6 ${
              kpi.href
                ? "transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
                : "pointer-events-none"
            }`}
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {kpi.label}
            </p>
            <p className="mt-3 font-mono text-[2.35rem] leading-none font-medium tracking-tight text-ink sm:text-[2.6rem]">
              {kpi.value}
            </p>
            <p className="mt-3 text-xs font-medium text-muted-foreground group-hover:text-ink">
              {kpi.subtitle}
            </p>
          </Link>
        </div>
      ))}
    </div>
  );
}
