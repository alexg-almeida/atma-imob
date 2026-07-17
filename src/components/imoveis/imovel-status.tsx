import { statusColors, statusLabels } from "@/lib/imoveis/constants";
import type { ImovelStatus } from "@/lib/supabase/types";

export function ImovelStatusDot({ status }: { status: ImovelStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: statusColors[status] }}
        aria-hidden
      />
      {statusLabels[status]}
    </span>
  );
}
