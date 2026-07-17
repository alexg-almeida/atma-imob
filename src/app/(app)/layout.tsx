import { redirect } from "next/navigation";
import { Masthead } from "@/components/masthead";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <>
      <Masthead userName={userName} />
      <main className="mx-auto max-w-6xl px-6 pb-20">{children}</main>
      <Toaster position="bottom-right" />
    </>
  );
}
