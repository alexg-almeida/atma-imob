/** Máscaras de preenchimento (pt-BR) para campos de formulário. */

export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (digits.length < 3) return `(${ddd}`;
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const isCelular = rest.length > 8;
  const splitAt = isCelular ? 5 : 4;
  const primeiraParte = rest.slice(0, splitAt);
  const segundaParte = rest.slice(splitAt);
  return segundaParte ? `(${ddd}) ${primeiraParte}-${segundaParte}` : `(${ddd}) ${primeiraParte}`;
}

export function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function maskCpf(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Máscara de valor monetário no estilo "preenche pela direita" (como em
 * apps bancários): os dígitos digitados sempre representam os centavos mais
 * recentes. Trabalha em dois formatos:
 * - `digitsToDisplay`: dígitos brutos → "1.234,56" (para exibir no input)
 * - `displayToPlain`: "1.234,56" digitado → "1234,56" (formato pt-BR sem
 *   milhar, compatível com o `parseNum`/`numToForm` já usados nos formulários)
 */
export function moneyDigitsToDisplay(rawDigits: string): string {
  const digits = rawDigits.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  const cents = digits.padStart(3, "0");
  const intPart = cents.slice(0, -2).replace(/^0+(?=\d)/, "") || "0";
  const decPart = cents.slice(-2);
  const comMilhar = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${comMilhar},${decPart}`;
}

/** Converte um valor pt-BR já existente (ex.: "850000" ou "850000,5") em dígitos de centavos. */
export function moneyValueToDigits(value: string): string {
  if (!value) return "";
  const [intPart, decPart = ""] = value.split(",");
  const cleanInt = intPart.replace(/\D/g, "");
  const cents = (decPart + "00").slice(0, 2);
  return `${cleanInt}${cents}`.replace(/^0+(?=\d)/, "");
}

export function moneyDisplayToPlain(display: string): string {
  const digits = display.replace(/\D/g, "");
  return moneyDigitsToDisplay(digits).replace(/\./g, "");
}
