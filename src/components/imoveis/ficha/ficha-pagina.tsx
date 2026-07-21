import { A4Page } from "@/components/imoveis/book/a4-page";
import type { BlocoDescriptor } from "./ficha-blocos";

/** Espaçamento vertical entre blocos consecutivos — usado aqui e no orçamento de altura do empacotador (`use-ficha-pdf.ts`). */
export const FICHA_GAP_BLOCOS_PX = 18;

/**
 * Extraído à parte para poder ser medido isoladamente na passada de
 * medição (`use-ficha-pdf.ts`) — sua altura real precisa ser descontada do
 * orçamento de altura útil de cada página antes de empacotar os blocos.
 */
export function FichaRodape({
  numero,
  total,
  cidade,
  estado,
}: {
  numero: number;
  total: number;
  cidade: string | null;
  estado: string | null;
}) {
  return (
    <div className="flex items-center justify-between border-t border-line pt-4">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- captura via html2canvas */}
        <img
          src="/brand/atma-mark-square.png"
          alt=""
          crossOrigin="anonymous"
          className="h-5 w-5"
        />
        <span className="text-[10px] font-semibold tracking-[0.18em] text-ink uppercase">
          Atma Consultoria Imobiliária
        </span>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        {[cidade, estado].filter(Boolean).join(" - ")} · {numero}/{total}
      </p>
    </div>
  );
}

export function FichaPagina({
  blocos,
  numero,
  total,
  cidade,
  estado,
}: {
  blocos: BlocoDescriptor[];
  numero: number;
  total: number;
  cidade: string | null;
  estado: string | null;
}) {
  return (
    <A4Page className="flex flex-col">
      <div className="flex flex-1 flex-col" style={{ gap: FICHA_GAP_BLOCOS_PX }}>
        {blocos.map((bloco) => (
          <div key={bloco.id}>{bloco.node}</div>
        ))}
      </div>
      <div className="mt-auto">
        <FichaRodape numero={numero} total={total} cidade={cidade} estado={estado} />
      </div>
    </A4Page>
  );
}
