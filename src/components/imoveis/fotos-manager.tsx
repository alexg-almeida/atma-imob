"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Book, Star, Trash, UploadSimple } from "@phosphor-icons/react";
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
import { createClient } from "@/lib/supabase/client";
import type { ImovelFoto } from "@/lib/supabase/types";

const BUCKET = "imoveis";

function storagePath(url: string) {
  return url.split(`/object/public/${BUCKET}/`)[1] ?? null;
}

function SortableFoto({
  foto,
  onCapa,
  onDelete,
  onToggleBook,
  mostrarBook,
}: {
  foto: ImovelFoto;
  onCapa: () => void;
  onDelete: () => void;
  onToggleBook: () => void;
  mostrarBook: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: foto.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group relative aspect-[4/3] overflow-hidden rounded-md bg-surface ${
        isDragging ? "z-10 shadow-float" : ""
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        aria-label="Arrastar para reordenar"
        {...attributes}
        {...listeners}
      >
        <Image
          src={foto.url}
          alt={foto.destaque ?? "Foto do imóvel"}
          fill
          sizes="(max-width: 640px) 50vw, 200px"
          className="object-cover"
        />
      </button>

      {foto.capa ? (
        <span className="absolute top-2 left-2 rounded-sm bg-ink/80 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
          Capa
        </span>
      ) : null}

      <div className="absolute right-2 bottom-2 flex gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {!foto.capa ? (
          <button
            type="button"
            onClick={onCapa}
            title="Definir como capa"
            aria-label="Definir como capa"
            className="flex h-7 w-7 items-center justify-center rounded-sm bg-white/90 text-ink shadow-sm transition-colors hover:bg-white"
          >
            <Star size={14} aria-hidden />
          </button>
        ) : null}
        {mostrarBook ? (
          <button
            type="button"
            onClick={onToggleBook}
            title={foto.usar_no_book ? "Remover do book" : "Usar no book"}
            aria-label={foto.usar_no_book ? "Remover do book" : "Usar no book"}
            aria-pressed={foto.usar_no_book}
            className={`flex h-7 w-7 items-center justify-center rounded-sm shadow-sm transition-colors ${
              foto.usar_no_book
                ? "bg-primary text-white hover:bg-primary-hover"
                : "bg-white/90 text-ink hover:bg-white"
            }`}
          >
            <Book size={14} weight={foto.usar_no_book ? "fill" : "regular"} aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          title="Remover foto"
          aria-label="Remover foto"
          className="flex h-7 w-7 items-center justify-center rounded-sm bg-white/90 text-alert shadow-sm transition-colors hover:bg-white"
        >
          <Trash size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function FotosManager({
  imovelId,
  fotos: fotosIniciais,
}: {
  imovelId: string;
  fotos: ImovelFoto[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState(
    [...fotosIniciais].sort((a, b) => a.ordem - b.ordem),
  );
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ImovelFoto | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    let ordem = fotos.length > 0 ? Math.max(...fotos.map((f) => f.ordem)) + 1 : 0;
    const novas: ImovelFoto[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${imovelId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        toast.error(`Falha no upload de ${file.name}: ${uploadError.message}`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { data: row, error: insertError } = await supabase
        .from("imoveis_fotos")
        .insert({
          imovel_id: imovelId,
          url: publicUrl,
          ordem,
          capa: fotos.length === 0 && novas.length === 0,
        })
        .select("*")
        .single();

      if (insertError || !row) {
        toast.error(`Falha ao registrar ${file.name}: ${insertError?.message}`);
        continue;
      }
      novas.push(row as ImovelFoto);
      ordem += 1;
    }

    if (novas.length > 0) {
      setFotos((prev) => [...prev, ...novas]);
      toast.success(
        novas.length === 1
          ? "Foto adicionada."
          : `${novas.length} fotos adicionadas.`,
      );
      router.refresh();
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fotos.findIndex((f) => f.id === active.id);
    const newIndex = fotos.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fotos, oldIndex, newIndex).map((f, i) => ({
      ...f,
      ordem: i,
    }));
    setFotos(reordered);

    const supabase = createClient();
    const results = await Promise.all(
      reordered.map((f) =>
        supabase.from("imoveis_fotos").update({ ordem: f.ordem }).eq("id", f.id),
      ),
    );
    if (results.some((r) => r.error)) {
      toast.error("Falha ao salvar a nova ordem das fotos.");
    }
    router.refresh();
  }

  async function handleCapa(foto: ImovelFoto) {
    const supabase = createClient();
    const antiga = fotos.find((f) => f.capa);
    if (antiga) {
      await supabase
        .from("imoveis_fotos")
        .update({ capa: false })
        .eq("id", antiga.id);
    }
    const { error } = await supabase
      .from("imoveis_fotos")
      .update({ capa: true })
      .eq("id", foto.id);
    if (error) {
      toast.error(`Falha ao definir a capa: ${error.message}`);
      return;
    }
    setFotos((prev) => prev.map((f) => ({ ...f, capa: f.id === foto.id })));
    toast.success("Foto de capa atualizada.");
    router.refresh();
  }

  async function handleUsarNoBook(foto: ImovelFoto) {
    const supabase = createClient();
    const novoValor = !foto.usar_no_book;
    const { error } = await supabase
      .from("imoveis_fotos")
      .update({ usar_no_book: novoValor })
      .eq("id", foto.id);
    if (error) {
      toast.error(`Falha ao atualizar a foto: ${error.message}`);
      return;
    }
    setFotos((prev) =>
      prev.map((f) => (f.id === foto.id ? { ...f, usar_no_book: novoValor } : f)),
    );
  }

  async function handleDelete(foto: ImovelFoto) {
    const supabase = createClient();
    const path = storagePath(foto.url);
    const { error } = await supabase
      .from("imoveis_fotos")
      .update({ ativo: false })
      .eq("id", foto.id);
    if (error) {
      toast.error(`Falha ao remover a foto: ${error.message}`);
      return;
    }
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }
    const restantes = fotos.filter((f) => f.id !== foto.id);
    // Garante que continua existindo uma capa
    if (foto.capa && restantes[0]) {
      await supabase
        .from("imoveis_fotos")
        .update({ capa: true })
        .eq("id", restantes[0].id);
      restantes[0] = { ...restantes[0], capa: true };
    }
    setFotos(restantes);
    setConfirmDelete(null);
    toast.success("Foto removida.");
    router.refresh();
  }

  return (
    <section aria-label="Galeria de fotos">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Arraste para reordenar · a estrela define a foto de capa.
          {fotos.length > 6
            ? " Mais de 6 fotos — marque o ícone de livro nas que devem entrar no book."
            : ""}
        </p>
        <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-line px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-ink uppercase transition-colors duration-150 hover:border-strong-line">
          <UploadSimple size={14} aria-hidden />
          {uploading ? "Enviando…" : "Adicionar fotos"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={(e) => handleUpload(e.target.files)}
            className="sr-only"
          />
        </label>
      </div>

      {fotos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma foto ainda — adicione a primeira.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fotos.map((f) => f.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3 lg:grid-cols-4">
              {fotos.map((foto) => (
                <SortableFoto
                  key={foto.id}
                  foto={foto}
                  onCapa={() => handleCapa(foto)}
                  onDelete={() => setConfirmDelete(foto)}
                  onToggleBook={() => handleUsarNoBook(foto)}
                  mostrarBook={fotos.length > 6 && !foto.capa}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover foto</DialogTitle>
            <DialogDescription>
              A foto será removida da galeria e do armazenamento. Essa ação não
              pode ser desfeita.
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
