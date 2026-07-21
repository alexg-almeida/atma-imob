import { A4Page } from "@/components/imoveis/book/a4-page";
import type { BlocoDescriptor } from "@/lib/pdf/blocos";

/** Espaçamento vertical entre blocos consecutivos — usado aqui e no orçamento de altura do empacotador (`use-book-pdf.ts`). */
export const BOOK_GAP_BLOCOS_PX = 20;
/** Distância do topo da área de conteúdo até o primeiro bloco — sempre a mesma, seja logo abaixo do banner (página 1) ou no topo da página (páginas seguintes, sem banner). */
export const BOOK_PADDING_TOPO_PX = 40;
/** Distância do fim do conteúdo até a borda inferior da página. */
export const BOOK_PADDING_BASE_PX = 40;

/**
 * Extraído à parte para poder ser medido isoladamente na passada de
 * medição (`use-book-pdf.ts`) — sua altura real precisa ser descontada do
 * orçamento de altura útil de cada página antes de empacotar os blocos.
 */
export function BookRodape({
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
      <p className="text-xs text-ink">ATMA Consultoria Imobiliária</p>
      <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
        {[cidade, estado].filter(Boolean).join(" - ")} · {numero}/{total}
      </p>
    </div>
  );
}

/**
 * Página do Book. O banner (bloco `"banner"`, só existe na página 1) fica
 * fora da área com `px-10` para poder ocupar a largura inteira da página
 * (efeito "sangria") — todo o resto flui dentro da área com padding, com o
 * rodapé fixado no fim via `mt-auto`, igual à Ficha.
 */
export function BookPagina({
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
  const bannerBloco = blocos.find((bloco) => bloco.id === "banner");
  const outros = blocos.filter((bloco) => bloco.id !== "banner");

  return (
    <A4Page padded={false} className="flex flex-col">
      {bannerBloco ? bannerBloco.node : null}
      <div
        className="flex flex-1 flex-col px-10"
        style={{ paddingTop: BOOK_PADDING_TOPO_PX, paddingBottom: BOOK_PADDING_BASE_PX }}
      >
        <div className="flex flex-1 flex-col" style={{ gap: BOOK_GAP_BLOCOS_PX }}>
          {outros.map((bloco) => (
            <div key={bloco.id}>{bloco.node}</div>
          ))}
        </div>
        <div className="mt-auto">
          <BookRodape numero={numero} total={total} cidade={cidade} estado={estado} />
        </div>
      </div>
    </A4Page>
  );
}
