"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCircleCheck } from "@phosphor-icons/react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { parceiroTipoLabels, parceiroTipos } from "@/lib/supabase/types";
import type { CorePerfil, Parceiro } from "@/lib/supabase/types";

const underline =
  "rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary aria-invalid:border-alert";

const selectUnderline =
  "w-full rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus:border-primary";

const labelStyle =
  "text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

const parceiroSchema = z.object({
  tipo: z.enum(["corretor", "captador", "ambos"]),
  nome_completo: z.string().trim().min(3, "Informe o nome completo."),
  creci: z.string(),
  comissao_padrao_percentual: z
    .string()
    .refine((v) => !v.trim() || Number.isFinite(Number(v.replace(",", "."))), {
      message: "Número inválido.",
    }),
  email: z
    .string()
    .trim()
    .refine((v) => !v || z.email().safeParse(v).success, {
      message: "E-mail inválido.",
    }),
  whatsapp: z.string(),
  telefone: z.string(),
  banco: z.string(),
  agencia: z.string(),
  conta: z.string(),
  tipo_conta: z.string(),
  pix: z.string(),
  perfil_id: z.string(),
});

type ParceiroFormValues = z.infer<typeof parceiroSchema>;

function toText(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

function TextField({
  control,
  name,
  label,
  placeholder,
  mono,
  mask,
}: {
  control: Control<ParceiroFormValues>;
  name: keyof ParceiroFormValues & string;
  label: string;
  placeholder?: string;
  mono?: boolean;
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
              <Input
                {...field}
                placeholder={placeholder}
                className={`${underline} ${mono ? "font-mono" : ""}`}
              />
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
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          {titulo}
        </h2>
        {descricao ? (
          <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
        ) : null}
      </div>
      <div className="space-y-7 pt-6">{children}</div>
    </section>
  );
}

export function ParceiroForm({
  parceiro,
  perfis,
}: {
  parceiro?: Parceiro;
  perfis: Pick<CorePerfil, "id" | "nome_completo">[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(parceiro);

  const form = useForm<ParceiroFormValues>({
    resolver: zodResolver(parceiroSchema),
    defaultValues: {
      tipo: parceiro?.tipo ?? "corretor",
      nome_completo: parceiro?.nome_completo ?? "",
      creci: parceiro?.creci ?? "",
      comissao_padrao_percentual:
        parceiro?.comissao_padrao_percentual != null
          ? String(parceiro.comissao_padrao_percentual).replace(".", ",")
          : "",
      email: parceiro?.email ?? "",
      whatsapp: parceiro?.whatsapp ?? "",
      telefone: parceiro?.telefone ?? "",
      banco: parceiro?.banco ?? "",
      agencia: parceiro?.agencia ?? "",
      conta: parceiro?.conta ?? "",
      tipo_conta: parceiro?.tipo_conta ?? "",
      pix: parceiro?.pix ?? "",
      perfil_id: parceiro?.perfil_id ?? "",
    },
  });

  const perfilId = useWatch({ control: form.control, name: "perfil_id" });
  const perfilVinculado = perfis.find((p) => p.id === perfilId);

  async function onSubmit(data: ParceiroFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      tipo: data.tipo,
      nome_completo: data.nome_completo.trim(),
      creci: toText(data.creci),
      comissao_padrao_percentual: data.comissao_padrao_percentual.trim()
        ? Number(data.comissao_padrao_percentual.replace(",", "."))
        : null,
      email: toText(data.email),
      whatsapp: toText(data.whatsapp),
      telefone: toText(data.telefone),
      banco: toText(data.banco),
      agencia: toText(data.agencia),
      conta: toText(data.conta),
      tipo_conta: toText(data.tipo_conta),
      pix: toText(data.pix),
      perfil_id: data.perfil_id || null,
    };

    if (isEdit && parceiro) {
      const { error } = await supabase
        .from("parceiros")
        .update(payload)
        .eq("id", parceiro.id);
      if (error) {
        toast.error(`Erro ao salvar: ${error.message}`);
        setSaving(false);
        return;
      }
      toast.success("Parceiro atualizado.");
      router.push(`/parceiros/${parceiro.id}`);
    } else {
      const { data: created, error } = await supabase
        .from("parceiros")
        .insert(payload)
        .select("id")
        .single();
      if (error || !created) {
        toast.error(`Erro ao cadastrar: ${error?.message}`);
        setSaving(false);
        return;
      }
      toast.success("Parceiro cadastrado.");
      router.push(`/parceiros/${created.id}`);
    }
    router.refresh();
    setSaving(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-12"
      >
        <Secao titulo="Identificação">
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={selectUnderline}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parceiroTipos.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {parceiroTipoLabels[tipo]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-alert" />
                </FormItem>
              )}
            />
            <TextField control={form.control} name="creci" label="CRECI" mono />
            <TextField
              control={form.control}
              name="comissao_padrao_percentual"
              label="Comissão padrão (%)"
              mono
              placeholder="6"
            />
          </div>

          <TextField
            control={form.control}
            name="nome_completo"
            label="Nome completo"
            placeholder="Nome do parceiro"
          />
        </Secao>

        <Secao titulo="Contato">
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-3">
            <TextField control={form.control} name="email" label="E-mail" />
            <TextField
              control={form.control}
              name="whatsapp"
              label="WhatsApp"
              mask="phone"
              placeholder="(16) 99999-0000"
            />
            <TextField control={form.control} name="telefone" label="Telefone" mask="phone" />
          </div>
        </Secao>

        <Secao titulo="Dados bancários">
          <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-3">
            <TextField control={form.control} name="banco" label="Banco" />
            <TextField control={form.control} name="agencia" label="Agência" mono />
            <TextField control={form.control} name="conta" label="Conta" mono />
            <TextField control={form.control} name="tipo_conta" label="Tipo de conta" />
            <TextField control={form.control} name="pix" label="Chave PIX" mono />
          </div>
        </Secao>

        <Secao
          titulo="Acesso ao sistema"
          descricao="Vincule este parceiro a um usuário já cadastrado se ele também precisar logar no CRM."
        >
          <FormField
            control={form.control}
            name="perfil_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyle}>Usuário do sistema</FormLabel>
                <Select
                  value={field.value || "nenhum"}
                  onValueChange={(v) => field.onChange(v === "nenhum" ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger className={selectUnderline}>
                      <SelectValue placeholder="— Não vinculado —" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="nenhum">— Não vinculado —</SelectItem>
                    {perfis.map((perfil) => (
                      <SelectItem key={perfil.id} value={perfil.id}>
                        {perfil.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs text-alert" />
              </FormItem>
            )}
          />

          {perfilVinculado ? (
            <p className="flex items-center gap-2 rounded-sm bg-primary-soft px-4 py-3 text-sm text-ink">
              <UserCircleCheck size={18} className="shrink-0 text-primary" aria-hidden />
              Este parceiro pode fazer login no sistema como{" "}
              <strong className="font-semibold">{perfilVinculado.nome_completo}</strong>.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem vínculo, este parceiro existe apenas como registro na carteira —
              não acessa o CRM.
            </p>
          )}
        </Secao>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={saving}>
            {saving
              ? "Salvando…"
              : isEdit
                ? "Salvar alterações"
                : "Cadastrar parceiro"}
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href={isEdit && parceiro ? `/parceiros/${parceiro.id}` : "/parceiros"}>
              Cancelar
            </Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
