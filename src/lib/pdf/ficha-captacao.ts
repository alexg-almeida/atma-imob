import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { finalidadeLabels, statusLabels } from "@/lib/imoveis/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Imovel, Proprietario } from "@/lib/supabase/types";

const AZUL_ATMA: [number, number, number] = [0, 94, 184];
const CINZA_TEXTO: [number, number, number] = [34, 34, 34];
const CINZA_MUTED: [number, number, number] = [120, 128, 130];
const CINZA_LINHA: [number, number, number] = [216, 218, 219];
const CINZA_CLARO: [number, number, number] = [237, 237, 238];

type ProprietarioVinculo = {
  proprietario: Proprietario;
  percentual_participacao: number | null;
  principal: boolean;
};

function getFinalY(doc: jsPDF, fallback: number): number {
  const withTable = doc as unknown as { lastAutoTable?: { finalY: number } };
  return withTable.lastAutoTable?.finalY ?? fallback;
}

function linha(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

/** Busca um asset same-origin (`/brand/*`, `/fonts/*`) e converte para data URL. */
async function assetParaDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Embute a Manrope (light + bold, mesma família usada na UI) no PDF — os
 * fontes padrão do jsPDF (helvetica) não têm peso "light", só normal/bold.
 * Retorna o nome da família a usar (`"Manrope"` se deu certo, senão o
 * fallback `"helvetica"`).
 */
async function registrarFonteManrope(doc: jsPDF): Promise<string> {
  const [light, bold] = await Promise.all([
    assetParaDataUrl("/fonts/manrope-light.ttf"),
    assetParaDataUrl("/fonts/manrope-bold.ttf"),
  ]);
  if (!light || !bold) return "helvetica";
  doc.addFileToVFS("Manrope-Light.ttf", light.split(",")[1]);
  doc.addFont("Manrope-Light.ttf", "Manrope", "normal");
  doc.addFileToVFS("Manrope-Bold.ttf", bold.split(",")[1]);
  doc.addFont("Manrope-Bold.ttf", "Manrope", "bold");
  return "Manrope";
}

/** Cabeçalho de seção com fundo claro + texto escuro, em vez de uma barra azul cheia. */
function headStylesSecao(fonte: string, fontSize = 8) {
  return {
    font: fonte,
    fillColor: CINZA_CLARO,
    textColor: CINZA_TEXTO,
    fontStyle: "bold" as const,
    fontSize,
  };
}

/** Variáveis disponíveis para uso em `{{chave}}` no corpo do termo, configurável na tela Admin. */
export const TERMO_VARIAVEIS_DISPONIVEIS: { chave: string; descricao: string }[] = [
  { chave: "proprietario_nome", descricao: "Nome do proprietário principal" },
  { chave: "proprietario_cpf", descricao: "CPF/CNPJ do proprietário" },
  { chave: "proprietario_rg", descricao: "RG do proprietário" },
  { chave: "proprietario_endereco", descricao: "Endereço do proprietário" },
  { chave: "imovel_endereco", descricao: "Endereço do imóvel" },
  { chave: "imovel_matricula", descricao: "Matrícula do imóvel" },
  { chave: "imovel_descricao", descricao: "Descrição do imóvel (usa a cadastrada, ou um resumo automático)" },
  { chave: "corretor_nome", descricao: "Nome da imobiliária" },
  { chave: "comissao_percentual", descricao: "Percentual de comissão cadastrado no imóvel" },
  { chave: "local", descricao: 'Cidade usada em "Local e Data"' },
  { chave: "hoje", descricao: "Data de hoje, já formatada (dd/mm/aaaa)" },
];

export const TERMO_TITULO_PADRAO =
  "TERMO DE AUTORIZAÇÃO E ACEITE PARA INTERMEDIAÇÃO IMOBILIÁRIA";

export const TERMO_CORPO_PADRAO = `1. AUTORIZAÇÃO DE INTERMEDIAÇÃO
O(a) PROPRIETÁRIO(A) acima qualificado(a) autoriza, de forma expressa, o CORRETOR/IMOBILIÁRIA a promover a oferta, divulgação, intermediação e negociação do imóvel descrito, podendo apresentar propostas, interagir com interessados e praticar os atos necessários à viabilização da venda/locação.

2. CIÊNCIA E CONCORDÂNCIA
O(a) PROPRIETÁRIO(A) declara estar ciente de que o CORRETOR/IMOBILIÁRIA atuará como intermediador do negócio, representando seus interesses exclusivamente no âmbito da intermediação imobiliária, não configurando transferência de propriedade ou poderes para assinatura de escritura/contrato definitivo.

3. COMISSÃO DE CORRETAGEM
O(a) PROPRIETÁRIO(A) concorda com o pagamento de comissão de corretagem no percentual de {{comissao_percentual}}% sobre o valor total da negociação, a ser paga no momento da concretização do negócio, independentemente de quem tenha apresentado o comprador/locatário, desde que haja participação do CORRETOR/IMOBILIÁRIA na intermediação.

4. NÃO EXCLUSIVIDADE / EXCLUSIVIDADE
(   ) Autorização sem exclusividade
(   ) Autorização com exclusividade
(Assinalar uma das opções)

5. DECLARAÇÕES FINAIS
O(a) PROPRIETÁRIO(A) declara que as informações prestadas são verdadeiras e que detém poderes legais para dispor do imóvel. Declara ainda que leu, compreendeu e concorda com todos os termos aqui estabelecidos.`;

/** Substitui `{{chave}}` pelo valor em `variaveis`; chaves desconhecidas ficam como estão (ajuda a notar erro de digitação no texto configurado). */
function substituirVariaveis(template: string, variaveis: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, chave: string) => variaveis[chave] ?? match);
}

