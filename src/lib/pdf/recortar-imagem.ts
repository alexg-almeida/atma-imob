/**
 * Busca uma imagem e recorta em cover-fit (preenche a caixa alvo sem
 * distorcer, cortando o excesso) num canvas, devolvendo um data URL JPEG.
 *
 * Necessário sempre que uma foto vai ser embutida num PDF (via
 * `doc.addImage` ou via `<img>` capturada por html2canvas): nenhum dos dois
 * caminhos respeita `object-fit: cover` de forma confiável — html2canvas
 * ignora a propriedade e estica a imagem para o tamanho da caixa, e
 * `doc.addImage` sempre estica para a largura/altura informadas. Recortar
 * antes, num canvas do tamanho exato do destino, é a única forma de manter
 * a proporção original da foto.
 */
export async function recortarImagemCoverFit(
  url: string,
  larguraPx: number,
  alturaPx: number,
): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const carregada = await new Promise<HTMLImageElement | null>((resolve) => {
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    if (!carregada) return null;

    const canvas = document.createElement("canvas");
    canvas.width = larguraPx;
    canvas.height = alturaPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const escala = Math.max(larguraPx / carregada.width, alturaPx / carregada.height);
    const larguraDestino = carregada.width * escala;
    const alturaDestino = carregada.height * escala;
    ctx.drawImage(
      carregada,
      (larguraPx - larguraDestino) / 2,
      (alturaPx - alturaDestino) / 2,
      larguraDestino,
      alturaDestino,
    );
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return null;
  }
}
