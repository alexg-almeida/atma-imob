"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCircle, WarningCircle } from "@phosphor-icons/react";
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
import { maskCep, maskPhone } from "@/lib/masks";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImovelPicker, type ImovelOption } from "@/components/leads/imovel-picker";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadEtapa, LeadOrigem, Parceiro } from "@/lib/supabase/types";

const underline =
  "rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary aria-invalid:border-alert";

const selectUnderline =
  "w-full rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus:border-primary";

const labelStyle =
  "text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

const BUCKET = "leads";

const leadSchema = z.object({
  nome_completo: z.string().trim().min(3, "Informe o nome completo."),
  whatsapp: z.string(),
  telefone_1: z.string(),
  telefone_2: z.string(),
  email: z
    .string()
    .trim()
    .refine((v) => !v || z.email().safeParse(v).success, {
      message: "E-mail inválido.",
    }),
  cidade: z.string(),
  estado: z.string(),
  cep: z.string(),
  endereco_completo: z.string(),
  origem_id: z.string(),
  etapa_id: z.string().min(1, "Selecione a etapa."),
  corretor_id: z.string(),
  imovel_interesse_id: z.string(),
  observacoes: z.string(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

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
  control: Control<LeadFormValues>;
  name: keyof LeadFormValues & string;
  label: string;
  placeholder?: string;
  mono?: boolean;
  mask?: "phone" | "cep";
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
                mask={mask === "phone" ? maskPhone : maskCep}
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

type LeadFormProps = {
  lead?: Lead;
  origens: Pick<LeadOrigem, "id" | "nome">[];
  etapas: Pick<LeadEtapa, "id" | "nome" | "ordem">[];
  imoveisOptions: ImovelOption[];
  podeVerTodos: boolean;
  corretores: Pick<Parceiro, "id" | "nome_completo">[];
  meuParceiroId: string | null;
};

export function LeadForm({
  lead,
  origens,
  etapas,
  imoveisOptions,
  podeVerTodos,
  corretores,
  meuParceiroId,
}: LeadFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(lead?.foto_url ?? null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const isEdit = Boolean(lead);
  const etapaInicial = etapas.find((e) => e.ordem === 1) ?? etapas[0];

  const semParceiroVinculado = !podeVerTodos && !meuParceiroId && !isEdit;

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome_completo: lead?.nome_completo ?? "",
      whatsapp: lead?.whatsapp ?? "",
      telefone_1: lead?.telefone_1 ?? "",
      telefone_2: lead?.telefone_2 ?? "",
      email: lead?.email ?? "",
      cidade: lead?.cidade ?? "",
      estado: lead?.estado ?? "",
      cep: lead?.cep ?? "",
      endereco_completo: lead?.endereco_completo ?? "",
      origem_id: lead?.origem_id ?? "",
      etapa_id: lead?.etapa_id ?? etapaInicial?.id ?? "",
      corretor_id: lead?.corretor_id ?? meuParceiroId ?? "",
      imovel_interesse_id: lead?.imovel_interesse_id ?? "",
      observacoes: lead?.observacoes ?? "",
    },
  });

  async function handleFotoUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      toast.error(`Falha no upload: ${uploadError.message}`);
      setUploadingFoto(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setFotoUrl(publicUrl);
    setUploadingFoto(false);
  }

  async function onSubmit(data: LeadFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      nome_completo: data.nome_completo.trim(),
      foto_url: fotoUrl,
      whatsapp: toText(data.whatsapp),
      telefone_1: toText(data.telefone_1),
      telefone_2: toText(data.telefone_2),
      email: toText(data.email),
      cidade: toText(data.cidade),
      estado: toText(data.estado)?.toUpperCase() ?? null,
      cep: toText(data.cep),
      endereco_completo: toText(data.endereco_completo),
      origem_id: data.origem_id || null,
      etapa_id: data.etapa_id || null,
      corretor_id: data.corretor_id || null,
      imovel_interesse_id: data.imovel_interesse_id || null,
      observacoes: toText(data.observacoes),
    };

    if (isEdit && lead) {
      const { error } = await supabase
        .from("leads")
        .update(payload)
        .eq("id", lead.id);
      if (error) {
        toast.error(`Erro ao salvar: ${error.message}`);
        setSaving(false);
        return;
      }
      toast.success("Lead atualizado.");
      router.push(`/leads/${lead.id}`);
    } else {
      const { data: created, error } = await supabase
        .from("leads")
        .insert(payload)
        .select("id")
        .single();
      if (error || !created) {
        toast.error(`Erro ao cadastrar: ${error?.message}`);
        setSaving(false);
        return;
      }
      toast.success("Lead cadastrado.");
      router.push(`/leads/${created.id}`);
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
        {semParceiroVinculado ? (
          <p className="flex items-start gap-2 rounded-sm bg-gold/10 px-4 py-3 text-sm text-ink">
            <WarningCircle size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden />
            Seu usuário não está vinculado a um registro de parceiro/corretor —
            peça a um administrador para vincular seu perfil em Parceiros antes
            de cadastrar leads.
          </p>
        ) : null}

        <section>
          <div className="border-b-2 border-ink pb-3">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Identificação
            </h2>
          </div>
          <div className="flex flex-col gap-8 pt-6 sm:flex-row">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface">
                {fotoUrl ? (
                  <Image
                    src={fotoUrl}
                    alt="Foto do lead"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle size={48} className="text-strong-line" aria-hidden />
                )}
              </div>
              <label className="cursor-pointer text-[11px] font-semibold tracking-[0.1em] text-primary uppercase transition-colors hover:text-primary-hover">
                {uploadingFoto ? "Enviando…" : fotoUrl ? "Trocar foto" : "Adicionar foto"}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingFoto}
                  onChange={(e) => handleFotoUpload(e.target.files)}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="flex-1 space-y-7">
              <TextField
                control={form.control}
                name="nome_completo"
                label="Nome completo"
                placeholder="Nome do contato"
              />
              <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-3">
                <TextField control={form.control} name="whatsapp" label="WhatsApp" mask="phone" placeholder="(16) 99999-0000" />
                <TextField control={form.control} name="telefone_1" label="Telefone 1" mask="phone" />
                <TextField control={form.control} name="telefone_2" label="Telefone 2" mask="phone" />
              </div>
              <TextField control={form.control} name="email" label="E-mail" placeholder="nome@email.com" />
            </div>
          </div>
        </section>

        <section>
          <div className="border-b-2 border-ink pb-3">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Endereço
            </h2>
          </div>
          <div className="space-y-7 pt-6">
            <TextField control={form.control} name="endereco_completo" label="Endereço completo" />
            <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-3">
              <TextField
                control={form.control}
                name="cidade"
                label="Cidade"
                placeholder="Ribeirão Preto"
              />
              <TextField control={form.control} name="estado" label="UF" placeholder="SP" />
              <TextField control={form.control} name="cep" label="CEP" mask="cep" placeholder="14000-000" />
            </div>
          </div>
        </section>

        <section>
          <div className="border-b-2 border-ink pb-3">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Atendimento
            </h2>
          </div>
          <div className="space-y-7 pt-6">
            <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="origem_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>Origem</FormLabel>
                    <Select
                      value={field.value || "nenhuma"}
                      onValueChange={(v) => field.onChange(v === "nenhuma" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger className={selectUnderline}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nenhuma">—</SelectItem>
                        {origens.map((origem) => (
                          <SelectItem key={origem.id} value={origem.id}>
                            {origem.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-alert" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="etapa_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>Etapa</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={selectUnderline}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {etapas.map((etapa) => (
                          <SelectItem key={etapa.id} value={etapa.id}>
                            {etapa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-alert" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="corretor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>Corretor responsável</FormLabel>
                    {podeVerTodos ? (
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
                          <SelectItem value="nenhum">— Sem corretor —</SelectItem>
                          {corretores.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome_completo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="pb-2 text-sm text-ink">Você</p>
                    )}
                    <FormMessage className="text-xs text-alert" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imovel_interesse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}>Imóvel de interesse</FormLabel>
                  <FormControl>
                    <ImovelPicker
                      value={field.value}
                      onChange={field.onChange}
                      options={imoveisOptions}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-alert" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Preferências, histórico de contato, notas gerais…"
                      className={`${underline} resize-none`}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-alert" />
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Cadastrar lead"}
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href={isEdit && lead ? `/leads/${lead.id}` : "/leads"}>
              Cancelar
            </Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
