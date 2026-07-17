"use client";

import { useState } from "react";
import Image from "next/image";
import { Buildings } from "@phosphor-icons/react";
import type { ImovelFoto } from "@/lib/supabase/types";

export function GaleriaImovel({
  fotos,
  titulo,
}: {
  fotos: ImovelFoto[];
  titulo: string;
}) {
  const capaInicial = fotos.find((f) => f.capa) ?? fotos[0];
  const [selecionadaId, setSelecionadaId] = useState(capaInicial?.id);
  const selecionada = fotos.find((f) => f.id === selecionadaId) ?? capaInicial;

  if (!selecionada) {
    return (
      <div className="flex aspect-[16/6] items-center justify-center rounded-md bg-surface">
        <Buildings size={48} className="text-strong-line" aria-hidden />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-surface">
        <Image
          key={selecionada.id}
          src={selecionada.url}
          alt={selecionada.destaque ?? titulo}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 75vw"
          className="object-cover"
        />
      </div>

      {fotos.length > 1 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {fotos.map((foto) => {
            const ativa = foto.id === selecionada.id;
            return (
              <button
                key={foto.id}
                type="button"
                onClick={() => setSelecionadaId(foto.id)}
                aria-label={foto.destaque ?? "Ver esta foto"}
                aria-current={ativa}
                className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md bg-surface transition-opacity duration-150 ${
                  ativa
                    ? "ring-2 ring-inset ring-primary"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={foto.url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
