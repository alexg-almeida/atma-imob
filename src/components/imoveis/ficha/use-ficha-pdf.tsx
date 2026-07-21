"use client";

import { useRef, useState } from "react";
import type { jsPDF } from "jspdf";
import {
  A4_PX,
  aguardarFontes,
  aguardarImagens,
  capturarPaginasComoPdf,
  validarPaginasSemOverflow,
} from "@/lib/pdf/capturar-paginas";
import { dividirBlocoTexto, empacotarBlocos, medirAlturasDeBlocos } from "@/lib/pdf/blocos";
import { TERMO_CORPO_PADRAO } from "@/lib/pdf/ficha-captacao";
import {
  FichaContent,
  FichaMedidor,
  FICHA_CONTEUDO_LARGURA_PX,
} from "@/components/imoveis/ficha/ficha-content";
import { FICHA_GAP_BLOCOS_PX } from "@/components/imoveis/ficha/ficha-pagina";
import type { FichaDados } from "@/components/imoveis/ficha/ficha-blocos";

const PADDING_VERTICAL_PAGINA_PX = 56 * 2; // A4Page com padded (p-14)
const ALTURA_RODAPE_FALLBACK_PX = 40;
const MARGEM_SEGURANCA_PX = 16;

function proximoFrame(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

/** Elemento de medição descartável — mesma largura/fonte do bloco real, fora da árvore React. */
function criarMedidorDeTexto(container: HTMLElement, className: string) {
  const el = document.createElement("div");
  el.className = className;
  el.style.width = `${FICHA_CONTEUDO_LARGURA_PX}px`;
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
 * Garante que nenhum parágrafo, sozinho, exceda o orçamento de altura de
 * uma página — insere quebras extras (`\n\n`) nos pontos calculados por
 * `dividirBlocoTexto` quando necessário. `montarBlocosDaFicha` já separa o
 * texto em blocos por parágrafo (`\n\s*\n`), então esses `\n\n` extras
 * viram blocos novos automaticamente, sem precisar mudar a função que
 * monta os blocos.
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
 * Monta a Ficha de Captação em PDF via html2canvas — o conteúdo tem altura
 * variável e sem limite pré-definido (número de proprietários, tamanho das
 * observações, tamanho do termo editável pelo admin), então a geração é em
 * duas passadas: mede os blocos soltos (`FichaMedidor`), decide a
 * paginação (`empacotarBlocos`, em `src/lib/pdf/blocos.ts`), depois
 * renderiza as páginas de verdade (`FichaContent`) e captura.
 */
export function useFichaPdf(dados: FichaDados) {
  const medidorRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);
  const [paginas, setPaginas] = useState<string[][]>([]);
  const [dadosAjustados, setDadosAjustados] = useState<FichaDados>(dados);

  async function gerar(): Promise<jsPDF> {
    await aguardarFontes();
    if (dadosAjustados !== dados) {
      setDadosAjustados(dados);
      await proximoFrame();
    }

    await proximoFrame();
    const medidor = medidorRef.current;
    if (!medidor) throw new Error("Medidor da ficha não está montado.");

    const alturaRodape =
      medidor.querySelector<HTMLElement>("[data-rodape-medidor]")?.getBoundingClientRect()
        .height || ALTURA_RODAPE_FALLBACK_PX;
    const alturaUtil =
      A4_PX.height - PADDING_VERTICAL_PAGINA_PX - alturaRodape - MARGEM_SEGURANCA_PX;

    // Passo 1: nenhum parágrafo de observações/cláusula do termo pode,
    // sozinho, exceder o orçamento de uma página inteira (caso patológico
    // de texto colado sem quebra de linha) — evita bloco impossível de
    // encaixar antes mesmo de empacotar.
    const { medir, destruir } = criarMedidorDeTexto(
      medidor,
      "text-[11px] leading-relaxed whitespace-pre-line text-ink",
    );
    let dadosSeguro = dados;
    try {
      const observacoesAjustadas = dados.imovel.observacoes
        ? await ajustarParagrafosGrandes(dados.imovel.observacoes, alturaUtil, medir)
        : dados.imovel.observacoes;
      const termoCorpoAjustado = await ajustarParagrafosGrandes(
        dados.termoCorpo || TERMO_CORPO_PADRAO,
        alturaUtil,
        medir,
      );
      dadosSeguro = {
        ...dados,
        imovel: { ...dados.imovel, observacoes: observacoesAjustadas },
        termoCorpo: termoCorpoAjustado,
      };
    } finally {
      destruir();
    }

    if (dadosSeguro.imovel.observacoes !== dados.imovel.observacoes ||
      dadosSeguro.termoCorpo !== dados.termoCorpo) {
      setDadosAjustados(dadosSeguro);
      await proximoFrame();
    }

    const alturas = medirAlturasDeBlocos(medidorRef.current!);
    const paginasCalculadas = empacotarBlocos(alturas, alturaUtil, FICHA_GAP_BLOCOS_PX);

    setPaginas(paginasCalculadas);
    await proximoFrame();

    const paginasEl = Array.from(
      renderRef.current?.querySelectorAll<HTMLElement>("[data-book-page]") ?? [],
    );
    await Promise.all(paginasEl.map((el) => aguardarImagens(el)));

    validarPaginasSemOverflow(paginasEl);

    return capturarPaginasComoPdf(paginasEl, {
      title: `Ficha de captação · ${dados.tipoNome}`,
      subject: "Ficha de captação e termo de autorização de intermediação imobiliária",
    });
  }

  const medidorNode = (
    <div
      ref={medidorRef}
      aria-hidden
      style={{ position: "fixed", top: 0, left: -10000, zIndex: -1 }}
    >
      <FichaMedidor dados={dadosAjustados} />
    </div>
  );

  const renderNode = (
    <div
      ref={renderRef}
      aria-hidden
      style={{ position: "fixed", top: 0, left: -10000, zIndex: -1 }}
    >
      <FichaContent dados={dadosAjustados} paginas={paginas} />
    </div>
  );

  return { medidorNode, renderNode, gerar };
}
