"use client";

import { useState } from "react";
import { FileArrowDown } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fotosDoBook } from "@/components/imoveis/book/book-content";
import { useBookPdf } from "@/components/imoveis/book/use-book-pdf";
import { BOOK_BANNER_ALTURA_PX } from "@/components/imoveis/book/book-blocos";
import { A4_PX } from "@/lib/pdf/capturar-paginas";
import { recortarImagemCoverFit } from "@/lib/pdf/recortar-imagem";
import type { Imovel, ImovelFoto } from "@/lib/supabase/types";

// Dimensões alvo dos recortes (2x o tamanho renderizado na página A4, para
// nitidez na captura em scale:2 do html2canvas). O banner precisa bater
// exatamente com `BOOK_BANNER_ALTURA_PX` — senão a foto pré-recortada numa
// proporção sai esticada pelo html2canvas ao ser exibida numa caixa de
// proporção diferente.
const BANNER_PX = { width: A4_PX.width * 2, height: BOOK_BANNER_ALTURA_PX * 2 } as const;
const GRADE_PX = { width: 800, height: 600 } as const;

export function GerarBookButton({
  imovel,
  fotos,
}: {
  imovel: Imovel & { tipo: { nome: string } | null };
  fotos: ImovelFoto[];
}) {
  const [gerando, setGerando] = useState(false);
  const [recortes, setRecortes] = useState<Record<string, string>>({});
  const { capa, fotosGrade } = fotosDoBook(fotos);
  const { medidorNode, renderNode, gerar } = useBookPdf({ imovel, capa, fotosGrade, recortes });

  async function handleGerar() {
    if (fotos.length === 0) {
      toast.error("Cadastre ao menos uma foto para gerar o book.");
      return;
    }
    setGerando(true);
    try {
      const novosRecortes: Record<string, string> = {};
      await Promise.all([
        capa
          ? recortarImagemCoverFit(capa.url, BANNER_PX.width, BANNER_PX.height).then((src) => {
              if (src) novosRecortes[capa.id] = src;
            })
          : Promise.resolve(),
        ...fotosGrade.map((foto) =>
          recortarImagemCoverFit(foto.url, GRADE_PX.width, GRADE_PX.height).then((src) => {
            if (src) novosRecortes[foto.id] = src;
          }),
        ),
      ]);
      setRecortes(novosRecortes);

      // Duplo requestAnimationFrame: garante que o React aplicou os novos
      // `src` (recortados) ao DOM antes de capturar — sem isso a primeira
      // captura ainda pega as fotos originais (esticadas pelo object-fit,
      // que o html2canvas não respeita de forma confiável).
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      const pdf = await gerar();
      const nomeArquivo = `book-${imovel.id.slice(0, 8)}.pdf`;
      pdf.save(nomeArquivo);
      toast.success("Book gerado.");
    } catch (error) {
      toast.error(
        `Falha ao gerar o book: ${error instanceof Error ? error.message : "erro desconhecido"}`,
      );
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={handleGerar} disabled={gerando}>
        <FileArrowDown size={14} aria-hidden /> {gerando ? "Gerando…" : "Gerar book"}
      </Button>

      {medidorNode}
      {renderNode}
    </>
  );
}
