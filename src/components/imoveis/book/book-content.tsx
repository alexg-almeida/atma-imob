import { A4Page } from "@/components/imoveis/book/a4-page";
import { finalidadeLabels } from "@/lib/imoveis/constants";
import { formatCurrency } from "@/lib/format";
import type { Imovel, ImovelFoto } from "@/lib/supabase/types";

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

/**
 * Corta o texto num limite de caracteres, nunca por CSS (`line-clamp`) — o
 * html2canvas não respeita `-webkit-line-clamp` de forma confiável, então a
 * última linha visível saía cortada no meio, sobrepondo o conteúdo abaixo.
 * Truncar a string antes de renderizar garante que só o texto que cabe de
 * verdade é desenhado.
 */
function truncar(texto: string, maximo: number) {
  if (texto.length <= maximo) return texto;
  return `${texto.slice(0, maximo).trimEnd()}…`;
}

function Indicador({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[8px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm text-ink">{value}</dd>
    </div>
  );
}

function FotoGrid({
  fotos,
  recortes,
}: {
  fotos: ImovelFoto[];
  recortes: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {fotos.map((foto) => (
        <div
          key={foto.id}
          className="aspect-[4/3] w-full overflow-hidden rounded-sm bg-surface"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- captura via html2canvas, não passa pelo otimizador do Next */}
          <img
            src={recortes[foto.id] ?? foto.url}
            alt=""
            crossOrigin="anonymous"
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function BookPage({
  imovel,
  capa,
  fotosGrade,
  recortes,
}: {
  imovel: BookImovel;
  capa?: ImovelFoto;
  fotosGrade: ImovelFoto[];
  recortes: Record<string, string>;
}) {
  const valor = valorPrincipal(imovel);

  const indicadoresPrincipais: { label: string; value: string }[] = [
    ...(valor ? [{ label: "Valor", value: valor }] : []),
    ...(imovel.area_interna != null
      ? [{ label: "Área interna", value: `${imovel.area_interna} m²` }]
      : []),
    ...(imovel.quartos != null ? [{ label: "Quartos", value: String(imovel.quartos) }] : []),
    ...(imovel.suites != null ? [{ label: "Suítes", value: String(imovel.suites) }] : []),
    ...(imovel.banheiros != null
      ? [{ label: "Banheiros", value: String(imovel.banheiros) }]
      : []),
  ];

  return (
    <A4Page padded={false} className="flex flex-col">
      {/* Banner de capa: foto cheia (recortada em cover-fit, sem esticar) —
          o título fica em branco por cima para ter contraste. O logo aqui é
          só a marca (barras coloridas), não a logomarca completa com texto
          escuro: sobre uma foto o texto preto do logo completo pode ficar
          ilegível, então o nome "Atma" é escrito à parte, já em branco. */}
      <div className="relative h-[220px] shrink-0 overflow-hidden bg-bg">
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recortes[capa.id] ?? capa.url}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center justify-end gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/atma-mark-square.png"
              alt=""
              crossOrigin="anonymous"
              className="h-6 w-6"
            />
            <span className="text-sm font-semibold tracking-[0.28em] text-white uppercase">
              Atma
            </span>
          </div>
          <div>
            <p
              className="text-[11px] font-semibold tracking-[0.16em] uppercase"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {finalidadeLabels[imovel.finalidade]}
            </p>
            <h1 className="mt-1 text-3xl leading-tight font-bold tracking-tight text-white">
              {tituloImovel(imovel)}
            </h1>
            {imovel.endereco_completo ? (
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                {imovel.endereco_completo}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-10 pt-6 pb-8">
        {indicadoresPrincipais.length > 0 ? (
          <dl className="grid grid-cols-5 gap-4 border-y border-line py-4">
            {indicadoresPrincipais.map((item) => (
              <Indicador key={item.label} {...item} />
            ))}
          </dl>
        ) : null}

        {fotosGrade.length > 0 ? (
          <div className="mt-6">
            <FotoGrid fotos={fotosGrade} recortes={recortes} />
          </div>
        ) : null}

        <h2 className="mt-6 border-b-2 border-ink pb-2 text-sm font-semibold tracking-tight text-ink">
          {tituloImovel(imovel)}
        </h2>

        {imovel.descricao ? (
          <p className="mt-3 text-[11px] leading-relaxed whitespace-pre-line text-ink">
            {truncar(imovel.descricao, 420)}
          </p>
        ) : null}

        {imovel.diferenciais.length > 0 ? (
          <div className="mt-5 border-t border-line pt-5">
            <p className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Diferenciais
            </p>
            <ul className="mt-2 grid grid-cols-3 gap-x-6 gap-y-1.5">
              {imovel.diferenciais.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-ink">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/atma-mark-square.png"
              alt=""
              crossOrigin="anonymous"
              className="h-5 w-5"
            />
            <span className="text-[10px] font-semibold tracking-[0.18em] text-ink uppercase">
              Atma Consultoria Imobiliária
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {[imovel.cidade, imovel.estado].filter(Boolean).join(" - ")}
          </p>
        </div>
      </div>
    </A4Page>
  );
}

/**
 * Fotos usadas no book: capa (banner) + até 6 na grade — o book é sempre
 * uma página só, sem continuação. Quando há mais de 6 fotos na galeria,
 * prioriza as marcadas com `usar_no_book` (escolha manual na tela de fotos
 * do imóvel); caso nenhuma esteja marcada, usa as 6 primeiras por ordem.
 * Centralizado aqui para o botão de geração recortar (cover-fit) exatamente
 * essas fotos antes de capturar.
 */
export function fotosDoBook(fotos: ImovelFoto[]) {
  const capa = fotos.find((f) => f.capa) ?? fotos[0];
  const galeria = fotos.filter((f) => f.id !== capa?.id);
  const selecionadas = galeria.filter((f) => f.usar_no_book);
  const fonte = selecionadas.length > 0 ? selecionadas : galeria;
  return {
    capa,
    fotosGrade: fonte.slice(0, 6),
  };
}

export function BookContent({
  imovel,
  fotos,
  recortes,
}: {
  imovel: BookImovel;
  fotos: ImovelFoto[];
  recortes: Record<string, string>;
}) {
  const { capa, fotosGrade } = fotosDoBook(fotos);

  return <BookPage imovel={imovel} capa={capa} fotosGrade={fotosGrade} recortes={recortes} />;
}
