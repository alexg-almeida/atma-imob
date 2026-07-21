import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { temPermissao } from "@/lib/permissoes";
import { ImovelForm } from "@/components/imoveis/imovel-form";
import { FotosManager } from "@/components/imoveis/fotos-manager";
import { DocumentosManager } from "@/components/imoveis/documentos-manager";
import type {
  Imovel,
  ImovelDocumento,
  ImovelFoto,
  ImovelProprietario,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Editar imóvel · Atma CRM",
};

export default async function EditarImovelPage(
  props: PageProps<"/imoveis/[id]/editar">,
) {
  const { id } = await props.params;
  const podeEditar = await temPermissao("imoveis", "editar");

  if (!podeEditar) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não tem permissão para editar imóveis.
        </p>
        <Link
          href={`/imoveis/${id}`}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Voltar para o imóvel
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: imovel } = await supabase
    .from("imoveis")
    .select("*")
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (!imovel) notFound();

  const [
    { data: tipos },
    { data: parceiros },
    { data: proprietarios },
    { data: vinculos },
    { data: fotos },
    { data: documentos },
  ] = await Promise.all([
    supabase.from("imoveis_tipos").select("id, nome").eq("ativo", true).order("nome"),
    supabase
      .from("parceiros")
      .select("id, nome_completo")
      .eq("ativo", true)
      .in("tipo", ["captador", "ambos"])
      .order("nome_completo"),
    supabase
      .from("proprietarios")
      .select("id, nome_completo")
      .eq("ativo", true)
      .order("nome_completo"),
    supabase
      .from("imoveis_proprietarios")
      .select("*")
      .eq("imovel_id", id)
      .eq("ativo", true),
    supabase
      .from("imoveis_fotos")
      .select("*")
      .eq("imovel_id", id)
      .eq("ativo", true)
      .order("ordem"),
    supabase
      .from("imoveis_documentos")
      .select("*")
      .eq("imovel_id", id)
      .eq("ativo", true)
      .order("created_at"),
  ]);

  return (
    <>
      <div className="pt-8 pb-6">
        <Link
          href={`/imoveis/${id}`}
          className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-ink"
        >
          ← Detalhe do imóvel
        </Link>
        <h1 className="mt-4 text-3xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-4xl">
          Editar imóvel
        </h1>
      </div>

      <ImovelForm
        tipos={tipos ?? []}
        parceiros={parceiros ?? []}
        proprietarios={proprietarios ?? []}
        imovel={imovel as Imovel}
        vinculos={(vinculos ?? []) as ImovelProprietario[]}
      />

      <section className="mt-16" aria-labelledby="fotos-heading">
        <div className="border-b-2 border-ink pb-4">
          <h2 id="fotos-heading" className="text-xl font-semibold tracking-tight text-ink">
            Galeria de fotos
          </h2>
        </div>
        <div className="pt-6">
          <FotosManager imovelId={id} fotos={(fotos ?? []) as ImovelFoto[]} />
        </div>
      </section>

      <section className="mt-16" aria-labelledby="documentos-heading">
        <div className="border-b-2 border-ink pb-4">
          <h2
            id="documentos-heading"
            className="text-xl font-semibold tracking-tight text-ink"
          >
            Documentos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Anexos em PDF: matrícula, IPTU, contratos e afins.
          </p>
        </div>
        <div className="pt-6">
          <DocumentosManager
            imovelId={id}
            documentos={(documentos ?? []) as ImovelDocumento[]}
          />
        </div>
      </section>
    </>
  );
}
