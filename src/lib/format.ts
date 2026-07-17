export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(isoDate: string) {
  return dateFormat.format(new Date(`${isoDate.slice(0, 10)}T12:00:00`));
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return currency.format(value);
}
