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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookContent, type BookTemplate } from "@/components/imoveis/book/book-content";
import { capturarPaginasComoPdf } from "@/lib/pdf/capturar-paginas";
import type { Imovel, ImovelFoto } from "@/lib/supabase/types";

const templateLabels: Record<BookTemplate, string> = {
  classico: "Clássico — fotos grandes, uma por página",
  compacto: "Compacto — grade de fotos",
};

export function GerarBookButton({
  imovel,
  fotos,
}: {
  imovel: Imovel & { tipo: { nome: string } | null };
  fotos: ImovelFoto[];
}) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<BookTemplate>("classico");
  const [gerando, setGerando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleGerar() {
    if (fotos.length === 0) {
      toast.error("Cadastre ao menos uma foto para gerar o book.");
      return;
    }
    setGerando(true);
    try {
      // Aguarda o React aplicar o template escolhido antes de capturar.
      await new Promise((resolve) => requestAnimationFrame(resolve));

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-sm border border-line px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-ink uppercase transition-colors duration-150 hover:border-strong-line"
      >
        <FileArrowDown size={14} aria-hidden /> Gerar book
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar book em PDF</DialogTitle>
            <DialogDescription>
              Escolha o layout das fotos. O PDF é montado no seu navegador —
              nenhum dado é enviado a um servidor nessa etapa.
            </DialogDescription>
          </DialogHeader>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Template
            </span>
            <Select value={template} onValueChange={(v) => setTemplate(v as BookTemplate)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(templateLabels) as BookTemplate[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {templateLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <DialogFooter>
            <button
              type="button"
              onClick={handleGerar}
              disabled={gerando}
              className="rounded-sm bg-primary px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {gerando ? "Gerando…" : "Gerar PDF"}
            </button>
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
        <BookContent imovel={imovel} fotos={fotos} template={template} />
      </div>
    </>
  );
}
