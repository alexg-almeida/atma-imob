"use client";

import { useRef, useState } from "react";
import { FileArrowDown } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookContent, fotosDoBook } from "@/components/imoveis/book/book-content";
import { capturarPaginasComoPdf } from "@/lib/pdf/capturar-paginas";
import { recortarImagemCoverFit } from "@/lib/pdf/recortar-imagem";
import type { Imovel, ImovelFoto } from "@/lib/supabase/types";

// Dimensões alvo dos recortes (2x o tamanho renderizado na página A4 de
// 794px, para nitidez na captura em scale:2 do html2canvas).
const BANNER_PX = { width: 1588, height: 440 } as const;
const GRADE_PX = { width: 800, height: 600 } as const;

export function GerarBookButton({
  imovel,
  fotos,
}: {
  imovel: Imovel & { tipo: { nome: string } | null };
  fotos: ImovelFoto[];
}) {
  const [open, setOpen] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [recortes, setRecortes] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleGerar() {
    if (fotos.length === 0) {
      toast.error("Cadastre ao menos uma foto para gerar o book.");
      return;
    }
    setGerando(true);
    try {
      const { capa, fotosGrade } = fotosDoBook(fotos);

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

      const paginas = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>("[data-book-page]") ?? [],
      );
      const pdf = await capturarPaginasComoPdf(paginas);
      const nomeArquivo = `book-${imovel.id.slice(0, 8)}.pdf`;
      pdf.save(nomeArquivo);
      toast.success("Book gerado.");
      setOpen(false);
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
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileArrowDown size={14} aria-hidden /> Gerar book
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar book em PDF</DialogTitle>
            <DialogDescription>
              Book compacto em uma página (A4 retrato) com capa, indicadores,
              grade de fotos e descrição. Montado no seu navegador — nenhum
              dado é enviado a um servidor nessa etapa.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" size="sm" onClick={handleGerar} disabled={gerando}>
              {gerando ? "Gerando…" : "Gerar PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Componente "invisível": fora da viewport, mas totalmente renderizado
          (não display:none) para o html2canvas conseguir capturar cada página. */}
      <div
        ref={containerRef}
        aria-hidden
        style={{ position: "fixed", top: 0, left: -10000, zIndex: -1 }}
      >
        <BookContent imovel={imovel} fotos={fotos} recortes={recortes} />
      </div>
    </>
  );
}
