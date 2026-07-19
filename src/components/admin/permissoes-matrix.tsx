"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { EXTRAS_POR_MODULO } from "@/lib/admin/permissoes-extras";
import type { CoreModulo } from "@/lib/supabase/types";

export type PermissaoModuloEstado = {
  modulo_id: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  permissoes_extras: string[];
};

export function permissoesIniciais(modulos: CoreModulo[]): Record<string, PermissaoModuloEstado> {
  return Object.fromEntries(
    modulos.map((m) => [
      m.id,
      {
        modulo_id: m.id,
        pode_visualizar: false,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false,
        permissoes_extras: [] as string[],
      },
    ]),
  );
}

function AcaoCheckbox({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} />
      {label}
    </label>
  );
}

export function PermissoesMatrix({
  modulos,
  value,
  onChange,
}: {
  modulos: CoreModulo[];
  value: Record<string, PermissaoModuloEstado>;
  onChange: (moduloId: string, patch: Partial<PermissaoModuloEstado>) => void;
}) {
  return (
    <div className="divide-y divide-line">
      {modulos.map((modulo) => {
        const estado = value[modulo.id];
        if (!estado) return null;
        const extras = EXTRAS_POR_MODULO[modulo.slug] ?? [];

        return (
          <div key={modulo.id} className="py-5">
            <p className="font-medium text-ink">{modulo.nome}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              <AcaoCheckbox
                label="Visualizar"
                checked={estado.pode_visualizar}
                onCheckedChange={(v) => onChange(modulo.id, { pode_visualizar: v })}
              />
              <AcaoCheckbox
                label="Criar"
                checked={estado.pode_criar}
                onCheckedChange={(v) => onChange(modulo.id, { pode_criar: v })}
              />
              <AcaoCheckbox
                label="Editar"
                checked={estado.pode_editar}
                onCheckedChange={(v) => onChange(modulo.id, { pode_editar: v })}
              />
              <AcaoCheckbox
                label="Excluir"
                checked={estado.pode_excluir}
                onCheckedChange={(v) => onChange(modulo.id, { pode_excluir: v })}
              />
              {extras.map((extra) => (
                <AcaoCheckbox
                  key={extra.chave}
                  label={extra.label}
                  checked={estado.permissoes_extras.includes(extra.chave)}
                  onCheckedChange={(v) =>
                    onChange(modulo.id, {
                      permissoes_extras: v
                        ? [...estado.permissoes_extras, extra.chave]
                        : estado.permissoes_extras.filter((c) => c !== extra.chave),
                    })
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
