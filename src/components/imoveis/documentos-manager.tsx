"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DownloadSimple,
  FilePdf,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
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
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { ImovelDocumento } from "@/lib/supabase/types";

const BUCKET = "imoveis-documentos";

const tiposDocumento = [
  "Matrícula",
  "IPTU",
  "Contrato",
  "Escritura",
  "Procuração",
  "Outros",
];

export function DocumentosManager({
  imovelId,
  documentos: documentosIniciais,
  readOnly = false,
}: {
  imovelId: string;
  documentos: ImovelDocumento[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentos, setDocumentos] = useState(documentosIniciais);
  const [tipoDocumento, setTipoDocumento] = useState("Outros");
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ImovelDocumento | null>(
    null,
  );

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    const novos: ImovelDocumento[] = [];

    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} não é um PDF.`);
        continue;
      }
      const path = `${imovelId}/${crypto.randomUUID()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: "application/pdf" });
      if (uploadError) {
        toast.error(`Falha no upload de ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: row, error: insertError } = await supabase
        .from("imoveis_documentos")
        .insert({
          imovel_id: imovelId,
          url: path,
          nome_arquivo: file.name,
          tipo_documento: tipoDocumento,
        })
        .select("*")
        .single();

      if (insertError || !row) {
        toast.error(`Falha ao registrar ${file.name}: ${insertError?.message}`);
        continue;
      }
      novos.push(row as ImovelDocumento);
    }

    if (novos.length > 0) {
      setDocumentos((prev) => [...prev, ...novos]);
      toast.success(
        novos.length === 1
          ? "Documento anexado."
          : `${novos.length} documentos anexados.`,
      );
      router.refresh();
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDownload(documento: ImovelDocumento) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(documento.url, 60);
    if (error || !data) {
      toast.error(`Falha ao gerar o link: ${error?.message}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function handleDelete(documento: ImovelDocumento) {
    const supabase = createClient();
    const { error } = await supabase
      .from("imoveis_documentos")
      .update({ ativo: false })
      .eq("id", documento.id);
    if (error) {
      toast.error(`Falha ao remover: ${error.message}`);
      return;
    }
    await supabase.storage.from(BUCKET).remove([documento.url]);
    setDocumentos((prev) => prev.filter((d) => d.id !== documento.id));
    setConfirmDelete(null);
    toast.success("Documento removido.");
    router.refresh();
  }

  return (
    <section aria-label="Documentos do imóvel">
      {!readOnly ? (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Tipo do documento
            </span>
            <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
              <SelectTrigger className="w-48 rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposDocumento.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-line px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-ink uppercase transition-colors duration-150 hover:border-strong-line">
            <UploadSimple size={14} aria-hidden />
            {uploading ? "Enviando…" : "Anexar PDF"}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              multiple
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files)}
              className="sr-only"
            />
          </label>
        </div>
      ) : null}

      {documentos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum documento anexado.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {documentos.map((documento) => (
            <li
              key={documento.id}
              className="flex items-center gap-4 py-3 transition-colors hover:bg-surface"
            >
              <FilePdf
                size={20}
                className="shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {documento.nome_arquivo}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {documento.tipo_documento ?? "Documento"} ·{" "}
                  {formatDate(documento.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(documento)}
                title="Baixar"
                aria-label={`Baixar ${documento.nome_arquivo}`}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-muted-foreground transition-colors hover:border-strong-line hover:text-ink"
              >
                <DownloadSimple size={15} aria-hidden />
              </button>
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(documento)}
                  title="Remover"
                  aria-label={`Remover ${documento.nome_arquivo}`}
                  className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-muted-foreground transition-colors hover:border-alert hover:text-alert"
                >
                  <Trash size={15} aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover documento</DialogTitle>
            <DialogDescription>
              {confirmDelete?.nome_arquivo} será removido do imóvel e do
              armazenamento. Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-sm px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-ink"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="rounded-sm bg-alert px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-white uppercase transition-colors hover:opacity-90"
            >
              Remover
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
