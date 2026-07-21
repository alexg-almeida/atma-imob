import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { FichaTemplateForm } from "@/components/admin/ficha-template-form";
import {
  TERMO_CORPO_PADRAO,
  TERMO_TITULO_PADRAO,
} from "@/lib/pdf/ficha-captacao";

export const metadata: Metadata = {
  title: "Termo da ficha de captação · Atma CRM",
};

export default async function AdminFichaCaptacaoPage() {
  const podeEditar = await temPermissao("core", "editar");

  if (!podeEditar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Só administradores com acesso total ao sistema podem configurar
          este texto.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: config } = await supabase
    .from("fichas_captacao_configuracoes")
    .select("id, titulo, corpo")
    .eq("ativo", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <div className="pt-8 pb-6">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Admin
        </p>
        <h1 className="mt-1 text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
          Termo da ficha de captação
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Texto do Termo de Autorização e Aceite anexado ao final de toda
          ficha de captação gerada em PDF. Use as variáveis abaixo para
          preencher dados automaticamente.
        </p>
      </div>

      <FichaTemplateForm
        configId={config?.id ?? null}
        tituloInicial={config?.titulo ?? TERMO_TITULO_PADRAO}
        corpoInicial={config?.corpo ?? TERMO_CORPO_PADRAO}
      />
    </>
  );
}
