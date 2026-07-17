---
name: Atma CRM
description: Painel de gestão de imóveis e carteira de clientes para a equipe interna da Atma
colors:
  bg: "#f5f5f5"
  surface: "#ededee"
  border: "#d8dadb"
  border-strong: "#a2aaad"
  ink: "#222222"
  muted: "#5c6366"
  primary: "#005eb8"
  primary-hover: "#004c96"
  primary-soft: "#e3edf7"
  sage: "#2e7d4f"
  gold: "#f3c13a"
  slate: "#5b7a94"
  alert: "#b3402e"
typography:
  display:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.14em"
  nav:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.12em"
  brand:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.28em"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  input-underline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "0px"
    padding: "0 0 8px 0"
  nav-item-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "0px"
    padding: "0 0 12px 0"
---

# Design System: Atma CRM

## 1. Overview

**Creative North Star: "Papel timbrado, não painel de software"**

O Atma CRM rejeita a gramática do dashboard genérico (sidebar escura + grade de cards idênticos) e se organiza como material impresso de uma consultoria: masthead horizontal no topo com wordmark em tracking largo, seções separadas por linhas finas e espaço em branco — nunca por caixas —, números grandes em monoespaçada, e um único acento saturado. A hierarquia vem de tipografia e réguas, não de superfícies coloridas.

A paleta é neutra e fria: fundo cinza-claro, tinta quase preta, azul `#005eb8` como única cor de ação, e um conjunto semântico próprio para status (verde/dourado/ardósia/alerta) que nunca reaproveita o azul de ação. Densidade de dados é aceitável — é ferramenta de uso diário — mas o essencial (status, próxima ação, alerta) deve ser legível de relance.

**Key Characteristics:**
- Zero caixas: seções abrem com título + régua forte (2px em tinta); divisões internas usam hairlines
- Azul de ação em ≤10% da tela (botão primário, item ativo do menu, linha do gráfico, foco de campo)
- Status como ponto colorido + texto (nunca pill de fundo saturado)
- Números tabulares (KPIs, preços, m², códigos) sempre em IBM Plex Mono
- Formulários com campos sublinhados (borda inferior), não caixas com contorno completo

## 2. Colors

Paleta 1 do projeto: neutros frios + azul de ação + dourado de atenção.

