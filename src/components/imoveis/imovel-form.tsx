"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash } from "@phosphor-icons/react";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { MaskedInput } from "@/components/ui/masked-input";
import { maskCep } from "@/lib/masks";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagInput } from "@/components/ui/tag-input";
import { createClient } from "@/lib/supabase/client";
import { finalidadeOptions, statusOptions } from "@/lib/imoveis/constants";
import type {
  Imovel,
  ImovelProprietario,
  ImovelTipo,
  Parceiro,
  Proprietario,
} from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Estilo editorial: campos sublinhados
// ---------------------------------------------------------------------------
const underline =
  "rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary aria-invalid:border-alert";

const selectUnderline =
  "w-full rounded-none border-0 border-b border-line bg-transparent px-0 shadow-none focus-visible:ring-0 focus:border-primary";

const labelStyle =
  "text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

// ---------------------------------------------------------------------------
// Conversões numéricas (form usa string em pt-BR)
// ---------------------------------------------------------------------------
function parseNum(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function numToForm(value: number | null | undefined): string {
  return value == null ? "" : String(value).replace(".", ",");
}

function toText(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

const numericStr = z.string().refine((v) => !v.trim() || parseNum(v) != null, {
  message: "Número inválido.",
});

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const imovelSchema = z
  .object({
    tipo_id: z.string().min(1, "Selecione o tipo."),
    finalidade: z.enum(["venda", "locacao", "ambos"]),
    status: z.enum(["ativo", "reservado", "vendido", "alugado", "inativo"]),
    frase_destaque: z.string(),
    descricao: z.string(),
    endereco_completo: z.string().trim().min(5, "Informe o endereço completo."),
    cidade: z.string().trim().min(2, "Informe a cidade."),
    estado: z.string().trim().min(2, "UF").max(2, "UF"),
    cep: z.string(),
    data_captacao: z.string(),
    captador_id: z.string(),
    inscricao_imobiliaria: z.string(),
    numero_matricula: z.string(),
    observacoes: z.string(),
    area_interna: numericStr,
    area_externa: numericStr,
    area_lote: numericStr,
    andar: numericStr,
    salas: numericStr,
    quartos: numericStr,
    suites: numericStr,
    banheiros: numericStr,
    varandas: numericStr,
    vagas: numericStr,
    numero_vaga: z.string(),
    tipo_vaga: z.string(),
    piso_acabamento: z.string(),
    fachada: z.string(),
    comodidades_internas: z.array(z.string()),
    instalacoes: z.array(z.string()),
    lazer: z.array(z.string()),
    diferenciais: z.array(z.string()),
    valor_venda: numericStr,
    comissao_percentual: numericStr,
    valor_locacao: numericStr,
    iptu_mensal: numericStr,
    repasse_iptu: z.boolean(),
    taxa_lixo: numericStr,
    parcela_taxa_lixo: z.string(),
    valor_condominio: numericStr,
    outras_taxas: numericStr,
    proprietarios: z.array(
      z.object({
        proprietario_id: z.string().min(1, "Selecione o proprietário."),
        percentual: numericStr,
        principal: z.boolean(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.finalidade !== "locacao" && parseNum(data.valor_venda) == null) {
      ctx.addIssue({
        code: "custom",
        path: ["valor_venda"],
        message: "Informe o valor de venda.",
      });
    }
    if (data.finalidade !== "venda" && parseNum(data.valor_locacao) == null) {
      ctx.addIssue({
        code: "custom",
        path: ["valor_locacao"],
        message: "Informe o valor de locação.",
      });
    }
    const ids = data.proprietarios.map((p) => p.proprietario_id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["proprietarios"],
        message: "Proprietário duplicado na lista.",
      });
    }
  });

export type ImovelFormValues = z.infer<typeof imovelSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
type ImovelFormProps = {
  tipos: Pick<ImovelTipo, "id" | "nome">[];
  parceiros: Pick<Parceiro, "id" | "nome_completo">[];
  proprietarios: Pick<Proprietario, "id" | "nome_completo">[];
  imovel?: Imovel;
  vinculos?: ImovelProprietario[];
  /** Para onde ir após salvar uma edição (padrão: `/imoveis/{id}`). */
  aoSalvarRedirecionarPara?: string;
};

function defaultValuesFrom(
  imovel: Imovel | undefined,
  vinculos: ImovelProprietario[],
): ImovelFormValues {
  return {
    tipo_id: imovel?.tipo_id ?? "",
    finalidade: imovel?.finalidade ?? "venda",
    status: imovel?.status ?? "ativo",
    frase_destaque: imovel?.frase_destaque ?? "",
    descricao: imovel?.descricao ?? "",
    endereco_completo: imovel?.endereco_completo ?? "",
    cidade: imovel?.cidade ?? "Ribeirão Preto",
    estado: imovel?.estado ?? "SP",
    cep: imovel?.cep ?? "",
    data_captacao: imovel?.data_captacao ?? "",
    captador_id: imovel?.captador_id ?? "",
    inscricao_imobiliaria: imovel?.inscricao_imobiliaria ?? "",
    numero_matricula: imovel?.numero_matricula ?? "",
    observacoes: imovel?.observacoes ?? "",
    area_interna: numToForm(imovel?.area_interna),
    area_externa: numToForm(imovel?.area_externa),
    area_lote: numToForm(imovel?.area_lote),
    andar: numToForm(imovel?.andar),
    salas: numToForm(imovel?.salas),
    quartos: numToForm(imovel?.quartos),
    suites: numToForm(imovel?.suites),
    banheiros: numToForm(imovel?.banheiros),
    varandas: numToForm(imovel?.varandas),
    vagas: numToForm(imovel?.vagas),
    numero_vaga: imovel?.numero_vaga ?? "",
    tipo_vaga: imovel?.tipo_vaga ?? "",
    piso_acabamento: imovel?.piso_acabamento ?? "",
    fachada: imovel?.fachada ?? "",
    comodidades_internas: imovel?.comodidades_internas ?? [],
    instalacoes: imovel?.instalacoes ?? [],
    lazer: imovel?.lazer ?? [],
    diferenciais: imovel?.diferenciais ?? [],
    valor_venda: numToForm(imovel?.valor_venda),
    comissao_percentual: numToForm(imovel?.comissao_percentual),
    valor_locacao: numToForm(imovel?.valor_locacao),
    iptu_mensal: numToForm(imovel?.iptu_mensal),
    repasse_iptu: imovel?.repasse_iptu ?? false,
    taxa_lixo: numToForm(imovel?.taxa_lixo),
    parcela_taxa_lixo: imovel?.parcela_taxa_lixo ?? "",
    valor_condominio: numToForm(imovel?.valor_condominio),
    outras_taxas: numToForm(imovel?.outras_taxas),
    proprietarios: vinculos.map((v) => ({
      proprietario_id: v.proprietario_id,
      percentual: numToForm(v.percentual_participacao),
      principal: v.principal,
    })),
  };
}

// ---------------------------------------------------------------------------
// Campos auxiliares
// ---------------------------------------------------------------------------
function TextField({
  control,
  name,
  label,
  placeholder,
  mono,
  mask,
}: {
  control: Control<ImovelFormValues>;
  name: keyof ImovelFormValues & string;
  label: string;
  placeholder?: string;
  mono?: boolean;
  mask?: "money" | "cep";
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={labelStyle}>{label}</FormLabel>
          <FormControl>
            {mask === "money" ? (
              <CurrencyInput
                {...field}
                value={field.value as string}
                placeholder={placeholder}
                className={`${underline} font-mono`}
              />
            ) : mask === "cep" ? (
              <MaskedInput
                {...field}
                value={field.value as string}
                mask={maskCep}
                placeholder={placeholder}
                className={`${underline} font-mono`}
              />
            ) : (
              <Input
                {...field}
                value={field.value as string}
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

// ---------------------------------------------------------------------------
// Formulário
// ---------------------------------------------------------------------------
export function ImovelForm({
  tipos,
  parceiros,
  proprietarios,
  imovel,
  vinculos = [],
  aoSalvarRedirecionarPara,
}: ImovelFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(imovel);

  const form = useForm<ImovelFormValues>({
    resolver: zodResolver(imovelSchema),
    defaultValues: defaultValuesFrom(imovel, vinculos),
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "proprietarios",
  });

  const finalidade = useWatch({
    control: form.control,
    name: "finalidade",
  });
  const mostraVenda = finalidade !== "locacao";
  const mostraLocacao = finalidade !== "venda";

  async function onSubmit(data: ImovelFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      tipo_id: data.tipo_id,
      finalidade: data.finalidade,
      status: data.status,
      frase_destaque: toText(data.frase_destaque),
      descricao: toText(data.descricao),
      endereco_completo: toText(data.endereco_completo),
      cidade: toText(data.cidade),
      estado: toText(data.estado)?.toUpperCase() ?? null,
      cep: toText(data.cep),
      data_captacao: data.data_captacao || null,
      captador_id: data.captador_id || null,
      inscricao_imobiliaria: toText(data.inscricao_imobiliaria),
      numero_matricula: toText(data.numero_matricula),
      observacoes: toText(data.observacoes),
      area_interna: parseNum(data.area_interna),
      area_externa: parseNum(data.area_externa),
      area_lote: parseNum(data.area_lote),
      andar: parseNum(data.andar),
      salas: parseNum(data.salas),
      quartos: parseNum(data.quartos),
      suites: parseNum(data.suites),
      banheiros: parseNum(data.banheiros),
      varandas: parseNum(data.varandas),
      vagas: parseNum(data.vagas),
      numero_vaga: toText(data.numero_vaga),
      tipo_vaga: toText(data.tipo_vaga),
      piso_acabamento: toText(data.piso_acabamento),
      fachada: toText(data.fachada),
      comodidades_internas: data.comodidades_internas,
      instalacoes: data.instalacoes,
      lazer: data.lazer,
      diferenciais: data.diferenciais,
      valor_venda: mostraVenda ? parseNum(data.valor_venda) : null,
      comissao_percentual: parseNum(data.comissao_percentual),
      valor_locacao: mostraLocacao ? parseNum(data.valor_locacao) : null,
      iptu_mensal: parseNum(data.iptu_mensal),
      repasse_iptu: data.repasse_iptu,
      taxa_lixo: parseNum(data.taxa_lixo),
      parcela_taxa_lixo: toText(data.parcela_taxa_lixo),
      valor_condominio: parseNum(data.valor_condominio),
      outras_taxas: parseNum(data.outras_taxas),
    };

    let imovelId = imovel?.id;

    if (isEdit && imovelId) {
      const { error } = await supabase
        .from("imoveis")
        .update(payload)
        .eq("id", imovelId);
      if (error) {
        toast.error(`Erro ao salvar o imóvel: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { data: created, error } = await supabase
        .from("imoveis")
        .insert(payload)
        .select("id")
        .single();
      if (error || !created) {
        toast.error(`Erro ao cadastrar o imóvel: ${error?.message}`);
        setSaving(false);
        return;
      }
      imovelId = created.id as string;
    }

    // Sincroniza proprietários vinculados
    const atuais = data.proprietarios.map((p) => ({
      imovel_id: imovelId!,
      proprietario_id: p.proprietario_id,
      percentual_participacao: parseNum(p.percentual),
      principal: p.principal,
      ativo: true,
    }));

    if (atuais.length > 0) {
      const { error: upsertError } = await supabase
        .from("imoveis_proprietarios")
        .upsert(atuais, { onConflict: "imovel_id,proprietario_id" });
      if (upsertError) {
        toast.error(`Erro ao vincular proprietários: ${upsertError.message}`);
        setSaving(false);
        return;
      }
    }

    const removidos = vinculos.filter(
      (v) =>
        v.ativo &&
        !data.proprietarios.some(
          (p) => p.proprietario_id === v.proprietario_id,
        ),
    );
    for (const vinculo of removidos) {
      await supabase
        .from("imoveis_proprietarios")
        .update({ ativo: false })
        .eq("id", vinculo.id);
    }

    toast.success(isEdit ? "Imóvel atualizado." : "Imóvel cadastrado.");
    router.push(
      aoSalvarRedirecionarPara ??
        (isEdit ? `/imoveis/${imovelId}` : `/imoveis/${imovelId}/editar`),
    );
    router.refresh();
    setSaving(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Tabs defaultValue="geral">
          <TabsList variant="line" className="w-full justify-start gap-6 border-b border-line">
            <TabsTrigger value="geral" className="flex-none px-0 text-[13px] font-semibold tracking-[0.12em] uppercase">
              Geral
            </TabsTrigger>
            <TabsTrigger value="caracteristicas" className="flex-none px-0 text-[13px] font-semibold tracking-[0.12em] uppercase">
              Características
            </TabsTrigger>
            <TabsTrigger value="valores" className="flex-none px-0 text-[13px] font-semibold tracking-[0.12em] uppercase">
              Valores
            </TabsTrigger>
            <TabsTrigger value="proprietarios" className="flex-none px-0 text-[13px] font-semibold tracking-[0.12em] uppercase">
              Proprietários
            </TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------ GERAL */}
          <TabsContent value="geral" className="space-y-7 pt-8">
            <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="tipo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={selectUnderline}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipos.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nome}
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
                name="finalidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>Finalidade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={selectUnderline}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {finalidadeOptions.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={selectUnderline}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-alert" />
                  </FormItem>
                )}
              />
            </div>

            <TextField
              control={form.control}
              name="frase_destaque"
              label="Frase de destaque"
              placeholder="Ex.: Cobertura com vista definitiva para o parque"
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Descrição completa do imóvel"
                      className={`${underline} resize-none`}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-alert" />
                </FormItem>
              )}
            />

            <TextField
              control={form.control}
              name="endereco_completo"
              label="Endereço completo"
              placeholder="Rua, número, complemento, bairro"
            />

            <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-4">
              <TextField control={form.control} name="cidade" label="Cidade" />
              <TextField control={form.control} name="estado" label="UF" />
              <TextField control={form.control} name="cep" label="CEP" mask="cep" placeholder="14000-000" />
              <FormField
                control={form.control}
                name="data_captacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>Data de captação</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className={`${underline} font-mono`} />
                    </FormControl>
                    <FormMessage className="text-xs text-alert" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="captador_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>Captador</FormLabel>
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
                        <SelectItem value="nenhum">— Sem captador —</SelectItem>
                        {parceiros.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-alert" />
                  </FormItem>
                )}
              />
              <TextField
                control={form.control}
                name="inscricao_imobiliaria"
                label="Inscrição imobiliária"
                mono
              />
              <TextField
                control={form.control}
                name="numero_matricula"
                label="Nº da matrícula"
                mono
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}>Observações internas</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Anotações da equipe (não aparecem em materiais de divulgação)"
                      className={`${underline} resize-none`}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-alert" />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* ------------------------------------- CARACTERÍSTICAS */}
          <TabsContent value="caracteristicas" className="space-y-7 pt-8">
            <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-3">
              <TextField control={form.control} name="area_interna" label="Área interna (m²)" mono />
              <TextField control={form.control} name="area_externa" label="Área externa (m²)" mono />
              <TextField control={form.control} name="area_lote" label="Área do lote (m²)" mono />
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-4">
              <TextField control={form.control} name="andar" label="Andar" mono />
              <TextField control={form.control} name="salas" label="Salas" mono />
              <TextField control={form.control} name="quartos" label="Quartos" mono />
              <TextField control={form.control} name="suites" label="Suítes" mono />
              <TextField control={form.control} name="banheiros" label="Banheiros" mono />
              <TextField control={form.control} name="varandas" label="Varandas" mono />
              <TextField control={form.control} name="vagas" label="Vagas" mono />
              <TextField control={form.control} name="numero_vaga" label="Nº da vaga" mono />
            </div>

            <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-3">
              <TextField control={form.control} name="tipo_vaga" label="Tipo de vaga" placeholder="Coberta, livre…" />
              <TextField control={form.control} name="piso_acabamento" label="Piso / acabamento" />
              <TextField control={form.control} name="fachada" label="Fachada" />
            </div>

            {(
              [
                ["comodidades_internas", "Comodidades internas", "Ex.: armários planejados"],
                ["instalacoes", "Instalações", "Ex.: ar-condicionado"],
                ["lazer", "Lazer", "Ex.: piscina"],
                ["diferenciais", "Diferenciais", "Ex.: vista panorâmica"],
              ] as const
            ).map(([name, label, placeholder]) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}>{label}</FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={placeholder}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-alert" />
                  </FormItem>
                )}
              />
            ))}
          </TabsContent>

          {/* ------------------------------------------------ VALORES */}
          <TabsContent value="valores" className="space-y-8 pt-8">
            {mostraVenda ? (
              <section>
                <div className="border-b-2 border-ink pb-3">
                  <h3 className="font-semibold text-ink">Venda</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-10 gap-y-7 pt-6 sm:grid-cols-3">
                  <TextField control={form.control} name="valor_venda" label="Valor de venda (R$)" mask="money" placeholder="850.000,00" />
                  <TextField control={form.control} name="comissao_percentual" label="Comissão (%)" mono placeholder="6" />
                </div>
              </section>
            ) : null}

            {mostraLocacao ? (
              <section>
                <div className="border-b-2 border-ink pb-3">
                  <h3 className="font-semibold text-ink">Locação</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-10 gap-y-7 pt-6 sm:grid-cols-3">
                  <TextField control={form.control} name="valor_locacao" label="Aluguel mensal (R$)" mask="money" placeholder="3.200,00" />
                  <TextField control={form.control} name="iptu_mensal" label="IPTU mensal (R$)" mask="money" />
                  <FormField
                    control={form.control}
                    name="repasse_iptu"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3 self-end pb-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium text-ink">
                          Repassa IPTU ao locatário
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <TextField control={form.control} name="taxa_lixo" label="Taxa de lixo (R$)" mask="money" />
                  <TextField control={form.control} name="parcela_taxa_lixo" label="Parcela da taxa de lixo" placeholder="Ex.: 4 de 10" />
                </div>
              </section>
            ) : null}

            <section>
              <div className="border-b-2 border-ink pb-3">
                <h3 className="font-semibold text-ink">Encargos do imóvel</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-10 gap-y-7 pt-6 sm:grid-cols-3">
                <TextField control={form.control} name="valor_condominio" label="Condomínio (R$)" mask="money" />
                <TextField control={form.control} name="outras_taxas" label="Outras taxas (R$)" mask="money" />
              </div>
            </section>
          </TabsContent>

          {/* ------------------------------------------- PROPRIETÁRIOS */}
          <TabsContent value="proprietarios" className="space-y-6 pt-8">
            {proprietarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum proprietário cadastrado ainda —{" "}
                <Link href="/proprietarios/novo" className="font-semibold text-primary hover:text-primary-hover">
                  cadastre o primeiro
                </Link>{" "}
                para vinculá-lo ao imóvel.
              </p>
            ) : null}

            {fields.map((fieldRow, index) => (
              <div
                key={fieldRow.id}
                className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-line pb-5"
              >
                <FormField
                  control={form.control}
                  name={`proprietarios.${index}.proprietario_id`}
                  render={({ field }) => (
                    <FormItem className="min-w-64 flex-1">
                      <FormLabel className={labelStyle}>Proprietário</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={selectUnderline}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {proprietarios.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome_completo}
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
                  name={`proprietarios.${index}.percentual`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormLabel className={labelStyle}>Participação (%)</FormLabel>
                      <FormControl>
                        <Input {...field} className={`${underline} font-mono`} placeholder="100" />
                      </FormControl>
                      <FormMessage className="text-xs text-alert" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`proprietarios.${index}.principal`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 pb-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            // Apenas um principal por imóvel
                            if (checked) {
                              fields.forEach((_, i) => {
                                if (i !== index) {
                                  update(i, {
                                    ...form.getValues(`proprietarios.${i}`),
                                    principal: false,
                                  });
                                }
                              });
                            }
                            field.onChange(checked === true);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium text-ink">
                        Principal
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remover proprietário"
                  className="mb-2 text-muted-foreground transition-colors hover:text-alert"
                >
                  <Trash size={16} aria-hidden />
                </button>
              </div>
            ))}

            {form.formState.errors.proprietarios?.root?.message ||
            form.formState.errors.proprietarios?.message ? (
              <p className="text-xs text-alert">
                {form.formState.errors.proprietarios?.root?.message ??
                  form.formState.errors.proprietarios?.message}
              </p>
            ) : null}

            {proprietarios.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  append({
                    proprietario_id: "",
                    percentual: "",
                    principal: fields.length === 0,
                  })
                }
                className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.12em] text-primary uppercase transition-colors hover:text-primary-hover"
              >
                <Plus size={14} aria-hidden /> Adicionar proprietário
              </button>
            ) : null}
          </TabsContent>
        </Tabs>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="rounded-sm bg-primary px-6 py-3 text-[13px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Cadastrar imóvel"}
          </button>
          <Link
            href={isEdit && imovel ? `/imoveis/${imovel.id}` : "/imoveis"}
            className="rounded-sm px-4 py-3 text-center text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
          >
            Cancelar
          </Link>
          {Object.keys(form.formState.errors).length > 0 ? (
            <p className="text-xs text-alert sm:ml-auto">
              Há campos com erro — revise as abas destacadas.
            </p>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
