"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  moneyDigitsToDisplay,
  moneyDisplayToPlain,
  moneyValueToDigits,
} from "@/lib/masks";

type CurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  /** Valor pt-BR sem milhar (ex.: "1234,56"), mesmo formato usado por parseNum/numToForm. */
  value: string;
  onChange: (value: string) => void;
};

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(function CurrencyInput({ value, onChange, ...props }, ref) {
  return (
    <Input
      {...props}
      ref={ref}
      inputMode="decimal"
      value={moneyDigitsToDisplay(moneyValueToDigits(value))}
      onChange={(e) => onChange(moneyDisplayToPlain(e.target.value))}
    />
  );
});
