import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, PencilSimple, XCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { buscarEmailUsuario } from "@/lib/supabase/admin";
import { excluirUsuarioDefinitivamente } from "../actions";
import { ExcluirRegistroButton } from "@/components/excluir-registro-button";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { EXTRAS_POR_MODULO } from "@/lib/admin/permissoes-extras";
import type { CoreModulo, CorePerfil, CorePermissao } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Usuário · Atma CRM",
};

function InfoRow({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className={`text-right text-sm text-ink ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function AcaoIcone({ ativo }: { ativo: boolean }) {
  return ativo ? (
    <CheckCircle size={17} weight="fill" className="text-sage" aria-hidden />
  ) : (
    <XCircle size={17} className="text-strong-line" aria-hidden />
  );
}

export default async function UsuarioPage(props: PageProps<"/admin/usuarios/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const podeEditar = await temPermissao("core", "editar");
  if (!podeEditar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Só administradores com acesso total ao sistema podem gerenciar
          usuários.
        </p>
      </div>
    );
  }

  const { data } = await supabase
    .from("core_perfis")
    .select("*")
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (!data) notFound();
  const perfil = data as CorePerfil;

  const [
    podeExcluir,
    email,
    { data: modulos },
    { data: permissoes },
    { data: userData },
  ] = await Promise.all([
    temPermissao("core", "excluir"),
    buscarEmailUsuario(id),
    supabase.from("core_modulos").select("*").eq("ativo", true).order("nome"),
    supabase.from("core_permissoes").select("*").eq("perfil_id", id).eq("ativo", true),
    supabase.auth.getUser(),
  ]);

  const listaModulos = (modulos ?? []) as CoreModulo[];
  const listaPermissoes = (permissoes ?? []) as CorePermissao[];
  const permissoesPorModulo = new Map(listaPermissoes.map((p) => [p.modulo_id, p]));
  const ehVoceMesmo = userData.user?.id === id;

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href="/admin/usuarios"
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Usuários
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Admin
            </p>
            <h1 className="mt-1 text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
              {perfil.nome_completo}
            </h1>
            {ehVoceMesmo ? (
              <p className="mt-2 text-xs text-muted-foreground">Esta é a sua conta.</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" asChild>
              <Link href={`/admin/usuarios/${id}/editar`}>
                <PencilSimple size={14} aria-hidden /> Editar
              </Link>
            </Button>
            {podeExcluir && !ehVoceMesmo ? (
              <ExcluirRegistroButton
                tabela="core_perfis"
                id={id}
                redirectTo="/admin/usuarios"
                titulo="Excluir usuário"
                descricao="O usuário perde acesso ao sistema e some da listagem. Essa ação não pode ser desfeita."
                podeExcluirDefinitivamente={podeEditar}
                excluirDefinitivamente={excluirUsuarioDefinitivamente}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 border-t border-line pt-12 lg:grid-cols-12">
        <section aria-labelledby="permissoes-heading" className="lg:col-span-7">
          <div className="border-b-2 border-ink pb-4">
            <h2
              id="permissoes-heading"
              className="text-xl font-semibold tracking-tight text-ink"
            >
              Permissões por módulo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O que este usuário pode ver, criar, editar e excluir em cada
              área do sistema.
            </p>
          </div>

          <div className="divide-y divide-line">
            {listaModulos.map((modulo) => {
              const p = permissoesPorModulo.get(modulo.id);
              const extras = EXTRAS_POR_MODULO[modulo.slug] ?? [];
              return (
                <div key={modulo.id} className="py-5">
                  <p className="font-medium text-ink">{modulo.nome}</p>
                  <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <AcaoIcone ativo={p?.pode_visualizar ?? false} /> Visualizar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <AcaoIcone ativo={p?.pode_criar ?? false} /> Criar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <AcaoIcone ativo={p?.pode_editar ?? false} /> Editar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <AcaoIcone ativo={p?.pode_excluir ?? false} /> Excluir
                    </span>
                    {extras.map((extra) => (
                      <span key={extra.chave} className="flex items-center gap-1.5">
                        <AcaoIcone
                          ativo={p?.permissoes_extras.includes(extra.chave) ?? false}
                        />{" "}
                        {extra.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
          <section aria-labelledby="contato-heading">
            <div className="border-b-2 border-ink pb-4">
              <h2
                id="contato-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Contato
              </h2>
            </div>
            <dl className="divide-y divide-line">
              <InfoRow label="E-mail" value={email} mono />
              <InfoRow label="Telefone" value={perfil.telefone} mono />
              <InfoRow label="Usuário desde" value={formatDate(perfil.created_at)} mono />
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
