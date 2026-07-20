"use client";

import { useRef, useState } from "react";
import type { jsPDF } from "jspdf";
import { A4_PX, aguardarImagens, capturarPaginasComoPdf } from "@/lib/pdf/capturar-paginas";
import { dividirBlocoTexto, empacotarBlocos, medirAlturasDeBlocos } from "@/lib/pdf/blocos";
import {
  BookContent,
  BookMedidor,
  BOOK_CONTEUDO_LARGURA_PX,
} from "@/components/imoveis/book/book-content";
import {
  BOOK_GAP_BLOCOS_PX,
  BOOK_PADDING_BASE_PX,
  BOOK_PADDING_TOPO_PX,
} from "@/components/imoveis/book/book-pagina";
import type { BookDados } from "@/components/imoveis/book/book-blocos";

const ALTURA_RODAPE_FALLBACK_PX = 40;

function proximoFrame(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

/** Elemento de medição descartável — mesma largura/fonte do bloco real, fora da árvore React. */
function criarMedidorDeTexto(container: HTMLElement, className: string) {
  const el = document.createElement("div");
  el.className = className;
  el.style.width = `${BOOK_CONTEUDO_LARGURA_PX}px`;
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  container.appendChild(el);
  return {
    medir: async (texto: string) => {
      el.textContent = texto;
      return el.getBoundingClientRect().height;
    },
    destruir: () => {
      container.removeChild(el);
    },
  };
}

/**
 * Garante que nenhum parágrafo da descrição, sozinho, exceda o orçamento de
 * altura de uma página inteira — insere quebras extras (`\n\n`) quando
 * necessário. `montarBlocosDoBook` já separa a descrição em blocos por
 * parágrafo (`\n\s*\n`), então essas quebras extras viram blocos novos
 * automaticamente.
 */
async function ajustarParagrafosGrandes(
  texto: string,
  alturaMaxima: number,
  medir: (texto: string) => Promise<number>,
): Promise<string> {
  const paragrafos = texto.split(/\n\s*\n/);
  const ajustados: string[] = [];
  for (const paragrafo of paragrafos) {
    const alturaParagrafo = await medir(paragrafo);
    if (alturaParagrafo <= alturaMaxima) {
      ajustados.push(paragrafo);
    } else {
      ajustados.push(...(await dividirBlocoTexto(paragrafo, alturaMaxima, medir)));
    }
  }
  return ajustados.join("\n\n");
}

/**
 * Monta o Book em PDF via html2canvas com paginação automática — o banner
 * de capa entra como um bloco (bem maior que os demais) sempre primeiro na
 * página 1; o empacotador genérico (`src/lib/pdf/blocos.ts`) trata isso
 * como "um bloco grande no início" e naturalmente deixa só o que sobra de
 * espaço pros blocos seguintes, sem precisar de um orçamento por página
 * diferente — se a descrição/fotos não couberem, seguem pra página 2+.
 */
export function useBookPdf(dados: BookDados) {
  const medidorRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);
  const [paginas, setPaginas] = useState<string[][]>([]);
  const [dadosAjustados, setDadosAjustados] = useState<BookDados>(dados);

  async function gerar(): Promise<jsPDF> {
    if (dadosAjustados !== dados) {
      setDadosAjustados(dados);
      await proximoFrame();
    }

    await proximoFrame();
    const medidor = medidorRef.current;
    if (!medidor) throw new Error("Medidor do book não está montado.");

    const alturaRodape =
      medidor.querySelector<HTMLElement>("[data-rodape-medidor]")?.getBoundingClientRect()
        .height || ALTURA_RODAPE_FALLBACK_PX;
    // Orçamento por página assumindo SEM banner (o que toda página a partir
    // da 2ª tem) — na página 1 o banner entra como bloco grande e "come"
    // esse orçamento naturalmente, ver comentário acima.
    const alturaUtil =
      A4_PX.height - alturaRodape - BOOK_PADDING_TOPO_PX - BOOK_PADDING_BASE_PX;

    // Nenhum parágrafo da descrição pode, sozinho, exceder o orçamento de
    // uma página inteira (caso patológico de texto colado sem quebra de
    // linha) — evita bloco impossível de encaixar antes mesmo de empacotar.
    const { medir, destruir } = criarMedidorDeTexto(
      medidor,
      "text-sm leading-relaxed whitespace-pre-line text-ink",
    );
    let dadosSeguro = dados;
    try {
      const descricaoAjustada = dados.imovel.descricao
        ? await ajustarParagrafosGrandes(dados.imovel.descricao, alturaUtil, medir)
        : dados.imovel.descricao;
      dadosSeguro = { ...dados, imovel: { ...dados.imovel, descricao: descricaoAjustada } };
    } finally {
      destruir();
    }

    if (dadosSeguro.imovel.descricao !== dados.imovel.descricao) {
      setDadosAjustados(dadosSeguro);
      await proximoFrame();
    }

    const alturas = medirAlturasDeBlocos(medidorRef.current!);
    const paginasCalculadas = empacotarBlocos(alturas, alturaUtil, BOOK_GAP_BLOCOS_PX);

    setPaginas(paginasCalculadas);
    await proximoFrame();

    const paginasEl = Array.from(
      renderRef.current?.querySelectorAll<HTMLElement>("[data-book-page]") ?? [],
    );
    await Promise.all(paginasEl.map((el) => aguardarImagens(el)));

    return capturarPaginasComoPdf(paginasEl);
  }

  const medidorNode = (
    <div
      ref={medidorRef}
      aria-hidden
      style={{ position: "fixed", top: 0, left: -10000, zIndex: -1 }}
    >
      <BookMedidor dados={dadosAjustados} />
    </div>
  );

  const renderNode = (
    <div
      ref={renderRef}
      aria-hidden
      style={{ position: "fixed", top: 0, left: -10000, zIndex: -1 }}
    >
      <BookContent dados={dadosAjustados} paginas={paginas} />
    </div>
  );

  return { medidorNode, renderNode, gerar };
}
