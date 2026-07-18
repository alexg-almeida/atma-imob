"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "@phosphor-icons/react";
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
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Botão de exclusão (soft delete, `ativo = false`) reutilizado nas telas de
 * detalhe de imóveis, leads, parceiros e proprietários — nunca faz DELETE
 * físico, é convenção do projeto. Some da listagem porque toda query já
 * filtra `.eq("ativo", true)`.
 */
export function ExcluirRegistroButton({
  tabela,
  id,
  redirectTo,
  titulo,
  descricao,
}: {
  tabela: string;
  id: string;
  redirectTo: string;
  titulo: string;
  descricao: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function handleExcluir() {
    setExcluindo(true);
    const supabase = createClient();
    const { error } = await supabase.from(tabela).update({ ativo: false }).eq("id", id);
    if (error) {
      toast.error(`Falha ao excluir: ${error.message}`);
      setExcluindo(false);
      return;
    }
    toast.success("Excluído.");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash size={14} aria-hidden /> Excluir
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>{descricao}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="sm"
              className="bg-alert text-white hover:bg-alert/90"
              onClick={handleExcluir}
              disabled={excluindo}
            >
              {excluindo ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
