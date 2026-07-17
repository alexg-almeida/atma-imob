"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LockSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { maskCpf, maskPhone } from "@/lib/masks";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type {
  Proprietario,
  ProprietarioDadosBancarios,
} from "@/lib/supabase/types";

const underline =
  "rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary aria-invalid:border-alert";

const selectUnderline =
  "w-full rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus:border-primary";

const labelStyle =
  "text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

const estadosCivis = [
  "Solteiro(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viúvo(a)",
  "União estável",
];

const proprietarioSchema = z.object({
  nome_completo: z.string().trim().min(3, "Informe o nome completo."),
  cpf: z
    .string()
    .trim()
    .refine((v) => !v || v.replace(/\D/g, "").length === 11, {
      message: "CPF deve ter 11 dígitos.",
    }),
  doc_identidade_numero: z.string(),
  doc_identidade_tipo: z.string(),
  doc_identidade_orgao_exp: z.string(),
  email: z
    .string()
    .trim()
    .refine((v) => !v || z.email().safeParse(v).success, {
      message: "E-mail inválido.",
    }),
  whatsapp: z.string(),
  telefone: z.string(),
  telefone_comercial: z.string(),
  endereco_completo: z.string(),
  endereco_comercial: z.string(),
  data_nascimento: z.string(),
  estado_civil: z.string(),
  profissao: z.string(),
  empresa: z.string(),
  // Dados bancários (só considerados se o usuário tiver permissão financeiro)
  banco: z.string(),
  agencia: z.string(),
  conta: z.string(),
  tipo_conta: z.string(),
  pix: z.string(),
});

