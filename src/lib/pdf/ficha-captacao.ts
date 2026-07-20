/**
 * Texto do Termo de Autorização e Aceite, configurável na tela Admin
 * (`fichas_captacao_configuracoes`) e usado por `montarBlocosDaFicha`
 * (`src/components/imoveis/ficha/ficha-blocos.tsx`) para montar o bloco do
 * termo na Ficha de Captação. A geração do PDF em si (html2canvas, não
 * mais jsPDF/autoTable) vive em `src/components/imoveis/ficha/`.
 */

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
export function substituirVariaveis(template: string, variaveis: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, chave: string) => variaveis[chave] ?? match);
}
