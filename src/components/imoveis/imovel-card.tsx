import Image from "next/image";
import Link from "next/link";
import {
  Bathtub,
  Bed,
  Buildings,
  Car,
  Ruler,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { ImovelStatusDot } from "@/components/imoveis/imovel-status";
import { finalidadeLabels } from "@/lib/imoveis/constants";
import { formatCurrency } from "@/lib/format";
import type { Imovel } from "@/lib/supabase/types";

export type ImovelListItem = Imovel & {
  tipo: { nome: string } | null;
  fotos: { url: string; capa: boolean; ordem: number; ativo: boolean }[];
};

function coverUrl(imovel: ImovelListItem) {
  const ativas = imovel.fotos
    .filter((f) => f.ativo)
    .sort((a, b) => a.ordem - b.ordem);
  return (ativas.find((f) => f.capa) ?? ativas[0])?.url ?? null;
}

export function ImovelCard({ imovel }: { imovel: ImovelListItem }) {
  const capa = coverUrl(imovel);
  const titulo = [imovel.tipo?.nome ?? "Imóvel", imovel.cidade]
    .filter(Boolean)
    .join(" · ");

  // `quartos` e `suites` são campos independentes no cadastro (quartos
  // comuns + suítes, somando o total de dormitórios) — na carteira atual a
  // maioria dos imóveis só tem `suites` preenchido, então olhar apenas
  // `quartos` deixava o card sem contagem de dormitório e fazia o primeiro
  // número visível ser o de banheiros, que se lê como quartos.
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
    (s): s is { icon: typeof Bed; label: string; descricao: string } =>
      s !== null,
  );

  return (
    <Link
      href={`/imoveis/${imovel.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <Card className="h-full gap-0 rounded-md py-0 ring-line transition-shadow duration-150 group-hover:shadow-float">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-md bg-surface">
          {capa ? (
            <Image
              src={capa}
              alt={titulo}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Buildings size={40} className="text-strong-line" aria-hidden />
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {finalidadeLabels[imovel.finalidade]}
            </p>
            <h3 className="mt-1 font-semibold text-ink">{titulo}</h3>
            {imovel.frase_destaque ? (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {imovel.frase_destaque}
              </p>
            ) : null}
          </div>

          <div className="font-mono text-ink">
            {imovel.finalidade !== "locacao" ? (
              <p className="text-lg font-medium">
                {formatCurrency(imovel.valor_venda)}
              </p>
            ) : null}
            {imovel.finalidade !== "venda" ? (
              <p
                className={
                  imovel.finalidade === "locacao"
                    ? "text-lg font-medium"
                    : "text-xs text-muted-foreground"
                }
              >
                {formatCurrency(imovel.valor_locacao)}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  /mês
                </span>
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {specs.map(({ icon: Icon, label, descricao }, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1"
                  title={`${label} ${descricao}`}
                >
                  <Icon size={14} aria-hidden />
                  <span className="font-mono">
                    {label}
                    <span className="sr-only"> {descricao}</span>
                  </span>
                </span>
              ))}
            </div>
            <ImovelStatusDot status={imovel.status} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
