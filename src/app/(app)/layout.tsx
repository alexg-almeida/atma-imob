import { redirect } from "next/navigation";
import { Masthead } from "@/components/masthead";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userName =
    (user.user_metadata?.nome_completo as string | undefined) ??
    user.email ??
    "Usuário";
  // "core" é o módulo de gestão do próprio sistema — só o admin (seed_admin.sql)
  // tem permissão nele, então isso equivale a "é superadmin".
  const isAdmin = await temPermissao("core", "editar");

  return (
    <>
      <Masthead userName={userName} isAdmin={isAdmin} />
      <main className="mx-auto max-w-6xl px-6 pb-20">{children}</main>
      <Toaster position="bottom-right" />
    </>
  );
}
