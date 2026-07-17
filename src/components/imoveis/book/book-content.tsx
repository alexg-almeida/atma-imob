import { A4Page } from "@/components/imoveis/book/a4-page";
import { finalidadeLabels } from "@/lib/imoveis/constants";
import { formatCurrency } from "@/lib/format";
import type { Imovel, ImovelFoto } from "@/lib/supabase/types";

export type BookTemplate = "classico" | "compacto";

type BookImovel = Imovel & { tipo: { nome: string } | null };

function tituloImovel(imovel: BookImovel) {
  return [imovel.tipo?.nome ?? "Imóvel", imovel.cidade].filter(Boolean).join(" · ");
}

function valorPrincipal(imovel: Imovel) {
  if (imovel.finalidade === "locacao") {
    return imovel.valor_locacao != null
      ? `${formatCurrency(imovel.valor_locacao)} /mês`
      : null;
  }
  return imovel.valor_venda != null ? formatCurrency(imovel.valor_venda) : null;
}

function CapaPage({ imovel, capa }: { imovel: BookImovel; capa?: ImovelFoto }) {
  const valor = valorPrincipal(imovel);
  return (
    <A4Page padded={false} className="flex flex-col justify-end">
      {capa ? (
        // eslint-disable-next-line @next/next/no-img-element -- captura via html2canvas, não passa pelo otimizador do Next
        <img
          src={capa.url}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-surface" />
      )}
      {/* Gradiente via style inline (não classe Tailwind): as utilities de
          opacidade do Tailwind v4 geram cor em oklab(), que o html2canvas
          não sabe interpretar — usamos rgba() puro para a captura funcionar. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(34,34,34,0.9), rgba(34,34,34,0.2), rgba(34,34,34,0))",
        }}
      />

      <div className="relative flex items-center gap-2.5 p-14 pb-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/atma-mark-square.png"
          alt=""
          crossOrigin="anonymous"
          className="h-9 w-9"
        />
        <span className="text-sm font-semibold tracking-[0.28em] text-white uppercase">
          Atma
        </span>
      </div>

      <div className="relative space-y-3 p-14 pt-16">
        <p
          className="text-[13px] font-semibold tracking-[0.16em] uppercase"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          {finalidadeLabels[imovel.finalidade]}
        </p>
        <h1 className="text-5xl leading-tight font-bold text-white">
          {tituloImovel(imovel)}
        </h1>
        {imovel.frase_destaque ? (
          <p className="max-w-lg text-lg" style={{ color: "rgba(255,255,255,0.9)" }}>
            {imovel.frase_destaque}
          </p>
        ) : null}
        {valor ? (
          <p className="pt-3 font-mono text-2xl font-medium text-white">{valor}</p>
        ) : null}
      </div>
    </A4Page>
  );
}

function GaleriaClassicaPages({ fotos }: { fotos: ImovelFoto[] }) {
  return (
    <>
      {fotos.map((foto, index) => (
        <A4Page key={foto.id} padded={false}>
          <div className="relative h-[720px] w-full bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto.url}
              alt=""
              crossOrigin="anonymous"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between px-14 py-6">
            <p className="text-sm text-ink">
              {foto.destaque ?? `Foto ${index + 1}`}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {String(index + 1).padStart(2, "0")} / {String(fotos.length).padStart(2, "0")}
            </p>
          </div>
        </A4Page>
      ))}
    </>
  );
}

function GaleriaCompactaPages({ fotos }: { fotos: ImovelFoto[] }) {
  const porPagina = 6;
  const paginas: ImovelFoto[][] = [];
  for (let i = 0; i < fotos.length; i += porPagina) {
    paginas.push(fotos.slice(i, i + porPagina));
  }

  return (
    <>
      {paginas.map((grupo, pageIndex) => (
        <A4Page key={pageIndex}>
          <h2 className="border-b-2 border-ink pb-4 text-xl font-semibold tracking-tight text-ink">
            Galeria de fotos
          </h2>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {grupo.map((foto, index) => (
              <div key={foto.id}>
                <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto.url}
                    alt=""
                    crossOrigin="anonymous"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {foto.destaque ?? `Foto ${pageIndex * porPagina + index + 1}`}
                </p>
              </div>
            ))}
          </div>
        </A4Page>
      ))}
    </>
  );
}

function FechamentoPage({ imovel }: { imovel: BookImovel }) {
  const caracteristicas: { label: string; value: string }[] = [
    ...(imovel.area_interna != null
      ? [{ label: "Área interna", value: `${imovel.area_interna} m²` }]
      : []),
    ...(imovel.area_externa != null
      ? [{ label: "Área externa", value: `${imovel.area_externa} m²` }]
      : []),
    ...(imovel.quartos != null
      ? [{ label: "Quartos", value: String(imovel.quartos) }]
      : []),
    ...(imovel.suites != null
      ? [{ label: "Suítes", value: String(imovel.suites) }]
      : []),
    ...(imovel.banheiros != null
      ? [{ label: "Banheiros", value: String(imovel.banheiros) }]
      : []),
    ...(imovel.vagas != null
      ? [{ label: "Vagas", value: String(imovel.vagas) }]
      : []),
  ];

  return (
    <A4Page className="flex flex-col">
      <h2 className="border-b-2 border-ink pb-4 text-xl font-semibold tracking-tight text-ink">
        {tituloImovel(imovel)}
      </h2>

      {imovel.descricao ? (
        <p className="mt-6 text-sm leading-relaxed whitespace-pre-line text-ink">
          {imovel.descricao}
        </p>
      ) : null}

      {caracteristicas.length > 0 ? (
        <dl className="mt-8 grid grid-cols-4 gap-y-5 border-t border-line pt-6">
          {caracteristicas.map((item) => (
            <div key={item.label}>
              <dt className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {item.label}
              </dt>
              <dd className="mt-1 font-mono text-lg text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {imovel.diferenciais.length > 0 ? (
        <div className="mt-8 border-t border-line pt-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Diferenciais
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-x-6 gap-y-2">
            {imovel.diferenciais.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-ink">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t border-line pt-6">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/atma-mark-square.png"
            alt=""
            crossOrigin="anonymous"
            className="h-6 w-6"
          />
          <span className="text-xs font-semibold tracking-[0.2em] text-ink uppercase">
            Atma Consultoria Imobiliária
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {imovel.endereco_completo}
          {imovel.endereco_completo ? " · " : ""}
          {[imovel.cidade, imovel.estado].filter(Boolean).join(" - ")}
        </p>
      </div>
    </A4Page>
  );
}

export function BookContent({
  imovel,
  fotos,
  template,
}: {
  imovel: BookImovel;
  fotos: ImovelFoto[];
  template: BookTemplate;
}) {
  const capa = fotos.find((f) => f.capa) ?? fotos[0];
  const galeria = fotos.filter((f) => f.id !== capa?.id);

  return (
    <>
      <CapaPage imovel={imovel} capa={capa} />
      {template === "classico" ? (
        <GaleriaClassicaPages fotos={galeria} />
      ) : (
        <GaleriaCompactaPages fotos={galeria} />
      )}
      <FechamentoPage imovel={imovel} />
    </>
  );
}
