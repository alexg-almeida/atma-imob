import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { mapaEmailsPorUsuario } from "@/lib/supabase/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { CorePerfil } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Usuários · Atma CRM",
};

function sanitize(term: string) {
  return term.replace(/[,()%]/g, " ").trim();
}

function StatusDot({ ativo }: { ativo: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: ativo ? "var(--color-sage)" : "var(--color-slate)" }}
        aria-hidden
      />
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

export default async function UsuariosPage(props: PageProps<"/admin/usuarios">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

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

  const supabase = await createClient();
  let query = supabase
    .from("core_perfis")
    .select("*")
    .eq("ativo", true)
    .order("nome_completo");

  const term = sanitize(q);
  if (term) {
    query = query.ilike("nome_completo", `%${term}%`);
  }

  const [{ data: perfis, error }, { emails, disponivel }] = await Promise.all([
    query,
    mapaEmailsPorUsuario(),
  ]);
  const lista = (perfis ?? []) as CorePerfil[];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-8 pb-6">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Usuários
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Equipe interna com acesso ao CRM e suas permissões por módulo.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/usuarios/novo">Novo usuário</Link>
        </Button>
      </div>

      {!disponivel ? (
        <p className="mb-6 flex items-center gap-2 rounded-sm bg-gold/10 px-4 py-3 text-sm text-ink">
          <WarningCircle size={16} className="shrink-0 text-gold" aria-hidden />
          <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          não configurada — e-mails ocultos e criação de novo usuário
          indisponível até configurar.
        </p>
      ) : null}

      <form
        method="get"
        action="/admin/usuarios"
        className="flex flex-wrap items-end gap-6 border-b border-line pb-5"
      >
        <label className="flex min-w-64 flex-1 items-center gap-2 border-b border-line pb-2 focus-within:border-primary">
          <MagnifyingGlass
            size={15}
            className="shrink-0 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
          />
        </label>

        <button
          type="submit"
          className="rounded-sm bg-primary px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Filtrar
        </button>
        <p className="ml-auto font-mono text-xs text-muted-foreground">
          {lista.length} {lista.length === 1 ? "registro" : "registros"}
        </p>
      </form>

      {error ? (
        <p className="py-12 text-center text-sm text-alert">
          Não foi possível carregar: {error.message}
        </p>
      ) : lista.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </p>
        </div>
      ) : (
        <Table className="mt-2">
          <TableHeader>
            <TableRow className="border-line hover:bg-transparent">
              <TableHead className="px-0 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Nome
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase max-md:hidden">
                E-mail
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase max-lg:hidden">
                Telefone
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Status
              </TableHead>
              <TableHead className="pr-0 text-right text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase max-md:hidden">
                Desde
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((perfil) => (
              <TableRow
                key={perfil.id}
                className="border-line transition-colors hover:bg-surface"
              >
                <TableCell className="px-0 py-4">
                  <Link
                    href={`/admin/usuarios/${perfil.id}`}
                    className="font-medium text-ink underline-offset-4 hover:underline"
                  >
                    {perfil.nome_completo}
                  </Link>
                </TableCell>
                <TableCell className="py-4 font-mono text-sm text-ink max-md:hidden">
                  {emails[perfil.id] || "—"}
                </TableCell>
                <TableCell className="py-4 font-mono text-sm text-ink max-lg:hidden">
                  {perfil.telefone ?? "—"}
                </TableCell>
                <TableCell className="py-4">
                  <StatusDot ativo={perfil.ativo} />
                </TableCell>
                <TableCell className="py-4 pr-0 text-right font-mono text-xs text-muted-foreground max-md:hidden">
                  {formatDate(perfil.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
