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
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

/**
 * Botão de exclusão reutilizado nas telas de detalhe de imóveis, leads,
 * parceiros, proprietários e usuários. Padrão é soft delete (`ativo =
 * false`) — some da listagem porque toda query já filtra `.eq("ativo",
 * true)`. Quem tem acesso total ao sistema (`core`/`editar`, superadmin)
 * também vê a opção "Excluir definitivamente", que faz DELETE físico de
 * verdade (via `excluirDefinitivamente`, quando a tabela precisa de lógica
 * própria — ex. usuários, que exige apagar o login em `auth.users` — ou via
 * `.delete()` direto na tabela quando não).
 */
export function ExcluirRegistroButton({
  tabela,
  id,
  redirectTo,
  titulo,
  descricao,
  podeExcluirDefinitivamente = false,
  excluirDefinitivamente,
}: {
  tabela: string;
  id: string;
  redirectTo: string;
  titulo: string;
  descricao: string;
  podeExcluirDefinitivamente?: boolean;
  excluirDefinitivamente?: (id: string) => Promise<{ error: string | null }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [definitivo, setDefinitivo] = useState(false);

  async function handleExcluir() {
    setExcluindo(true);

    const error = definitivo
      ? excluirDefinitivamente
        ? (await excluirDefinitivamente(id)).error
        : (await createClient().from(tabela).delete().eq("id", id)).error?.message ?? null
      : (await createClient().from(tabela).update({ ativo: false }).eq("id", id)).error
          ?.message ?? null;

    if (error) {
      toast.error(`Falha ao excluir: ${error}`);
      setExcluindo(false);
      return;
    }
    toast.success(definitivo ? "Excluído definitivamente." : "Excluído.");
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

          {podeExcluirDefinitivamente ? (
            <label className="flex items-start gap-2.5 rounded-sm bg-alert/5 px-4 py-3 text-sm text-ink">
              <Checkbox
                checked={definitivo}
                onCheckedChange={(v) => setDefinitivo(v === true)}
                className="mt-0.5"
              />
              <span>
                <strong className="font-semibold">Excluir definitivamente</strong> — remove
                o registro para sempre do banco, não passa por ativo/inativo e não pode ser
                desfeito de forma alguma.
              </span>
            </label>
          ) : null}

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
              {excluindo
                ? "Excluindo…"
                : definitivo
                  ? "Excluir definitivamente"
                  : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
