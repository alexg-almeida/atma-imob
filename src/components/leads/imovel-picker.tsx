"use client";

import { useMemo, useState } from "react";
import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ImovelOption = { id: string; label: string; sublabel: string };

export function ImovelPicker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (id: string) => void;
  options: ImovelOption[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options.slice(0, 30);
    return options
      .filter((o) => `${o.label} ${o.sublabel}`.toLowerCase().includes(term))
      .slice(0, 30);
  }, [options, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 border-0 border-b border-line bg-transparent pb-2 text-left text-sm text-ink outline-none transition-colors duration-150 focus:border-primary"
        >
          {selected ? (
            <span className="truncate">{selected.label}</span>
          ) : (
            <span className="text-muted-foreground">
              Buscar imóvel de interesse…
            </span>
          )}
          <span className="flex shrink-0 items-center gap-2">
            {selected ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                aria-label="Remover imóvel de interesse"
                className="text-muted-foreground transition-colors hover:text-alert"
              >
                <X size={13} aria-hidden />
              </span>
            ) : null}
            <CaretDown size={12} className="text-muted-foreground" aria-hidden />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <MagnifyingGlass size={14} className="text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tipo, bairro, cidade…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              Nenhum imóvel encontrado.
            </li>
          ) : (
            filtered.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface"
                >
                  <p className="truncate font-medium">{option.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {option.sublabel}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
