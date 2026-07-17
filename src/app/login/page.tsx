"use client";

import { useId, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const fieldBase =
  "w-full border-0 border-b bg-transparent pb-2 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-muted-foreground focus:border-primary";

const labelBase =
  "mb-2 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

export default function LoginPage() {
  const formId = useId();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setSubmitting(false);
      setError(
        signInError.code === "invalid_credentials"
          ? "E-mail ou senha inválidos."
          : "Não foi possível entrar. Tente novamente em instantes.",
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-16">
      <Image
        src="/brand/atma-logo.png"
        alt="Atma Consultoria Imobiliária"
        width={763}
        height={257}
        priority
        className="h-16 w-[190px] shrink-0 aspect-[763/257]"
      />

      <div className="mt-10 border-b-2 border-ink pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Acesso da equipe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre com o e-mail cadastrado no CRM.
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-5 text-sm text-alert">
          {error}
        </p>
      ) : null}

      <form className="mt-8 space-y-7" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={`${formId}-email`} className={labelBase}>
            E-mail
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@atmaimob.com.br"
            className={`${fieldBase} border-line`}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-password`} className={labelBase}>
            Senha
          </label>
          <input
            id={`${formId}-password`}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`${fieldBase} border-line`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-sm bg-primary px-4 py-3 text-[13px] font-semibold tracking-[0.12em] text-white uppercase transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-16 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        Atma Consultoria Imobiliária
      </p>
    </main>
  );
}
