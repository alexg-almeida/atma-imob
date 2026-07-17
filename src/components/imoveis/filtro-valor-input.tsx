"use client";

import { useState } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";

/**
 * Input de valor (R$) para o filtro de imóveis: formulário GET nativo (sem
 * react-hook-form), então mantém o próprio estado só para exibir a máscara —
 * o `name` continua submetendo o valor formatado em pt-BR, que a página já
 * sabe interpretar (`parseValor` em imoveis/page.tsx).
 */
export function FiltroValorInput({
  name,
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <CurrencyInput
      name={name}
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      className={className}
    />
  );
}
