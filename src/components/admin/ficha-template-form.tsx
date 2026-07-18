"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { TERMO_VARIAVEIS_DISPONIVEIS } from "@/lib/pdf/ficha-captacao";

export function FichaTemplateForm({
  configId,
  tituloInicial,
  corpoInicial,
}: {
  configId: string | null;
  tituloInicial: string;
  corpoInicial: string;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(tituloInicial);
  const [corpo, setCorpo] = useState(corpoInicial);
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    setSalvando(true);
    const supabase = createClient();
    const { error } = configId
      ? await supabase
          .from("fichas_captacao_configuracoes")
          .update({ titulo, corpo })
          .eq("id", configId)
      : await supabase
          .from("fichas_captacao_configuracoes")
          .insert({ titulo, corpo });

    if (error) {
      toast.error(`Falha ao salvar: ${error.message}`);
      setSalvando(false);
      return;
    }
    toast.success("Termo atualizado.");
    setSalvando(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Título do termo
          </span>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Corpo do termo
          </span>
          <Textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={22}
            className="font-mono text-[13px] leading-relaxed"
          />
          <span className="text-xs text-muted-foreground">
            Separe cláusulas por uma linha em branco. Uma linha começando com
            &quot;1. &quot;, &quot;2. &quot; etc. sai em negrito como título da
            cláusula — as linhas seguintes do mesmo bloco saem no texto
            corrido.
          </span>
        </label>

        <Button type="button" onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar termo"}
        </Button>
      </div>

      <aside className="lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Variáveis disponíveis
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use <code className="font-mono text-ink">{"{{chave}}"}</code> em
          qualquer ponto do corpo — é substituído pelo dado real na hora de
          gerar o PDF.
        </p>
        <dl className="mt-5 space-y-3">
          {TERMO_VARIAVEIS_DISPONIVEIS.map((v) => (
            <div key={v.chave}>
              <dt className="font-mono text-xs text-primary">
                {`{{${v.chave}}}`}
              </dt>
              <dd className="mt-0.5 text-xs text-muted-foreground">
                {v.descricao}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-muted-foreground">
          Dados do(a) proprietário(a), do imóvel e o restante da estrutura do
          documento (qualificação, assinaturas) são fixos e não fazem parte
          deste texto.
        </p>
      </aside>
    </div>
  );
}
