"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { LeadInteracao } from "@/lib/supabase/types";

const tiposInteracao = [
  "Ligação",
  "WhatsApp",
  "E-mail",
  "Visita",
  "Reunião",
  "Outro",
];

export type InteracaoComUsuario = LeadInteracao & {
  usuario: { nome_completo: string } | null;
};

export function InteracoesManager({
  leadId,
  interacoes: iniciais,
  podeRegistrar,
}: {
  leadId: string;
  interacoes: InteracaoComUsuario[];
  podeRegistrar: boolean;
}) {
  const router = useRouter();
  const [interacoes, setInteracoes] = useState(iniciais);
  const [tipo, setTipo] = useState(tiposInteracao[0]);
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!descricao.trim()) {
      toast.error("Descreva a interação antes de registrar.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: created, error } = await supabase
      .from("leads_interacoes")
      .insert({
        lead_id: leadId,
        tipo,
        descricao: descricao.trim(),
        usuario_id: user?.id ?? null,
      })
      .select("*, usuario:core_perfis(nome_completo)")
      .single();

    if (error || !created) {
      toast.error(`Erro ao registrar: ${error?.message}`);
      setSaving(false);
      return;
    }

    setInteracoes((prev) => [created as InteracaoComUsuario, ...prev]);
    setDescricao("");
    toast.success("Interação registrada.");
    router.refresh();
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {podeRegistrar ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 border-b border-line pb-6"
        >
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Tipo
              </span>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-40 rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposInteracao.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="ml-auto rounded-sm bg-primary px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Registrando…" : "Registrar interação"}
            </button>
          </div>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            placeholder="O que foi conversado ou feito…"
            className="resize-none rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
          />
        </form>
      ) : null}

      {interacoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma interação registrada ainda.
        </p>
      ) : (
        <ul className="space-y-5">
          {interacoes.map((interacao) => (
            <li key={interacao.id} className="border-l-2 border-line pl-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-medium text-ink">{interacao.tipo}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatDate(interacao.data_interacao)}
                  {interacao.usuario ? ` · ${interacao.usuario.nome_completo}` : ""}
                </p>
              </div>
              {interacao.descricao ? (
                <p className="mt-1 text-sm whitespace-pre-line text-ink">
                  {interacao.descricao}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
