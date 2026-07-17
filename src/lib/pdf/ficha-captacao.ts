import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { finalidadeLabels, statusLabels } from "@/lib/imoveis/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Imovel, Proprietario } from "@/lib/supabase/types";

const AZUL_ATMA: [number, number, number] = [0, 94, 184];
const CINZA_TEXTO: [number, number, number] = [34, 34, 34];
const CINZA_LINHA: [number, number, number] = [216, 218, 219];

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

/**
 * Monta a Ficha de Captação em PDF: cabeçalho + tabelas (jspdf-autotable) com
 * os dados do imóvel, valores/encargos e proprietário(s) vinculado(s).
 * Roda inteiramente no navegador.
 */
export function gerarFichaCaptacaoPdf({
  imovel,
  tipoNome,
  captadorNome,
  proprietarios,
}: {
  imovel: Imovel;
  tipoNome: string;
  captadorNome: string | null;
  proprietarios: ProprietarioVinculo[];
}): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margemX = 15;
  const larguraUtil = doc.internal.pageSize.getWidth() - margemX * 2;
  const alturaPagina = doc.internal.pageSize.getHeight();

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...AZUL_ATMA);
  doc.text("ATMA CONSULTORIA IMOBILIÁRIA", margemX, 18);

  doc.setFontSize(18);
  doc.setTextColor(...CINZA_TEXTO);
  doc.text("Ficha de Captação", margemX, 27);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 128, 130);
  doc.text(
    `Gerada em ${new Date().toLocaleDateString("pt-BR")} · ${tipoNome} · ${
      finalidadeLabels[imovel.finalidade]
    }`,
    margemX,
    33,
  );

  doc.setDrawColor(...CINZA_LINHA);
  doc.line(margemX, 37, margemX + larguraUtil, 37);

  // Dados do imóvel
  autoTable(doc, {
    startY: 43,
    margin: { left: margemX, right: margemX },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.6, textColor: CINZA_TEXTO },
    headStyles: {
      fillColor: AZUL_ATMA,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    head: [["Dados do imóvel", ""]],
    body: [
      ["Endereço", linha(imovel.endereco_completo)],
      [
        "Cidade / UF / CEP",
        linha([imovel.cidade, imovel.estado, imovel.cep].filter(Boolean).join(" · ")),
      ],
      ["Status", statusLabels[imovel.status]],
      ["Área interna", imovel.area_interna != null ? `${imovel.area_interna} m²` : "—"],
      ["Área externa", imovel.area_externa != null ? `${imovel.area_externa} m²` : "—"],
      ["Área do lote", imovel.area_lote != null ? `${imovel.area_lote} m²` : "—"],
      ["Quartos / Suítes", `${linha(imovel.quartos)} / ${linha(imovel.suites)}`],
      ["Banheiros", linha(imovel.banheiros)],
      ["Vagas", linha(imovel.vagas) + (imovel.tipo_vaga ? ` (${imovel.tipo_vaga})` : "")],
      ["Andar", linha(imovel.andar)],
      ["Piso / Fachada", `${linha(imovel.piso_acabamento)} / ${linha(imovel.fachada)}`],
      ["Inscrição imobiliária", linha(imovel.inscricao_imobiliaria)],
      ["Matrícula", linha(imovel.numero_matricula)],
      ["Data de captação", imovel.data_captacao ? formatDate(imovel.data_captacao) : "—"],
      ["Captador", linha(captadorNome)],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  // Valores e encargos
  autoTable(doc, {
    startY: getFinalY(doc, 43) + 8,
    margin: { left: margemX, right: margemX },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.6, textColor: CINZA_TEXTO },
    headStyles: {
      fillColor: AZUL_ATMA,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
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
      startY: getFinalY(doc, 43) + 8,
      margin: { left: margemX, right: margemX },
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.6, textColor: CINZA_TEXTO },
      headStyles: {
        fillColor: AZUL_ATMA,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      head: [["Características", ""]],
      body: listasComConteudo.map(([label, itens]) => [label, itens.join(", ")]),
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    });
  }

  // Proprietário(s)
  autoTable(doc, {
    startY: getFinalY(doc, 43) + 8,
    margin: { left: margemX, right: margemX },
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: CINZA_TEXTO },
    headStyles: { fillColor: AZUL_ATMA, textColor: 255, fontStyle: "bold" },
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

  // Observações internas — a orientação paisagem reduz a altura útil da
  // página (210mm vs. 297mm no retrato), então checamos se ainda cabe antes
  // de escrever; caso contrário, abre uma nova página.
  let y = getFinalY(doc, 43) + 10;
  if (imovel.observacoes) {
    if (y > alturaPagina - 55) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...CINZA_TEXTO);
    doc.text("Observações", margemX, y);
    doc.setFont("helvetica", "normal");
    const linhas = doc.splitTextToSize(imovel.observacoes, larguraUtil);
    doc.text(linhas, margemX, y + 5);
    y = y + 5 + linhas.length * 4.2;
  }

  // Assinaturas — TODO(assinatura-digital): quando a assinatura digital for
  // implementada (canvas simples via react-signature-canvas, ou integração
  // com Autentique/Clicksign), estas linhas em branco dão lugar à imagem da
  // assinatura capturada e aos campos assinatura_url/assinado_em/
  // provedor_assinatura/hash_documento de imoveis_fichas_captacao.
  if (y > alturaPagina - 40) {
    doc.addPage();
    y = alturaPagina - 30;
  }
  const yAssinatura = Math.max(y + 15, alturaPagina - 30);
  doc.setDrawColor(...CINZA_LINHA);
  doc.line(margemX, yAssinatura, margemX + 75, yAssinatura);
  doc.line(margemX + 95, yAssinatura, margemX + 95 + 75, yAssinatura);
  doc.setFontSize(8);
  doc.setTextColor(120, 128, 130);
  doc.text("Assinatura do proprietário", margemX, yAssinatura + 5);
  doc.text("Assinatura do corretor", margemX + 95, yAssinatura + 5);

  return doc;
}
