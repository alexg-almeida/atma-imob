<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Atma CRM

CRM de gestão imobiliária da **Atma Consultoria Imobiliária** (Ribeirão Preto). Single-tenant: uma única imobiliária usa o sistema. Usuários são a equipe interna; um módulo para proprietários de imóveis virá no futuro. Idioma da UI e das conversas: **português (pt-BR)**.

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 (tokens via `@theme inline` em `src/app/globals.css`, sem `tailwind.config`)
- shadcn/ui (estilo radix-nova, componentes em `src/components/ui/`) — os tokens semânticos do shadcn (`--background`, `--primary`, `--border`…) são **mapeados para os tokens Atma** no `globals.css`; nunca reintroduzir o tema padrão do shadcn
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`): clients em `src/lib/supabase/client.ts` (browser) e `server.ts` (server)
- Formulários: react-hook-form + zod + @hookform/resolvers (wrapper em `src/components/ui/form.tsx`)
- PDF: jspdf + jspdf-autotable + html2canvas (Book e Ficha de Captação)
- Drag-and-drop: @dnd-kit/core + @dnd-kit/sortable (Kanban de leads, ordenação de fotos)
- Ícones: **@phosphor-icons/react** no código do produto (lucide-react existe só como dependência interna do shadcn)
- Gráficos: recharts (atributos SVG não aceitam `var()` — usar constantes hex dos tokens)
- Fontes: Manrope (`--font-sans`) + IBM Plex Mono (`--font-mono`) via next/font — **não trocar**

## Design

Identidade aprovada pelo dono do projeto — ler `PRODUCT.md` e `DESIGN.md` antes de criar qualquer tela. Resumo: estilo editorial "papel timbrado" (masthead horizontal, sem sidebar escura, sem grades de cards), Paleta 1 (bg `#f5f5f5`, ink `#222222`, ação `#005eb8`, status sage/gold/slate/alert), WCAG AA. Azul é o único acento saturado (≤10% da tela); status usa ponto colorido + texto, nunca pill nem o azul de ação.

## Banco de dados (Supabase)

**⚠️ Conexão**: este projeto usa um Supabase **próprio da Atma**, ainda não conectado. NUNCA usar os projetos da conta SVN (`svn-sistemas`, `svn-crm`) mesmo que um MCP deles esteja disponível na sessão. `.env.local` tem placeholders (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`) até a conta certa ser conectada.

Convenções obrigatórias:

- Tabela principal de um módulo = nome do módulo sem prefixo (`leads`, `imoveis`, `proprietarios`, `parceiros`). Tabelas de apoio = prefixo do módulo (`leads_etapas`, `imoveis_fotos`).
- Toda tabela tem: `id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`, `created_by uuid references auth.users`, `ativo boolean default true`.
- **Soft delete por padrão** (`ativo = false`) — nunca DELETE físico em dado de negócio a partir de código comum. Exceção única: a ação "Excluir definitivamente" do `ExcluirRegistroButton`, visível só para quem tem acesso total ao sistema (`core`/`editar`, i.e. superadmin) e só quando o próprio usuário escolhe explicitamente essa opção na confirmação — aí sim faz `DELETE` físico de verdade.
- **RLS habilitado em 100% das tabelas desde a criação**, sem exceção.
- Migrations via Supabase, uma por funcionalidade, com nome descritivo.
- **Antes de criar qualquer tabela, mostrar o DDL proposto e só aplicar a migration após confirmação explícita do usuário.**

## Rotas

Padrão App Router: `app/imoveis/page.tsx`, `app/imoveis/[id]/page.tsx`, `app/imoveis/novo/page.tsx`. Os itens/submenus do menu estão em `src/components/nav-items.ts`.

## Comandos

- Dev: `npm run dev` (em sessões do Claude, usar porta alternativa, ex. `-p 3210`)
- Typecheck: `npx tsc --noEmit` · Lint: `npm run lint` · Build: `npm run build`
