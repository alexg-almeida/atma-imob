import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bathtub,
  Bed,
  Buildings,
  Car,
  Ruler,
} from "@phosphor-icons/react/dist/ssr";
import { ImovelStatusDot } from "@/components/imoveis/imovel-status";
import { finalidadeLabels } from "@/lib/imoveis/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Imovel } from "@/lib/supabase/types";

export type ImovelListItem = Imovel & {
  tipo: { nome: string } | null;
  fotos: { url: string; capa: boolean; ordem: number; ativo: boolean }[];
};

function coverUrl(imovel: ImovelListItem) {
  const ativas = imovel.fotos
    .filter((foto) => foto.ativo)
    .sort((a, b) => a.ordem - b.ordem);
  return (ativas.find((foto) => foto.capa) ?? ativas[0])?.url ?? null;
}

export function ImovelCard({ imovel }: { imovel: ImovelListItem }) {
  const capa = coverUrl(imovel);
  const titulo = [imovel.tipo?.nome ?? "Imóvel", imovel.cidade]
    .filter(Boolean)
    .join(" · ");
  const dormitorios = (imovel.quartos ?? 0) + (imovel.suites ?? 0);

  const specs = [
    dormitorios > 0
      ? { icon: Bed, label: `${dormitorios}`, descricao: "dormitórios" }
      : null,
    imovel.banheiros != null && imovel.banheiros > 0
      ? { icon: Bathtub, label: `${imovel.banheiros}`, descricao: "banheiros" }
      : null,
    imovel.vagas != null && imovel.vagas > 0
      ? { icon: Car, label: `${imovel.vagas}`, descricao: "vagas" }
      : null,
    imovel.area_interna != null && imovel.area_interna > 0
      ? {
          icon: Ruler,
          label: `${imovel.area_interna} m²`,
          descricao: "área interna",
        }
      : null,
  ].filter(
    (spec): spec is { icon: typeof Bed; label: string; descricao: string } =>
      spec !== null,
  );

  return (
    <article>
      <Link
        href={`/imoveis/${imovel.id}`}
        className="group grid grid-cols-[6rem_minmax(0,1fr)] gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-4 focus-visible:ring-offset-bg sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6 md:grid-cols-[13rem_minmax(0,1fr)_auto] md:items-center md:py-6"
      >
        <div className="relative aspect-square overflow-hidden rounded-sm bg-surface sm:aspect-[4/3] md:aspect-[16/10]">
          {capa ? (
            <Image
              src={capa}
              alt={titulo}
              fill
              sizes="(max-width: 640px) 96px, (max-width: 768px) 144px, 208px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Buildings size={34} className="text-strong-line" aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 self-center">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {finalidadeLabels[imovel.finalidade]}
            </p>
            <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
              Ref. {imovel.id.slice(0, 8)}
            </span>
          </div>

          <h2 className="mt-1 truncate text-base font-semibold tracking-tight text-ink sm:text-lg">
            {titulo}
          </h2>
          {imovel.frase_destaque ? (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {imovel.frase_destaque}
            </p>
          ) : imovel.endereco_completo ? (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {imovel.endereco_completo}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {specs.map(({ icon: Icon, label, descricao }) => (
              <span key={descricao} className="flex items-center gap-1.5">
                <Icon size={14} aria-hidden />
                <span className="font-mono text-ink">{label}</span>
                <span className="sr-only"> {descricao}</span>
              </span>
            ))}
            <span className="hidden text-[11px] sm:inline">
              Atualizado em {formatDate(imovel.updated_at)}
            </span>
          </div>
        </div>

        <div className="col-span-2 flex items-end justify-between gap-4 border-t border-line pt-4 md:col-span-1 md:min-w-48 md:flex-col md:items-end md:border-0 md:pt-0 md:text-right">
          <div className="font-mono text-ink">
            {imovel.finalidade !== "locacao" ? (
              <p className="text-lg font-medium sm:text-xl">
                {formatCurrency(imovel.valor_venda)}
              </p>
            ) : null}
            {imovel.finalidade !== "venda" ? (
              <p
                className={
                  imovel.finalidade === "locacao"
                    ? "text-lg font-medium sm:text-xl"
                    : "mt-1 text-xs text-muted-foreground"
                }
              >
                {formatCurrency(imovel.valor_locacao)}
                <span className="text-xs font-normal text-muted-foreground"> /mês</span>
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <ImovelStatusDot status={imovel.status} />
            <ArrowRight
              size={17}
              className="text-strong-line transition-transform group-hover:translate-x-1 group-hover:text-primary"
              aria-hidden
            />
          </div>
        </div>
      </Link>
    </article>
  );
}
