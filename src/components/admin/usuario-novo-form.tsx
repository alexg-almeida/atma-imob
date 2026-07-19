"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowsClockwise, Copy } from "@phosphor-icons/react";
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
import {
  PermissoesMatrix,
  permissoesIniciais,
  type PermissaoModuloEstado,
} from "@/components/admin/permissoes-matrix";
import { criarUsuario } from "@/app/(app)/admin/usuarios/actions";
import type { CoreModulo } from "@/lib/supabase/types";

const underline =
  "rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary aria-invalid:border-alert";

const labelStyle =
  "text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

const usuarioSchema = z.object({
  nome_completo: z.string().trim().min(3, "Informe o nome completo."),
  email: z.email("E-mail inválido."),
  senha: z.string().min(8, "Mínimo de 8 caracteres."),
  telefone: z.string(),
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

function gerarSenha(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const valores = new Uint32Array(14);
  crypto.getRandomValues(valores);
  return Array.from(valores, (v) => alfabeto[v % alfabeto.length]).join("");
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

export function UsuarioNovoForm({ modulos }: { modulos: CoreModulo[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [permissoes, setPermissoes] = useState<Record<string, PermissaoModuloEstado>>(() =>
    permissoesIniciais(modulos),
  );

  function handlePermissaoChange(moduloId: string, patch: Partial<PermissaoModuloEstado>) {
    setPermissoes((atual) => ({
      ...atual,
      [moduloId]: { ...atual[moduloId], ...patch },
    }));
  }

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      senha: "",
      telefone: "",
    },
  });

  async function copiarSenha() {
    const senha = form.getValues("senha");
    if (!senha) return;
    await navigator.clipboard.writeText(senha);
    toast.success("Senha copiada.");
  }

  async function onSubmit(data: UsuarioFormValues) {
    setSaving(true);
    const resultado = await criarUsuario({
      nome_completo: data.nome_completo.trim(),
      email: data.email.trim(),
      senha: data.senha,
      telefone: data.telefone.trim() || null,
      permissoes: Object.values(permissoes),
    });

    if (!resultado.ok) {
      toast.error(resultado.error);
      setSaving(false);
      return;
    }

    toast.success("Usuário criado. Compartilhe a senha com ele por fora do sistema.");
    router.push(`/admin/usuarios/${resultado.id}`);
    router.refresh();
    setSaving(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-12">
        <Secao titulo="Perfil">
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
            <TextField control={form.control} name="nome_completo" label="Nome completo" />
            <TextField control={form.control} name="email" label="E-mail" placeholder="nome@atmaimob.com.br" />
            <TextField
              control={form.control}
              name="telefone"
              label="Telefone (opcional)"
              mask="phone"
              placeholder="(16) 99999-0000"
            />
          </div>

          <FormField
            control={form.control}
            name="senha"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyle}>Senha inicial</FormLabel>
                <div className="flex items-center gap-3">
                  <FormControl>
                    <Input {...field} className={`${underline} font-mono`} placeholder="Gere ou digite uma senha" />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => form.setValue("senha", gerarSenha(), { shouldValidate: true })}
                  >
                    <ArrowsClockwise size={14} aria-hidden /> Gerar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={copiarSenha}>
                    <Copy size={14} aria-hidden /> Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O sistema ainda não envia e-mail de convite — compartilhe essa senha com
                  o usuário por WhatsApp ou outro canal fora do CRM.
                </p>
                <FormMessage className="text-xs text-alert" />
              </FormItem>
            )}
          />
        </Secao>

        <Secao
          titulo="Permissões por módulo"
          descricao="O que este usuário vai poder ver, criar, editar e excluir em cada área do sistema."
        >
          <PermissoesMatrix
            modulos={modulos}
            value={permissoes}
            onChange={handlePermissaoChange}
          />
        </Secao>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Criando…" : "Criar usuário"}
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href="/admin/usuarios">Cancelar</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
