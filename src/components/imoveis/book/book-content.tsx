import { A4_PX } from "@/lib/pdf/capturar-paginas";
import type { BlocoDescriptor } from "@/lib/pdf/blocos";
import { montarBlocosDoBook, type BookDados } from "@/components/imoveis/book/book-blocos";
import {
  BookPagina,
  BookRodape,
  BOOK_GAP_BLOCOS_PX,
  BOOK_PADDING_BASE_PX,
  BOOK_PADDING_TOPO_PX,
} from "@/components/imoveis/book/book-pagina";
import type { ImovelFoto } from "@/lib/supabase/types";

/** Largura de conteúdo dentro da página, descontado o `px-10` (40px de cada lado) — o banner foge dessa largura de propósito, para sangrar até a borda. */
export const BOOK_CONTEUDO_LARGURA_PX = A4_PX.width - 40 * 2;

/**
 * Passada de medição: os mesmos blocos de `montarBlocosDoBook`, soltos (sem
 * casca de página, altura livre). O banner é medido isolado, na largura
 * cheia da página (sem `px-10`) — exatamente como aparece na página real —
 * os demais blocos, na largura de conteúdo já descontando o padding.
 */
export function BookMedidor({ dados }: { dados: BookDados }) {
  const blocos = montarBlocosDoBook(dados);
  const bannerBloco = blocos.find((bloco) => bloco.id === "banner");
  const outros = blocos.filter((bloco) => bloco.id !== "banner");

  return (
    <div style={{ width: A4_PX.width }} className="flex flex-col bg-white font-sans text-ink">
      {bannerBloco ? <div data-block={bannerBloco.id}>{bannerBloco.node}</div> : null}
      <div
        style={{
          width: BOOK_CONTEUDO_LARGURA_PX,
          paddingTop: BOOK_PADDING_TOPO_PX,
          paddingBottom: BOOK_PADDING_BASE_PX,
        }}
        className="flex flex-col px-10"
      >
        <div className="flex flex-col" style={{ gap: BOOK_GAP_BLOCOS_PX }}>
          {outros.map((bloco) => (
            <div
              key={bloco.id}
              data-block={bloco.id}
              data-force-page-break={bloco.forcePageBreakBefore ? "true" : undefined}
            >
              {bloco.node}
            </div>
          ))}
        </div>
        {/* Cópia isolada do rodapé só para medir sua altura real (o rodapé
            em si não passa pelo empacotador — é fixo em toda página). */}
        <div data-rodape-medidor>
          <BookRodape numero={1} total={1} cidade={null} estado={null} />
        </div>
      </div>
    </div>
  );
}

/** Passada final: os mesmos blocos, distribuídos nas páginas decididas pelo empacotador. */
export function BookContent({ dados, paginas }: { dados: BookDados; paginas: string[][] }) {
  const blocos = montarBlocosDoBook(dados);
  const blocosPorId = new Map(blocos.map((b) => [b.id, b]));

  return (
    <>
      {paginas.map((ids, index) => (
        <BookPagina
          key={index}
          numero={index + 1}
          total={paginas.length}
          cidade={dados.imovel.cidade}
          estado={dados.imovel.estado}
          blocos={ids
            .map((id) => blocosPorId.get(id))
            .filter((b): b is BlocoDescriptor => Boolean(b))}
        />
      ))}
    </>
  );
}

/**
 * Fotos usadas no book: capa (banner) + até 6 na grade da primeira página de
 * fotos. Quando há mais de 6 fotos na galeria, prioriza as marcadas com
 * `usar_no_book` (escolha manual na tela de fotos do imóvel); caso nenhuma
 * esteja marcada, usa as 6 primeiras por ordem. Centralizado aqui para o
 * botão de geração recortar (cover-fit) exatamente essas fotos antes de
 * capturar.
 */
export function fotosDoBook(fotos: ImovelFoto[]) {
  const capa = fotos.find((f) => f.capa) ?? fotos[0];
  const galeria = fotos.filter((f) => f.id !== capa?.id);
  const selecionadas = galeria.filter((f) => f.usar_no_book);
  const fonte = selecionadas.length > 0 ? selecionadas : galeria;
  return {
    capa,
    fotosGrade: fonte.slice(0, 6),
  };
}
