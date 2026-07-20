/**
 * Paginação de conteúdo de altura variável para o pipeline html2canvas
 * (páginas de altura fixa, `overflow: hidden` — nada pode simplesmente
 * "estourar"). Usado pela Ficha de Captação, que tem quantidade de
 * proprietários, observações e termo (editável pelo admin) sem limite.
 *
 * Fluxo: o conteúdo é dividido em "blocos" (unidades que nunca são
 * cortadas no meio), medidos numa passada off-screen sem altura fixa, e
 * depois distribuídos entre páginas por `empacotarBlocos`. Um bloco maior
 * que uma página inteira sozinho precisa passar por `dividirBlocoTexto`
 * antes de chegar aqui.
 */

export type BlocoAltura = {
  id: string;
  altura: number;
  /** Força início de página nova antes deste bloco (ex.: título do Termo). */
  forcePageBreakBefore?: boolean;
};

/**
 * Uma unidade de conteúdo que nunca é cortada no meio pelo empacotador.
 * Usado tanto pela Ficha (`ficha-blocos.tsx`) quanto pelo Book
 * (`book-blocos.tsx`) — a função que monta a lista (`montarBlocosDaFicha`/
 * `montarBlocosDoBook`) é a única fonte de verdade do conteúdo, consumida
 * de forma idêntica pela passada de medição e pela de render final.
 */
export type BlocoDescriptor = {
  id: string;
  node: React.ReactNode;
  forcePageBreakBefore?: boolean;
};

/** Lê a altura real renderizada de cada `[data-block]` dentro do container. */
export function medirAlturasDeBlocos(container: HTMLElement): BlocoAltura[] {
  const elementos = Array.from(container.querySelectorAll<HTMLElement>("[data-block]"));
  return elementos.map((el) => ({
    id: el.dataset.block ?? "",
    altura: el.getBoundingClientRect().height,
    forcePageBreakBefore: el.dataset.forcePageBreak === "true",
  }));
}

/**
 * Distribui os blocos entre páginas (greedy): acumula na página atual até
 * o próximo bloco estourar `alturaUtil`, aí abre uma página nova. `gap` é o
 * espaçamento vertical que o layout real vai aplicar entre blocos
 * consecutivos na mesma página (ex.: `gap-6` do flex container) — sem
 * contar isso aqui, o orçamento de altura fica otimista e o render final
 * pode estourar por causa só do espaçamento. Um bloco que sozinho já
 * excede `alturaUtil` fica isolado na própria página em vez de travar o
 * empacotamento — mas isso ainda seria cortado pelo `overflow: hidden` do
 * A4Page, por isso quem chama isto precisa garantir via `dividirBlocoTexto`
 * que nenhum bloco individual chega aqui maior que uma página inteira.
 */
export function empacotarBlocos(
  blocos: BlocoAltura[],
  alturaUtil: number,
  gap = 0,
): string[][] {
  const paginas: string[][] = [[]];
  let alturaAtual = 0;

  for (const bloco of blocos) {
    let paginaAtual = paginas[paginas.length - 1];
    const temConteudo = paginaAtual.length > 0;
    const alturaComGap = bloco.altura + (temConteudo ? gap : 0);
    const precisaQuebrar =
      temConteudo && (bloco.forcePageBreakBefore || alturaAtual + alturaComGap > alturaUtil);

    if (precisaQuebrar) {
      paginas.push([]);
      paginaAtual = paginas[paginas.length - 1];
      alturaAtual = 0;
    }

    paginaAtual.push(bloco.id);
    alturaAtual += bloco.altura + (paginaAtual.length > 1 ? gap : 0);
  }

  return paginas;
}

/**
 * Fallback para texto livre grande demais pra caber numa página inteira
 * mesmo sozinho (parágrafo de observação ou cláusula de termo colada sem
 * quebra de linha, editada pelo admin sem limite de tamanho). Corta por
 * palavra via busca binária, medindo a altura real de cada candidato — o
 * chamador injeta `medir`, que deve renderizar o texto parcial no mesmo
 * container off-screen da passada de medição principal e devolver a altura.
 */
export async function dividirBlocoTexto(
  texto: string,
  alturaMaxima: number,
  medir: (textoParcial: string) => Promise<number>,
): Promise<string[]> {
  const partes: string[] = [];
  let restante = texto.trim();

  while (restante.length > 0) {
    const alturaTotal = await medir(restante);
    if (alturaTotal <= alturaMaxima) {
      partes.push(restante);
      break;
    }

    const palavras = restante.split(/\s+/);
    let baixo = 1;
    let alto = palavras.length;
    let melhor = 1;

    while (baixo <= alto) {
      const meio = Math.floor((baixo + alto) / 2);
      const candidato = palavras.slice(0, meio).join(" ");
      const altura = await medir(candidato);
      if (altura <= alturaMaxima) {
        melhor = meio;
        baixo = meio + 1;
      } else {
        alto = meio - 1;
      }
    }

    partes.push(palavras.slice(0, melhor).join(" "));
    restante = palavras.slice(melhor).join(" ").trim();
  }

  return partes;
}
