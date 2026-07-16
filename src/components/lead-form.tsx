"use client";

import { useId, useState, type FormEvent } from "react";
import { interestOptions, originOptions } from "@/lib/mock-data";
import { Toggle } from "@/components/ui/toggle";

type FormState = {
  name: string;
  phone: string;
  interest: string;
  origin: string;
  isOwner: boolean;
};

const initialState: FormState = {
  name: "",
  phone: "",
  interest: interestOptions[0] ?? "",
  origin: originOptions[0],
  isOwner: false,
};

const fieldBase =
  "w-full border-0 border-b bg-transparent pb-2 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-muted-foreground focus:border-primary";

const labelBase =
  "mb-2 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

export function LeadForm() {
  const formId = useId();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [confirmedName, setConfirmedName] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = "Informe o nome do contato.";
    if (!form.phone.trim()) nextErrors.phone = "Informe um telefone de contato.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setConfirmedName(form.name.trim());
    setForm(initialState);
  }

  return (
    <section aria-labelledby="lead-form-heading">
      <div className="border-b-2 border-ink pb-4">
        <h2
          id="lead-form-heading"
          className="text-xl font-semibold tracking-tight text-ink"
        >
          Novo contato
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registrar um lead ou proprietário na carteira
        </p>
      </div>

      {confirmedName ? (
        <p role="status" className="mt-5 border-b border-line pb-4 text-sm text-sage">
          {confirmedName} foi adicionado à carteira.
        </p>
      ) : null}

      <form className="mt-6 space-y-7" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={`${formId}-name`} className={labelBase}>
            Nome
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nome completo"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${formId}-name-error` : undefined}
            className={`${fieldBase} ${errors.name ? "border-alert" : "border-line"}`}
          />
          {errors.name ? (
            <p id={`${formId}-name-error`} className="mt-2 text-xs text-alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${formId}-phone`} className={labelBase}>
            Telefone
          </label>
          <input
            id={`${formId}-phone`}
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="(16) 99999-0000"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${formId}-phone-error` : undefined}
            className={`${fieldBase} font-mono placeholder:font-sans ${
              errors.phone ? "border-alert" : "border-line"
            }`}
          />
          {errors.phone ? (
            <p id={`${formId}-phone-error`} className="mt-2 text-xs text-alert">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${formId}-interest`} className={labelBase}>
            Imóvel de interesse
          </label>
          <select
            id={`${formId}-interest`}
            value={form.interest}
            onChange={(e) => setForm((f) => ({ ...f, interest: e.target.value }))}
            className={`${fieldBase} cursor-pointer border-line`}
          >
            {interestOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-origin`} className={labelBase}>
            Origem
          </label>
          <select
            id={`${formId}-origin`}
            value={form.origin}
            onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
            className={`${fieldBase} cursor-pointer border-line`}
          >
            {originOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="border-y border-line py-4">
          <Toggle
            id={`${formId}-owner`}
            checked={form.isOwner}
            onChange={(isOwner) => setForm((f) => ({ ...f, isOwner }))}
            label="É proprietário"
            description="O contato administra um imóvel com a Atma"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-sm bg-primary px-4 py-3 text-[13px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Adicionar contato
        </button>
      </form>
    </section>
  );
}
