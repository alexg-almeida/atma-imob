import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** Dimensões de uma página A4 paisagem a 96dpi — mesma proporção do formato A4 em mm. */
export const A4_PX = { width: 1123, height: 794 } as const;
const A4_MM = { width: 297, height: 210 } as const;

/**
 * Espera todas as <img> dentro do container terminarem de carregar (ou falharem),
 * necessário antes de capturar com html2canvas — imagens ainda carregando saem
 * em branco no canvas.
 */
export async function aguardarImagens(container: HTMLElement): Promise<void> {
  const imagens = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    imagens.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
}

/**
 * Captura uma lista de elementos DOM (uma "página" cada, dimensionada como
 * A4_PX) e monta um PDF paisagem com uma imagem por página. Os elementos
 * devem ter a proporção de A4 paisagem (1123×794px) para preencher a página
 * inteira sem distorção.
 *
 * Roda inteiramente no navegador — nenhuma chamada de servidor.
 */
export async function capturarPaginasComoPdf(
  paginas: HTMLElement[],
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });

  for (let i = 0; i < paginas.length; i++) {
    const pagina = paginas[i];
    await aguardarImagens(pagina);

    // useCORS: as fotos vêm do Storage público do Supabase self-hosted; se o
    // bucket não devolver Access-Control-Allow-Origin, a página sai em branco.
    const canvas = await html2canvas(pagina, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    if (i > 0) doc.addPage();
    doc.addImage(imgData, "JPEG", 0, 0, A4_MM.width, A4_MM.height);
  }

  return doc;
}
