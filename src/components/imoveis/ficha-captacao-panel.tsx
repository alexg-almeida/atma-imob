"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EnvelopeSimple,
  FileArrowDown,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { gerarFichaCaptacaoPdf } from "@/lib/pdf/ficha-captacao";
import { formatDate } from "@/lib/format";
import type {
  FichaCaptacaoStatus,
  Imovel,
  ImovelFichaCaptacao,
  Proprietario,
} from "@/lib/supabase/types";

const BUCKET = "imoveis-fichas";

const statusLabels: Record<FichaCaptacaoStatus, string> = {
  rascunho: "Rascunho",
  gerada: "Gerada",
  enviada: "Enviada",
};

const statusColors: Record<FichaCaptacaoStatus, string> = {
  rascunho: "var(--color-strong-line)",
  gerada: "var(--color-gold)",
  enviada: "var(--color-sage)",
};

type ProprietarioVinculo = {
  proprietario: Proprietario;
  percentual_participacao: number | null;
  principal: boolean;
};

export function FichaCaptacaoPanel({
  imovel,
  tipoNome,
  captadorNome,
  proprietarios,
  fichas: fichasIniciais,
  tituloImovel,
  termoTitulo,
  termoCorpo,
}: {
  imovel: Imovel;
  tipoNome: string;
  captadorNome: string | null;
  proprietarios: ProprietarioVinculo[];
  fichas: ImovelFichaCaptacao[];
  tituloImovel: string;
  termoTitulo: string | null;
  termoCorpo: string | null;
}) {
  const router = useRouter();
  const [fichas, setFichas] = useState(fichasIniciais);
  const [gerando, setGerando] = useState(false);
  const ultima = fichas[0] ?? null;

  async function handleGerar() {
    setGerando(true);
    const supabase = createClient();
    try {
      const doc = await gerarFichaCaptacaoPdf({
        imovel,
        tipoNome,
        captadorNome,
        proprietarios,
        termoTitulo,
        termoCorpo,
      });
      const blob = doc.output("blob");
      const path = `${imovel.id}/${crypto.randomUUID()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: "application/pdf" });
      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { data: nova, error: insertError } = await supabase
        .from("imoveis_fichas_captacao")
        .insert({
          imovel_id: imovel.id,
          status: "gerada",
          link_token: crypto.randomUUID(),
          pdf_final_url: publicUrl,
        })
        .select("*")
        .single();
      if (insertError || !nova) {
        throw new Error(insertError?.message ?? "falha ao registrar a ficha");
      }

      setFichas((prev) => [nova as ImovelFichaCaptacao, ...prev]);
      toast.success("Ficha de captação gerada.");
      doc.save(`ficha-captacao-${imovel.id.slice(0, 8)}.pdf`);
      router.refresh();
    } catch (error) {
      toast.error(
        `Falha ao gerar a ficha: ${error instanceof Error ? error.message : "erro desconhecido"}`,
      );
    } finally {
      setGerando(false);
    }
  }

  async function marcarComoEnviada(ficha: ImovelFichaCaptacao) {
    if (ficha.status === "enviada") return;
    const supabase = createClient();
    const agora = new Date().toISOString();
    const { error } = await supabase
      .from("imoveis_fichas_captacao")
      .update({ status: "enviada", enviado_em: agora })
      .eq("id", ficha.id);
    if (error) {
      toast.error(`Não foi possível atualizar o status: ${error.message}`);
      return;
    }
    setFichas((prev) =>
      prev.map((f) =>
        f.id === ficha.id ? { ...f, status: "enviada", enviado_em: agora } : f,
      ),
    );
    router.refresh();
  }

  function compartilharWhatsapp(ficha: ImovelFichaCaptacao) {
    if (!ficha.pdf_final_url) return;
    const texto = `Ficha de captação — ${tituloImovel}\n${ficha.pdf_final_url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    marcarComoEnviada(ficha);
  }

  function compartilharEmail(ficha: ImovelFichaCaptacao) {
    if (!ficha.pdf_final_url) return;
    const assunto = `Ficha de captação — ${tituloImovel}`;
    const corpo = `Segue o link da ficha de captação:\n${ficha.pdf_final_url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    marcarComoEnviada(ficha);
  }

  return (
    <section aria-labelledby="ficha-heading" className="space-y-6">
      <div className="border-b-2 border-ink pb-4">
        <h2 id="ficha-heading" className="text-xl font-semibold tracking-tight text-ink">
          Ficha de captação
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gere o PDF formal com os dados do imóvel e do(s) proprietário(s) para
          revisão e assinatura.
        </p>
      </div>

      <Button type="button" onClick={handleGerar} disabled={gerando}>
        <FileArrowDown size={16} aria-hidden />
        {gerando ? "Gerando…" : "Gerar ficha de captação em PDF"}
      </Button>

      {ultima ? (
        <div className="flex flex-wrap items-center gap-3 rounded-sm bg-surface px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm text-ink">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: statusColors[ultima.status] }}
              aria-hidden
            />
            Última ficha: {statusLabels[ultima.status]} em {formatDate(ultima.created_at)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-3 py-2 text-[11px] tracking-[0.1em]"
              onClick={() => compartilharWhatsapp(ultima)}
            >
              <WhatsappLogo size={14} aria-hidden /> WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-3 py-2 text-[11px] tracking-[0.1em]"
              onClick={() => compartilharEmail(ultima)}
            >
              <EnvelopeSimple size={14} aria-hidden /> E-mail
            </Button>
          </div>
        </div>
      ) : null}

      {fichas.length > 1 ? (
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Histórico
          </p>
          <ul className="mt-2 divide-y divide-line">
            {fichas.slice(1).map((ficha) => (
              <li
                key={ficha.id}
                className="flex items-center justify-between gap-4 py-2.5 text-sm text-ink"
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: statusColors[ficha.status] }}
                    aria-hidden
                  />
                  {statusLabels[ficha.status]}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDate(ficha.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
