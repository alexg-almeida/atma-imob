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
import { parceiroTipoLabels, parceiroTipos } from "@/lib/supabase/types";
import type { Parceiro, ParceiroTipo } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Parceiros · Atma CRM",
};

function sanitize(term: string) {
  return term.replace(/[,()%]/g, " ").trim();
}

export default async function ParceirosPage(props: PageProps<"/parceiros">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const tipo =
    typeof searchParams.tipo === "string" &&
    (parceiroTipos as string[]).includes(searchParams.tipo)
      ? (searchParams.tipo as ParceiroTipo)
      : undefined;

  const supabase = await createClient();
  let query = supabase
    .from("parceiros")
    .select("*")
    .eq("ativo", true)
    .order("nome_completo");

  if (tipo) query = query.eq("tipo", tipo);

  const term = sanitize(q);
  if (term) {
    query = query.ilike("nome_completo", `%${term}%`);
  }

  const { data: parceiros, error } = await query;
  const lista = (parceiros ?? []) as Parceiro[];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-8 pb-6">
        <div>
          <h1 className="text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
            Parceiros
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Corretores e captadores que atuam com a Atma.
          </p>
        </div>
        <Button asChild>
          <Link href="/parceiros/novo">Novo parceiro</Link>
        </Button>
      </div>

      <form
        method="get"
        action="/parceiros"
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

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Tipo
          </span>
          <select
            name="tipo"
            defaultValue={tipo ?? ""}
            className="cursor-pointer border-0 border-b border-line bg-transparent pb-2 text-sm text-ink outline-none transition-colors duration-150 focus:border-primary"
          >
            <option value="">Todos</option>
            {parceiroTipos.map((t) => (
              <option key={t} value={t}>
                {parceiroTipoLabels[t]}
              </option>
            ))}
          </select>
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
            Nenhum parceiro encontrado.
          </p>
          <Link
            href="/parceiros/novo"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
          >
            Cadastrar o primeiro parceiro →
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
                Tipo
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase max-md:hidden">
                Contato
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase max-lg:hidden">
                CRECI
              </TableHead>
              <TableHead className="pr-0 text-right text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase max-md:hidden">
                Comissão padrão
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((parceiro) => (
              <TableRow
                key={parceiro.id}
                className="border-line transition-colors hover:bg-surface"
              >
                <TableCell className="px-0 py-4">
                  <Link
                    href={`/parceiros/${parceiro.id}`}
                    className="font-medium text-ink underline-offset-4 hover:underline"
                  >
                    {parceiro.nome_completo}
                  </Link>
                  {parceiro.perfil_id ? (
                    <p className="mt-0.5 text-[11px] tracking-[0.08em] text-primary uppercase">
                      Acessa o sistema
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="py-4 text-sm text-ink">
                  {parceiroTipoLabels[parceiro.tipo]}
                </TableCell>
                <TableCell className="py-4 max-md:hidden">
                  <p className="text-sm text-ink">
                    {parceiro.whatsapp ?? parceiro.telefone ?? "—"}
                  </p>
                  {parceiro.email ? (
                    <p className="text-xs text-muted-foreground">
                      {parceiro.email}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="py-4 font-mono text-sm text-ink max-lg:hidden">
                  {parceiro.creci ?? "—"}
                </TableCell>
                <TableCell className="py-4 pr-0 text-right font-mono text-sm text-ink max-md:hidden">
                  {parceiro.comissao_padrao_percentual != null
                    ? `${parceiro.comissao_padrao_percentual}%`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
