import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { Proprietario } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Proprietários · Atma CRM",
};

function sanitize(term: string) {
  return term.replace(/[,()%]/g, " ").trim();
}

export default async function ProprietariosPage(
  props: PageProps<"/proprietarios">,
) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const supabase = await createClient();
  let query = supabase
    .from("proprietarios")
    .select("*")
    .eq("ativo", true)
    .order("nome_completo");

  const term = sanitize(q);
  if (term) {
    const digits = term.replace(/\D/g, "");
    query = query.or(
      [
        `nome_completo.ilike.%${term}%`,
        digits ? `cpf.ilike.%${digits}%` : null,
      ]
        .filter(Boolean)
        .join(","),
    );
  }

  const { data: proprietarios, error } = await query;
  const lista = (proprietarios ?? []) as Proprietario[];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-8 pb-6">
        <div>
          <h1 className="text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
            Proprietários
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Donos dos imóveis administrados pela Atma.
          </p>
        </div>
        <Button asChild>
          <Link href="/proprietarios/novo">Novo proprietário</Link>
        </Button>
      </div>

      <form
        method="get"
        action="/proprietarios"
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
            placeholder="Buscar por nome ou CPF…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button
          type="submit"
          className="rounded-sm bg-primary px-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Buscar
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
            Nenhum proprietário encontrado.
          </p>
          <Link
            href="/proprietarios/novo"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
          >
            Cadastrar o primeiro proprietário →
          </Link>
        </div>
      ) : (
        <Table className="mt-2">
          <TableHeader>
            <TableRow className="border-line hover:bg-transparent">
              <TableHead className="px-0 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Nome
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                CPF
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase max-md:hidden">
                Contato
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase max-lg:hidden">
                Profissão
              </TableHead>
              <TableHead className="pr-0 text-right text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase max-md:hidden">
                Atualizado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((proprietario) => (
              <TableRow
                key={proprietario.id}
                className="border-line transition-colors hover:bg-surface"
              >
                <TableCell className="px-0 py-4">
                  <Link
                    href={`/proprietarios/${proprietario.id}`}
                    className="font-medium text-ink underline-offset-4 hover:underline"
                  >
                    {proprietario.nome_completo}
                  </Link>
                </TableCell>
                <TableCell className="py-4 font-mono text-sm text-ink">
                  {proprietario.cpf ?? "—"}
                </TableCell>
                <TableCell className="py-4 max-md:hidden">
                  <p className="text-sm text-ink">
                    {proprietario.whatsapp ?? proprietario.telefone ?? "—"}
                  </p>
                  {proprietario.email ? (
                    <p className="text-xs text-muted-foreground">
                      {proprietario.email}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="py-4 text-sm text-ink max-lg:hidden">
                  {proprietario.profissao ?? "—"}
                </TableCell>
                <TableCell className="py-4 pr-0 text-right font-mono text-xs text-muted-foreground max-md:hidden">
                  {formatDate(proprietario.updated_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