type ProprietarioFormValues = z.infer<typeof proprietarioSchema>;

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
  type = "text",
  mask,
}: {
  control: Control<ProprietarioFormValues>;
  name: keyof ProprietarioFormValues & string;
  label: string;
  placeholder?: string;
  mono?: boolean;
  type?: string;
  mask?: "phone" | "cpf";
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={labelStyle}>{label}</FormLabel>
          <FormControl>
            {mask ? (
              <MaskedInput
                {...field}
                mask={mask === "phone" ? maskPhone : maskCpf}
                placeholder={placeholder}
                className={`${underline} font-mono`}
              />
            ) : (
              <Input
                {...field}
                type={type}
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

export function ProprietarioForm({
  proprietario,
  dadosBancarios,
  podeFinanceiro,
}: {
  proprietario?: Proprietario;
  dadosBancarios?: ProprietarioDadosBancarios | null;
  podeFinanceiro: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(proprietario);

  const form = useForm<ProprietarioFormValues>({
    resolver: zodResolver(proprietarioSchema),
    defaultValues: {
      nome_completo: proprietario?.nome_completo ?? "",
      cpf: proprietario?.cpf ?? "",
      doc_identidade_numero: proprietario?.doc_identidade_numero ?? "",
      doc_identidade_tipo: proprietario?.doc_identidade_tipo ?? "",
      doc_identidade_orgao_exp: proprietario?.doc_identidade_orgao_exp ?? "",
      email: proprietario?.email ?? "",
      whatsapp: proprietario?.whatsapp ?? "",
      telefone: proprietario?.telefone ?? "",
      telefone_comercial: proprietario?.telefone_comercial ?? "",
      endereco_completo: proprietario?.endereco_completo ?? "",
      endereco_comercial: proprietario?.endereco_comercial ?? "",
      data_nascimento: proprietario?.data_nascimento ?? "",
      estado_civil: proprietario?.estado_civil ?? "",
      profissao: proprietario?.profissao ?? "",
      empresa: proprietario?.empresa ?? "",
      banco: dadosBancarios?.banco ?? "",
      agencia: dadosBancarios?.agencia ?? "",
      conta: dadosBancarios?.conta ?? "",
      tipo_conta: dadosBancarios?.tipo_conta ?? "",
      pix: dadosBancarios?.pix ?? "",
    },
  });

  async function onSubmit(data: ProprietarioFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      nome_completo: data.nome_completo.trim(),
      cpf: toText(data.cpf),
      doc_identidade_numero: toText(data.doc_identidade_numero),
      doc_identidade_tipo: toText(data.doc_identidade_tipo),
      doc_identidade_orgao_exp: toText(data.doc_identidade_orgao_exp),
      email: toText(data.email),
      whatsapp: toText(data.whatsapp),
      telefone: toText(data.telefone),
      telefone_comercial: toText(data.telefone_comercial),
      endereco_completo: toText(data.endereco_completo),
      endereco_comercial: toText(data.endereco_comercial),
      data_nascimento: data.data_nascimento || null,
      estado_civil: toText(data.estado_civil),
      profissao: toText(data.profissao),
      empresa: toText(data.empresa),
    };

    let proprietarioId = proprietario?.id;

    if (isEdit && proprietarioId) {
      const { error } = await supabase
        .from("proprietarios")
        .update(payload)
        .eq("id", proprietarioId);
      if (error) {
        toast.error(`Erro ao salvar: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { data: created, error } = await supabase
        .from("proprietarios")
        .insert(payload)
        .select("id")
        .single();
      if (error || !created) {
        toast.error(`Erro ao cadastrar: ${error?.message}`);
        setSaving(false);
        return;
      }
      proprietarioId = created.id as string;
    }

    if (podeFinanceiro) {
      const temDadoBancario = [
        data.banco,
        data.agencia,
        data.conta,
        data.tipo_conta,
        data.pix,
      ].some((v) => v.trim());

      if (temDadoBancario || dadosBancarios) {
        const bancarioPayload = {
          proprietario_id: proprietarioId!,
          banco: toText(data.banco),
          agencia: toText(data.agencia),
          conta: toText(data.conta),
          tipo_conta: toText(data.tipo_conta),
          pix: toText(data.pix),
        };
        const { error: bancarioError } = dadosBancarios
          ? await supabase
              .from("proprietarios_dados_bancarios")
              .update(bancarioPayload)
              .eq("id", dadosBancarios.id)
          : await supabase
              .from("proprietarios_dados_bancarios")
              .insert(bancarioPayload);
        if (bancarioError) {
          toast.error(`Erro nos dados bancários: ${bancarioError.message}`);
          setSaving(false);
          return;
        }
      }
    }

    toast.success(isEdit ? "Proprietário atualizado." : "Proprietário cadastrado.");
    router.push(`/proprietarios/${proprietarioId}`);
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
        <Secao titulo="Dados pessoais">
          <TextField
            control={form.control}
            name="nome_completo"
            label="Nome completo"
            placeholder="Nome do proprietário"
          />
          <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-4">
            <TextField control={form.control} name="cpf" label="CPF" mask="cpf" placeholder="000.000.000-00" />
            <TextField control={form.control} name="doc_identidade_numero" label="Documento (nº)" mono />
            <TextField control={form.control} name="doc_identidade_tipo" label="Tipo do documento" placeholder="RG, CNH…" />
            <TextField control={form.control} name="doc_identidade_orgao_exp" label="Órgão expedidor" placeholder="SSP/SP" />
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-4">
            <TextField control={form.control} name="data_nascimento" label="Nascimento" type="date" mono />
            <FormField
              control={form.control}
              name="estado_civil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}>Estado civil</FormLabel>
                  <Select
                    value={field.value || "nenhum"}
                    onValueChange={(v) => field.onChange(v === "nenhum" ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger className={selectUnderline}>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nenhum">—</SelectItem>
                      {estadosCivis.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-alert" />
                </FormItem>
              )}
            />
            <TextField control={form.control} name="profissao" label="Profissão" />
            <TextField control={form.control} name="empresa" label="Empresa" />
          </div>
        </Secao>

        <Secao titulo="Contato">
          <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-4">
            <TextField control={form.control} name="email" label="E-mail" placeholder="nome@email.com" />
            <TextField control={form.control} name="whatsapp" label="WhatsApp" mask="phone" placeholder="(16) 99999-0000" />
            <TextField control={form.control} name="telefone" label="Telefone" mask="phone" />
            <TextField control={form.control} name="telefone_comercial" label="Telefone comercial" mask="phone" />
          </div>
        </Secao>

        <Secao titulo="Endereços">
          <FormField
            control={form.control}
            name="endereco_completo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyle}>Endereço residencial</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={2} className={`${underline} resize-none`} placeholder="Rua, número, bairro, cidade, CEP" />
                </FormControl>
                <FormMessage className="text-xs text-alert" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endereco_comercial"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyle}>Endereço comercial</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={2} className={`${underline} resize-none`} />
                </FormControl>
                <FormMessage className="text-xs text-alert" />
              </FormItem>
            )}
          />
        </Secao>

        {podeFinanceiro ? (
          <section className="rounded-md border border-gold/60 bg-gold/5 p-6">
            <div className="flex items-start justify-between gap-4 border-b-2 border-ink pb-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
                  <LockSimple size={16} aria-hidden />
                  Dados bancários
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Seção restrita — visível apenas para perfis com a permissão
                  financeira de proprietários.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-7 pt-6 sm:grid-cols-3">
              <TextField control={form.control} name="banco" label="Banco" />
              <TextField control={form.control} name="agencia" label="Agência" mono />
              <TextField control={form.control} name="conta" label="Conta" mono />
              <FormField
                control={form.control}
                name="tipo_conta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>Tipo de conta</FormLabel>
                    <Select
                      value={field.value || "nenhum"}
                      onValueChange={(v) => field.onChange(v === "nenhum" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger className={selectUnderline}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nenhum">—</SelectItem>
                        <SelectItem value="Corrente">Corrente</SelectItem>
                        <SelectItem value="Poupança">Poupança</SelectItem>
                        <SelectItem value="Pagamento">Pagamento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-alert" />
                  </FormItem>
                )}
              />
              <TextField control={form.control} name="pix" label="Chave PIX" mono />
            </div>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="rounded-sm bg-primary px-6 py-3 text-[13px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Salvando…"
              : isEdit
                ? "Salvar alterações"
                : "Cadastrar proprietário"}
          </button>
          <Link
            href={
              isEdit && proprietario
                ? `/proprietarios/${proprietario.id}`
                : "/proprietarios"
            }
            className="rounded-sm px-4 py-3 text-center text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </Form>
  );
}
