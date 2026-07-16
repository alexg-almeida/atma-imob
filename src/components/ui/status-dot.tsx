import type { PropertyStatus } from "@/lib/mock-data";

const STATUS_COLORS: Record<PropertyStatus, string> = {
  Disponível: "var(--color-sage)",
  Reservado: "var(--color-gold)",
  Alugado: "var(--color-slate)",
  Vendido: "var(--color-ink)",
};

export function StatusDot({ status }: { status: PropertyStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[status] }}
        aria-hidden
      />
      {status}
    </span>
  );
}
