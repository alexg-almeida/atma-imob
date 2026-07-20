import { A4_PX } from "@/lib/pdf/capturar-paginas";
import { montarBlocosDaFicha, type BlocoDescriptor, type FichaDados } from "./ficha-blocos";
import { FichaPagina, FichaRodape, FICHA_GAP_BLOCOS_PX } from "./ficha-pagina";

/** Largura de conteúdo dentro do A4Page com padding padrão (`p-14` = 56px de cada lado). */
export const FICHA_CONTEUDO_LARGURA_PX = A4_PX.width - 56 * 2;

/**
 * Passada de medição: os mesmos blocos de `montarBlocosDaFicha`, soltos
 * (sem casca de página, altura livre), na largura exata que vão ter dentro
 * do A4Page — garante que o texto quebra do mesmo jeito nas duas passadas.
 */
export function FichaMedidor({ dados }: { dados: FichaDados }) {
  const blocos = montarBlocosDaFicha(dados);
  return (
    <div
      style={{ width: FICHA_CONTEUDO_LARGURA_PX }}
      className="flex flex-col bg-white font-sans text-ink"
    >
      <div className="flex flex-col" style={{ gap: FICHA_GAP_BLOCOS_PX }}>
        {blocos.map((bloco) => (
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
        <FichaRodape numero={1} total={1} cidade={null} estado={null} />
      </div>
    </div>
  );
}

/** Passada final: os mesmos blocos, distribuídos nas páginas decididas pelo empacotador. */
export function FichaContent({ dados, paginas }: { dados: FichaDados; paginas: string[][] }) {
  const blocos = montarBlocosDaFicha(dados);
  const blocosPorId = new Map(blocos.map((b) => [b.id, b]));

  return (
    <>
      {paginas.map((ids, index) => (
        <FichaPagina
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
