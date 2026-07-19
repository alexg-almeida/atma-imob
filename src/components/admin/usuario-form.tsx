"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { maskPhone } from "@/lib/masks";
import { createClient } from "@/lib/supabase/client";
import {
  PermissoesMatrix,
  permissoesIniciais,
  type PermissaoModuloEstado,
} from "@/components/admin/permissoes-matrix";
import type { CoreModulo, CorePerfil, CorePermissao } from "@/lib/supabase/types";

const underline =
  "rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary aria-invalid:border-alert";

const labelStyle =
  "text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

const usuarioSchema = z.object({
  nome_completo: z.string().trim().min(3, "Informe o nome completo."),
  telefone: z.string(),
  avatar_url: z.string(),
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

function toText(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

function TextField({
  control,
  name,
  label,
  placeholder,
  mask,
}: {
  control: Control<UsuarioFormValues>;
  name: keyof UsuarioFormValues & string;
  label: string;
  placeholder?: string;
  mask?: "phone";
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={labelStyle}>{label}</FormLabel>
          <FormControl>
            {mask === "phone" ? (
              <MaskedInput
                {...field}
                mask={maskPhone}
                placeholder={placeholder}
                className={`${underline} font-mono`}
              />
            ) : (
              <Input {...field} placeholder={placeholder} className={underline} />
            )}
          </FormControl>
          <FormMessage className="text-xs text-alert" />
        </FormItem>
      )}
    />
  );
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="border-b-2 border-ink pb-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{titulo}</h2>
        {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      <div className="space-y-7 pt-6">{children}</div>
    </section>
  );
}

export function UsuarioForm({
  perfil,
  modulos,
  permissoesAtuais,
}: {
  perfil: CorePerfil;
  modulos: CoreModulo[];
  permissoesAtuais: CorePermissao[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [permissoes, setPermissoes] = useState<Record<string, PermissaoModuloEstado>>(() => {
    const base = permissoesIniciais(modulos);
    for (const p of permissoesAtuais) {
      if (base[p.modulo_id]) {
        base[p.modulo_id] = {
          modulo_id: p.modulo_id,
          pode_visualizar: p.pode_visualizar,
          pode_criar: p.pode_criar,
          pode_editar: p.pode_editar,
          pode_excluir: p.pode_excluir,
          permissoes_extras: p.permissoes_extras,
        };
      }
    }
    return base;
  });

  function handlePermissaoChange(moduloId: string, patch: Partial<PermissaoModuloEstado>) {
    setPermissoes((atual) => ({
      ...atual,
      [moduloId]: { ...atual[moduloId], ...patch },
    }));
  }

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome_completo: perfil.nome_completo,
      telefone: perfil.telefone ?? "",
      avatar_url: perfil.avatar_url ?? "",
    },
  });

  async function onSubmit(data: UsuarioFormValues) {
    setSaving(true);
    const supabase = createClient();

    const { error: erroPerfil } = await supabase
      .from("core_perfis")
      .update({
        nome_completo: data.nome_completo.trim(),
        telefone: toText(data.telefone),
        avatar_url: toText(data.avatar_url),
      })
      .eq("id", perfil.id);

    if (erroPerfil) {
      toast.error(`Erro ao salvar: ${erroPerfil.message}`);
      setSaving(false);
      return;
    }

    const { error: erroPermissoes } = await supabase.from("core_permissoes").upsert(
      Object.values(permissoes).map((p) => ({
        perfil_id: perfil.id,
        modulo_id: p.modulo_id,
        pode_visualizar: p.pode_visualizar,
        pode_criar: p.pode_criar,
        pode_editar: p.pode_editar,
        pode_excluir: p.pode_excluir,
        permissoes_extras: p.permissoes_extras,
      })),
      { onConflict: "perfil_id,modulo_id" },
    );

    if (erroPermissoes) {
      toast.error(`Perfil salvo, mas falhou ao salvar permissões: ${erroPermissoes.message}`);
      setSaving(false);
      return;
    }

    toast.success("Usuário atualizado.");
    router.push(`/admin/usuarios/${perfil.id}`);
    router.refresh();
    setSaving(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-12">
        <Secao titulo="Perfil">
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
            <TextField control={form.control} name="nome_completo" label="Nome completo" />
            <TextField
              control={form.control}
              name="telefone"
              label="Telefone"
              mask="phone"
              placeholder="(16) 99999-0000"
            />
          </div>
          <TextField
            control={form.control}
            name="avatar_url"
            label="URL da foto (opcional)"
            placeholder="https://…"
          />
        </Secao>

        <Secao
          titulo="Permissões por módulo"
          descricao="O que este usuário pode ver, criar, editar e excluir em cada área do sistema."
        >
          <PermissoesMatrix
            modulos={modulos}
            value={permissoes}
            onChange={handlePermissaoChange}
          />
        </Secao>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href={`/admin/usuarios/${perfil.id}`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