### Primary
- **Azul de Ação** (#005eb8): botão primário, sublinhado do item de navegação ativo, linha principal de gráfico, borda de campo em foco. Branco sobre ele rende ~6.4:1 (AA). Hover escurece para #004c96.

### Neutral
- **Cinza Papel** (#f5f5f5): fundo base de toda a aplicação.
- **Cinza Superfície** (#ededee): hover de linhas de tabela.
- **Hairline** (#d8dadb): divisores e bordas correntes.
- **Hairline Forte** (#a2aaad): bordas que precisam de mais presença; **nunca texto** (2.2:1 sobre o fundo).
- **Tinta** (#222222): texto principal e réguas de seção (~13.6:1).
- **Grafite** (#5c6366): texto secundário, labels, timestamps (~5.5:1, derivado da paleta para cumprir AA).

### Status (semântico — nunca reutiliza o azul de ação)
- **Verde Disponível** (#2e7d4f): imóvel disponível, confirmações.
- **Dourado Reservado** (#f3c13a): reservado, pendência não crítica — da paleta base; com texto escuro quando usado como preenchimento.
- **Ardósia Alugado** (#5b7a94): estados informativos neutros.
- **Alerta** (#b3402e): contrato vencendo, erro de formulário.
- **Tinta Vendido** (#222222): estado encerrado.

### Named Rules
**A Regra do Acento Único.** O azul #005eb8 é a única cor saturada de interface e nunca ultrapassa ~10% da tela. Status têm paleta própria; se um status precisasse do azul de ação, o sistema está errado.

## 3. Typography

**Display Font:** Manrope (fallback system-ui, sans-serif)
**Body Font:** Manrope (mesma família, pesos 400–700)
**Label/Mono Font:** IBM Plex Mono (dados numéricos e códigos)

**Character:** Uma única família sans-serif em vários pesos e trackings constrói toda a hierarquia — do wordmark "ATMA" (caixa alta, tracking 0.28em) aos labels de campo (caixa alta, tracking 0.14em). IBM Plex Mono entra onde o dado é numérico e precisa alinhar em coluna.

### Hierarchy
- **Display** (700, 2.25rem, 1.15): título de página.
- **Headline** (600, 1.25rem, 1.3): título de seção, sobre a régua de 2px.
- **Body** (400, 0.9375rem, 1.55): texto corrente e células de tabela; blocos limitados a 65–75ch.
- **Label** (600, 0.6875rem, tracking 0.14em, uppercase): labels de campo, cabeçalhos de tabela, KPI labels.
- **Nav** (600, 0.8125rem, tracking 0.12em, uppercase): itens do masthead.
- **Brand** (600, 1.125rem, tracking 0.28em, uppercase): exclusivo do wordmark.
- **Data** (mono 500, 0.875rem): valores monetários, metragem, códigos; KPIs usam a mesma família em ~2.6rem.

### Named Rules
**A Regra da Família Única.** Hierarquia por peso, tamanho e tracking de uma única família — nunca uma segunda sans-serif.

## 4. Elevation

Sistema flat por completo: profundidade vem de réguas (2px tinta para abrir seção, hairline para dividir conteúdo) e da diferença bg/surface no hover. Sombra existe só para elementos flutuantes.

### Shadow Vocabulary
- **Flutuante** (`box-shadow: 0 8px 24px rgba(34,34,34,0.14)`): tooltips de gráfico, dropdowns futuros.

### Named Rules
**A Regra do Flat-em-Repouso.** Nenhuma superfície em repouso tem sombra ou "card". Se um agrupamento pede moldura, use título + régua.

## 5. Components

### Masthead / Navigation
- Faixa superior com a logo oficial da Atma (lockup de barras + wordmark "ATMA" + "Consultoria Imobiliária", `public/brand/atma-logo.png`), busca sublinhada e identificação do usuário; abaixo, navegação horizontal em caixa alta.
- Item ativo: sublinhado 2px em azul de ação + texto tinta. Inativo: texto grafite, hover para tinta. Nunca fundo preenchido.

### Buttons
- **Primary:** fundo azul #005eb8, texto branco em caixa alta com tracking 0.12em, cantos 6px, padding 12px 16px; hover #004c96; focus-visible com anel de 2px azul a 40%.

### Status
- Ponto de 8px na cor semântica + label em texto corrente. Nunca pill com fundo saturado; nunca `border-left` colorido.

### KPI Strip
- Faixa única entre réguas hairline, células divididas por hairlines verticais (2×2 no mobile). Label uppercase pequeno, número mono ~2.6rem, delta em verde/grafite.

### Tables
- Cabeçalho em label uppercase com hairline; linhas com hairline, hover em Cinza Superfície; valores em mono; coluna secundária some no mobile (`max-md:hidden`).

### Inputs / Fields
- Sublinhados: sem fundo, borda inferior hairline; foco muda a borda para azul; erro muda para Alerta com mensagem abaixo. Labels uppercase pequenos acima.

### Toggles / Switches
- Track 40×24px: hairline quando desligado, azul de ação quando ligado; thumb branco; transição de 150ms; focus-visible com anel azul.

### Charts
- Linha: traço azul 2px sem pontos em repouso, grid horizontal pontilhado em hairline, eixos em mono 11px, tooltip flutuante com sombra.
- Composição: barra empilhada fina (10px, cantos pill) nas cores de status + lista com contagens em mono — não usar donut/pizza.

## 6. Do's and Don'ts

### Do:
- **Do** abrir toda seção com título + régua de 2px em tinta; dividir conteúdo interno só com hairlines e espaço.
- **Do** manter o azul #005eb8 em ≤10% de qualquer tela (A Regra do Acento Único).
- **Do** usar IBM Plex Mono para qualquer valor numérico tabular.
- **Do** usar #a2aaad apenas em bordas; texto secundário é #5c6366.

### Don't:
- **Don't** reintroduzir a gramática de dashboard genérico: sidebar escura, grade de cards idênticos, pills de status coloridas — anti-padrões explícitos deste projeto.
- **Don't** usar o azul de ação em status ou gráficos secundários — status têm paleta própria.
- **Don't** usar `border-left` colorido como indicador de status.
- **Don't** aplicar sombra em superfícies de repouso — sombra é só para elementos flutuantes.
- **Don't** usar caixas com contorno completo em campos de formulário — campos são sublinhados.
