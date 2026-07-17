import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Location relativo (não `new URL("/login", request.url)`): atrás de um
  // proxy reverso (EasyPanel), `request.url` reflete o endereço interno do
  // container (ex.: 0.0.0.0:80), não o domínio público. Um Location relativo
  // é resolvido pelo navegador contra a URL que ele realmente usou.
  return new Response(null, {
    status: 303,
    headers: { Location: "/login" },
  });
}