/**
 * Monta a Ficha de Captação em PDF: cabeçalho de marca, tabelas
 * (jspdf-autotable) com os dados do imóvel, valores/encargos e
 * proprietário(s) vinculado(s), termo de autorização e aceite com
 * assinatura, e rodapé em todas as páginas. Sem fotos do imóvel — é um
 * documento de dados/assinatura, não de apresentação. Roda inteiramente no
 * navegador.
 */
export async function gerarFichaCaptacaoPdf({
  imovel,
  tipoNome,
  captadorNome,
  proprietarios,
  termoTitulo,
  termoCorpo,
}: {
  imovel: Imovel;
  tipoNome: string;
  captadorNome: string | null;
  proprietarios: ProprietarioVinculo[];
  /** Texto do termo configurado na tela Admin — usa o padrão se ausente. */
  termoTitulo?: string | null;
  termoCorpo?: string | null;
}): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margemX = 15;
  const larguraPagina = doc.internal.pageSize.getWidth();
  const larguraUtil = larguraPagina - margemX * 2;
  const alturaPagina = doc.internal.pageSize.getHeight();

  const [fonte, logoDataUrl, marcaDataUrl] = await Promise.all([
    registrarFonteManrope(doc),
    assetParaDataUrl("/brand/atma-logo.png"),
    assetParaDataUrl("/brand/atma-mark-square.png"),
  ]);

  // Cabeçalho de marca
  let y = 14;
  if (logoDataUrl) {
    const larguraLogo = 30;
    const alturaLogo = (larguraLogo * 257) / 763;
    doc.addImage(logoDataUrl, "PNG", margemX, y - alturaLogo + 2, larguraLogo, alturaLogo);
  } else {
    doc.setFont(fonte, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...AZUL_ATMA);
    doc.text("ATMA CONSULTORIA IMOBILIÁRIA", margemX, y);
  }

  y += 12;
  doc.setFont(fonte, "bold");
  doc.setFontSize(16);
  doc.setTextColor(...CINZA_TEXTO);
  doc.text("Ficha de Captação", margemX, y);

  y += 6;
  doc.setFont(fonte, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...CINZA_MUTED);
  doc.text(
    `Gerada em ${new Date().toLocaleDateString("pt-BR")} · ${tipoNome} · ${
      finalidadeLabels[imovel.finalidade]
    }`,
    margemX,
    y,
  );

  const startYTabelas = y + 10;
  const larguraColuna = (larguraUtil - 8) / 2;

  // Dados do imóvel — identificação/endereço à esquerda, áreas/cômodos à direita
  autoTable(doc, {
    startY: startYTabelas,
    margin: { left: margemX, right: margemX + larguraColuna + 8 },
    tableWidth: larguraColuna,
    theme: "plain",
    styles: { font: fonte, fontSize: 8, cellPadding: 1.4, textColor: CINZA_TEXTO },
    headStyles: headStylesSecao(fonte),
    head: [["Identificação", ""]],
    body: [
      ["Endereço", linha(imovel.endereco_completo)],
      [
        "Cidade / UF / CEP",
        linha([imovel.cidade, imovel.estado, imovel.cep].filter(Boolean).join(" · ")),
      ],
      ["Status", statusLabels[imovel.status]],
      ["Inscrição imobiliária", linha(imovel.inscricao_imobiliaria)],
      ["Matrícula", linha(imovel.numero_matricula)],
      ["Data de captação", imovel.data_captacao ? formatDate(imovel.data_captacao) : "—"],
      ["Captador", linha(captadorNome)],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
  });
  const finalYEsquerda = getFinalY(doc, startYTabelas);

  autoTable(doc, {
    startY: startYTabelas,
    margin: { left: margemX + larguraColuna + 8, right: margemX },
    tableWidth: larguraColuna,
    theme: "plain",
    styles: { font: fonte, fontSize: 8, cellPadding: 1.4, textColor: CINZA_TEXTO },
    headStyles: headStylesSecao(fonte),
    head: [["Áreas e cômodos", ""]],
    body: [
      ["Área interna", imovel.area_interna != null ? `${imovel.area_interna} m²` : "—"],
      ["Área externa", imovel.area_externa != null ? `${imovel.area_externa} m²` : "—"],
      ["Área do lote", imovel.area_lote != null ? `${imovel.area_lote} m²` : "—"],
      ["Quartos / Suítes", `${linha(imovel.quartos)} / ${linha(imovel.suites)}`],
      ["Banheiros", linha(imovel.banheiros)],
      ["Vagas", linha(imovel.vagas) + (imovel.tipo_vaga ? ` (${imovel.tipo_vaga})` : "")],
      ["Andar", linha(imovel.andar)],
      ["Piso / Fachada", `${linha(imovel.piso_acabamento)} / ${linha(imovel.fachada)}`],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
  });
  const finalYDireita = getFinalY(doc, startYTabelas);

  // Valores e encargos
  autoTable(doc, {
    startY: Math.max(finalYEsquerda, finalYDireita) + 8,
    margin: { left: margemX, right: margemX },
    theme: "plain",
    styles: { font: fonte, fontSize: 8, cellPadding: 1.4, textColor: CINZA_TEXTO },
    headStyles: headStylesSecao(fonte),
    head: [["Valores e encargos", ""]],
    body: [
      ...(imovel.finalidade !== "locacao"
        ? [["Valor de venda", formatCurrency(imovel.valor_venda)]]
        : []),
      ...(imovel.finalidade !== "venda"
        ? [["Valor de locação", formatCurrency(imovel.valor_locacao)]]
        : []),
      ["Condomínio", formatCurrency(imovel.valor_condominio)],
      [
        `IPTU mensal${imovel.repasse_iptu ? " (repassado)" : ""}`,
        formatCurrency(imovel.iptu_mensal),
      ],
      [
        `Taxa de lixo${imovel.parcela_taxa_lixo ? ` (${imovel.parcela_taxa_lixo})` : ""}`,
        formatCurrency(imovel.taxa_lixo),
      ],
      ["Outras taxas", formatCurrency(imovel.outras_taxas)],
      [
        "Comissão",
        imovel.comissao_percentual != null ? `${imovel.comissao_percentual}%` : "—",
      ],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  // Comodidades / instalações / lazer / diferenciais
  const listas: [string, string[]][] = [
    ["Comodidades internas", imovel.comodidades_internas],
    ["Instalações", imovel.instalacoes],
    ["Lazer", imovel.lazer],
    ["Diferenciais", imovel.diferenciais],
  ];
  const listasComConteudo = listas.filter(([, itens]) => itens.length > 0);
  if (listasComConteudo.length > 0) {
    autoTable(doc, {
      startY: getFinalY(doc, startYTabelas) + 8,
      margin: { left: margemX, right: margemX },
      theme: "plain",
      styles: { font: fonte, fontSize: 8, cellPadding: 1.4, textColor: CINZA_TEXTO },
      headStyles: headStylesSecao(fonte),
      head: [["Características", ""]],
      body: listasComConteudo.map(([label, itens]) => [label, itens.join(", ")]),
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    });
  }

  // Proprietário(s)
  autoTable(doc, {
    startY: getFinalY(doc, startYTabelas) + 8,
    margin: { left: margemX, right: margemX },
    theme: "striped",
    styles: { font: fonte, fontSize: 7.5, cellPadding: 2, textColor: CINZA_TEXTO },
    headStyles: headStylesSecao(fonte, 7.5),
    head: [["Proprietário", "CPF", "Contato", "Participação"]],
    body:
      proprietarios.length > 0
        ? proprietarios.map((v) => [
            v.proprietario.nome_completo + (v.principal ? " (principal)" : ""),
            linha(v.proprietario.cpf),
            linha(v.proprietario.whatsapp ?? v.proprietario.telefone),
            v.percentual_participacao != null ? `${v.percentual_participacao}%` : "—",
          ])
        : [["Nenhum proprietário vinculado", "—", "—", "—"]],
  });

  // Observações internas — checa se ainda cabe na página antes de escrever;
  // caso contrário, abre uma nova página.
  let yConteudo = getFinalY(doc, startYTabelas) + 10;
  if (imovel.observacoes) {
    if (yConteudo > alturaPagina - 55) {
      doc.addPage();
      yConteudo = 20;
    }
    doc.setFont(fonte, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...CINZA_TEXTO);
    doc.text("Observações", margemX, yConteudo);
    doc.setFont(fonte, "normal");
    doc.setFontSize(8);
    const linhas = doc.splitTextToSize(imovel.observacoes, larguraUtil);
    doc.text(linhas, margemX, yConteudo + 5);
    yConteudo = yConteudo + 5 + linhas.length * 3.9;
  }

  desenharTermoAutorizacao(doc, {
    fonte,
    margemX,
    larguraUtil,
    larguraPagina,
    alturaPagina,
    imovel,
    tipoNome,
    proprietarios,
    titulo: termoTitulo || TERMO_TITULO_PADRAO,
    corpoTemplate: termoCorpo || TERMO_CORPO_PADRAO,
  });

  // Rodapé de marca em todas as páginas
  const totalPaginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);
    const yRodape = alturaPagina - 10;
    if (marcaDataUrl) {
      doc.addImage(marcaDataUrl, "PNG", margemX, yRodape - 3, 4, 4);
    }
    doc.setFont(fonte, "bold");
    doc.setFontSize(7);
    doc.setTextColor(...CINZA_TEXTO);
    doc.text("ATMA CONSULTORIA IMOBILIÁRIA", margemX + (marcaDataUrl ? 6 : 0), yRodape);
    doc.setFont(fonte, "normal");
    doc.setTextColor(...CINZA_MUTED);
    doc.text(
      `${[imovel.cidade, imovel.estado].filter(Boolean).join(" - ")} · ${pagina}/${totalPaginas}`,
      margemX + larguraUtil,
      yRodape,
      { align: "right" },
    );
  }

  return doc;
}

/**
 * Termo de autorização e aceite para intermediação imobiliária, com os
 * dados já preenchidos a partir do imóvel e do proprietário principal —
 * campos sem fonte de dados no sistema (RG quando ausente, CRECI,
 * exclusividade) ficam em branco para preenchimento manual no papel.
 * Sempre começa numa página nova, sem linhas decorativas — só espaçamento.
 */
function desenharTermoAutorizacao(
  doc: jsPDF,
  {
    fonte,
    margemX,
    larguraUtil,
    larguraPagina,
    alturaPagina,
    imovel,
    tipoNome,
    proprietarios,
    titulo,
    corpoTemplate,
  }: {
    fonte: string;
    margemX: number;
    larguraUtil: number;
    larguraPagina: number;
    alturaPagina: number;
    imovel: Imovel;
    tipoNome: string;
    proprietarios: ProprietarioVinculo[];
    titulo: string;
    corpoTemplate: string;
  },
) {
  const principal = proprietarios.find((v) => v.principal) ?? proprietarios[0] ?? null;
  const RESERVA_RODAPE = 18;

  const descricaoImovel =
    imovel.descricao ||
    `${tipoNome} para ${finalidadeLabels[imovel.finalidade].toLowerCase()}${
      imovel.cidade ? ` em ${imovel.cidade}` : ""
    }`;
  const variaveis: Record<string, string> = {
    proprietario_nome: principal?.proprietario.nome_completo ?? "",
    proprietario_cpf: principal?.proprietario.cpf ?? "",
    proprietario_rg: principal?.proprietario.doc_identidade_numero ?? "",
    proprietario_endereco: principal?.proprietario.endereco_completo ?? "",
    imovel_endereco: imovel.endereco_completo ?? "",
    imovel_matricula: imovel.numero_matricula ?? "",
    imovel_descricao: descricaoImovel,
    corretor_nome: "Atma Consultoria Imobiliária",
    comissao_percentual:
      imovel.comissao_percentual != null ? String(imovel.comissao_percentual) : "______",
    local: "Ribeirão Preto",
    hoje: new Date().toLocaleDateString("pt-BR"),
  };

  doc.addPage();
  let ty = 22;

  function quebraSeNecessario(alturaNecessaria: number) {
    if (ty + alturaNecessaria > alturaPagina - RESERVA_RODAPE) {
      doc.addPage();
      ty = 22;
    }
  }

  function campo(label: string, valor: string | null | undefined) {
    doc.setFont(fonte, "bold");
    doc.setFontSize(8);
    const prefixo = `${label}: `;
    const larguraPrefixo = doc.getTextWidth(prefixo);
    doc.setFont(fonte, "normal");
    const texto = valor && valor.trim() !== "" ? valor : "_".repeat(48);
    const linhas = doc.splitTextToSize(texto, larguraUtil - larguraPrefixo);
    quebraSeNecessario(linhas.length * 4.2 + 1.5);
    doc.setFont(fonte, "bold");
    doc.text(prefixo, margemX, ty);
    doc.setFont(fonte, "normal");
    doc.text(linhas, margemX + larguraPrefixo, ty);
    ty += linhas.length * 4.2 + 1.5;
  }

  function tituloBloco(texto: string) {
    quebraSeNecessario(10);
    ty += 3;
    doc.setFont(fonte, "bold");
    doc.setFontSize(9);
    doc.setTextColor(...CINZA_TEXTO);
    doc.text(texto, margemX, ty);
    ty += 6;
    doc.setTextColor(...CINZA_TEXTO);
  }

  /**
   * Parágrafo do corpo configurável do termo. Se a primeira linha for do
   * tipo "N. TÍTULO" (uma cláusula numerada), ela sai em negrito e as
   * linhas seguintes em texto normal — cada linha da fonte é respeitada
   * como está (permite tanto um parágrafo corrido, que quebra sozinho pela
   * largura da página, quanto uma lista curta como os checkboxes de
   * exclusividade, sem forçar tudo numa única linha).
   */
  function paragrafo(texto: string) {
    const linhasFonte = texto.split("\n").filter((l) => l.trim() !== "");
    if (linhasFonte.length === 0) return;
    const ehClausula = /^\d+\.\s/.test(linhasFonte[0]);

    const preparadas = linhasFonte.map((linhaOriginal, index) => {
      const bold = ehClausula && index === 0;
      doc.setFont(fonte, bold ? "bold" : "normal");
      doc.setFontSize(bold ? 8.5 : 8);
      return { linhas: doc.splitTextToSize(linhaOriginal, larguraUtil), bold };
    });

    const alturaTotal =
      preparadas.reduce((acc, p) => acc + p.linhas.length * (p.bold ? 4.6 : 4), 0) + 5;
    quebraSeNecessario(alturaTotal);

    preparadas.forEach((p) => {
      doc.setFont(fonte, p.bold ? "bold" : "normal");
      doc.setFontSize(p.bold ? 8.5 : 8);
      doc.setTextColor(...CINZA_TEXTO);
      doc.text(p.linhas, margemX, ty);
      ty += p.linhas.length * (p.bold ? 4.6 : 4);
    });
    ty += 5;
  }

  // Título
  doc.setFont(fonte, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...CINZA_TEXTO);
  const tituloLinhas = doc.splitTextToSize(titulo, larguraUtil - 10);
  doc.text(tituloLinhas, larguraPagina / 2, ty, { align: "center" });
  ty += tituloLinhas.length * 5 + 6;

  tituloBloco("Proprietário(a)");
  campo("Nome", principal?.proprietario.nome_completo);
  campo("CPF/CNPJ", principal?.proprietario.cpf);
  campo("RG", principal?.proprietario.doc_identidade_numero);
  campo("Endereço", principal?.proprietario.endereco_completo);

  tituloBloco("Imóvel");
  campo("Endereço", imovel.endereco_completo);
  campo("Matrícula", imovel.numero_matricula);
  campo("Descrição", descricaoImovel);

  tituloBloco("Corretor/Imobiliária");
  campo("Nome/Razão Social", "Atma Consultoria Imobiliária");
  campo("CRECI/CNPJ", null);

  ty += 4;

  const corpoFinal = substituirVariaveis(corpoTemplate, variaveis);
  corpoFinal
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach(paragrafo);

  ty += 4;
  quebraSeNecessario(10);
  doc.setFont(fonte, "bold");
  doc.setFontSize(8);
  const prefixoData = "Local e Data: ";
  const larguraPrefixoData = doc.getTextWidth(prefixoData);
  doc.text(prefixoData, margemX, ty);
  doc.setFont(fonte, "normal");
  doc.text(
    `${variaveis.local}, ${variaveis.hoje}`,
    margemX + larguraPrefixoData,
    ty,
  );
  ty += 16;

  quebraSeNecessario(20);
  doc.setDrawColor(...CINZA_LINHA);
  doc.line(margemX, ty, margemX + 75, ty);
  doc.line(margemX + 95, ty, margemX + 95 + 75, ty);
  doc.setFont(fonte, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...CINZA_MUTED);
  doc.text("Assinatura do(a) Proprietário(a)", margemX, ty + 5);
  doc.text("Assinatura do Corretor/Imobiliária", margemX + 95, ty + 5);
}
