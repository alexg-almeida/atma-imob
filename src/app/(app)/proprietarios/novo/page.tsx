import type { Metadata } from "next";
import Link from "next/link";
import { temPermissao } from "@/lib/permissoes";
import { ProprietarioForm } from "@/components/proprietarios/proprietario-form";

export const metadata: Metadata = {
  title: "Novo proprietário · Atma CRM",
};

export default async function NovoProprietarioPage() {
  const [podeCriar, podeFinanceiro] = await Promise.all([
    temPermissao("proprietarios", "criar"),
    temPermissao("proprietarios", "financeiro"),
  ]);

  if (!podeCriar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para cadastrar proprietários.
        </p>
        <Link
          href="/proprietarios"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href="/proprietarios"
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Proprietários
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
          Novo proprietário
        </h1>
      </div>

      <ProprietarioForm podeFinanceiro={podeFinanceiro} />
    </>
  );
}
