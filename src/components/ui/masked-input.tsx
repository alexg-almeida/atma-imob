"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

type MaskedInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  mask: (raw: string) => string;
};

/** Input de texto com máscara de preenchimento (telefone, CEP, CPF etc.). */
export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  function MaskedInput({ value, onChange, mask, ...props }, ref) {
    return (
      <Input
        {...props}
        ref={ref}
        value={mask(value)}
        onChange={(e) => onChange(mask(e.target.value))}
      />
    );
  },
);
