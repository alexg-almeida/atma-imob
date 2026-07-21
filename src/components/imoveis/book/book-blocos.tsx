import { finalidadeLabels } from "@/lib/imoveis/constants";
import { formatCurrency } from "@/lib/format";
import type { BlocoDescriptor } from "@/lib/pdf/blocos";
import type { Imovel, ImovelFoto } from "@/lib/supabase/types";

export type BookImovel = Imovel & { tipo: { nome: string } | null };

export type BookDados = {
  imovel: BookImovel;
  capa?: ImovelFoto;
  fotosGrade: ImovelFoto[];
  recortes: Record<string, string>;
};

/**
 * Altura total do cabeçalho da página 1 (masthead + foto + faixa de
 * título), seguindo a referência aprovada: ~35% da altura do A4. Usada
 * também por `gerar-book-button.tsx` como altura alvo do recorte da foto
 * de capa — o recorte precisa ter EXATAMENTE a proporção desta caixa
 * (794×390), senão o html2canvas (que ignora `object-fit` e estica a
 * imagem até preencher o container) deforma a foto. Com as proporções
 * idênticas, esticar até preencher = exibir sem distorção.
 */
export const BOOK_BANNER_ALTURA_PX = 390;

/** Fundo escuro das faixas sobre a foto (masthead e título) — slate quase opaco, como na referência. */
const FAIXA_ESCURA = "rgba(15, 23, 42, 0.82)";

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

/** Cabeçalho de seção da referência: rótulo mono azul espaçado + régua grossa embaixo. */
function TituloSecao({ children }: { children: string }) {
  return (
    <div>
      <h2 className="font-mono text-[11px] font-semibold tracking-[0.22em] text-primary uppercase">
        {children}
      </h2>
      <div className="mt-2 border-b-2 border-ink" />
    </div>
  );
}

/**
 * Cabeçalho da página 1, calcado na referência: uma única composição com a
 * foto de capa ao fundo (recortada em cover-fit ANTES da captura, na
 * proporção exata da caixa — nunca esticada), masthead escuro no topo
 * (logo + referência do book) e faixa escura na base com categoria,
 * título, endereço e valor. A foto fica limpa e visível só na banda do
 * meio. O logo completo (texto preto) não funciona sobre foto escura,
 * então a marca é recomposta em branco: ATMA + barras + descritor.
 */
function BlocoHeader({
  imovel,
  capa,
  recortes,
}: {
  imovel: BookImovel;
  capa?: ImovelFoto;
  recortes: Record<string, string>;
}) {
  const valor = valorPrincipal(imovel);
  const referencia = imovel.id.slice(0, 8).toUpperCase();

  return (
    <div
      className="relative shrink-0 overflow-hidden bg-ink"
      style={{ height: BOOK_BANNER_ALTURA_PX }}
    >
      {capa ? (
        // eslint-disable-next-line @next/next/no-img-element -- captura via html2canvas
        <img
          src={recortes[capa.id] ?? capa.url}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      <div className="absolute inset-x-0 top-0" style={{ background: FAIXA_ESCURA }}>
        <div className="flex items-center justify-between px-10 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-[0.06em] text-white">ATMA</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/atma-mark.png"
              alt=""
              crossOrigin="anonymous"
              className="h-7 w-auto"
            />
            <span
              className="text-[8px] leading-[1.3] font-semibold tracking-[0.14em] uppercase"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              Consultoria
              <br />
              Imobiliária
            </span>
          </div>
          <p
            className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Book do imóvel · Ref. {referencia}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0" style={{ background: FAIXA_ESCURA }}>
        <div className="flex items-end justify-between gap-8 px-10 py-6">
          <div className="min-w-0">
            <p
              className="font-mono text-[10px] font-semibold tracking-[0.24em] uppercase"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {[imovel.tipo?.nome, finalidadeLabels[imovel.finalidade]]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h1 className="mt-1.5 text-[26px] leading-tight font-bold tracking-tight text-white">
              {tituloImovel(imovel)}
            </h1>
            {imovel.endereco_completo ? (
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                {imovel.endereco_completo}
              </p>
            ) : null}
          </div>
          {valor ? (
            <div className="shrink-0 pb-0.5 text-right">
              <p
                className="font-mono text-[10px] font-semibold tracking-[0.24em] uppercase"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Valor
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-white">{valor}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Faixa de indicadores da referência: caixas com bordas finas, rótulo mono pequeno + valor em destaque. */
function BlocoIndicadores({ imovel }: { imovel: Imovel }) {
  const dormitorios = (imovel.quartos ?? 0) + (imovel.suites ?? 0);
  const itens: { label: string; value: string }[] = [
    ...(imovel.area_interna != null
      ? [{ label: "Área útil", value: `${imovel.area_interna} m²` }]
      : []),
    ...(dormitorios > 0 ? [{ label: "Dormitórios", value: String(dormitorios) }] : []),
    ...(imovel.suites != null ? [{ label: "Suítes", value: String(imovel.suites) }] : []),
    ...(imovel.banheiros != null
      ? [{ label: "Banheiros", value: String(imovel.banheiros) }]
      : []),
    ...(imovel.vagas != null ? [{ label: "Vagas", value: String(imovel.vagas) }] : []),
    ...(imovel.valor_condominio != null
      ? [{ label: "Condomínio", value: formatCurrency(imovel.valor_condominio) }]
      : []),
  ];
  if (itens.length === 0) return null;
  const colunas = Math.min(itens.length, 3);
  return (
    <dl
      className="grid border border-line"
      style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
    >
      {itens.map((item, index) => (
        <div
          key={item.label}
          className="px-4 py-3"
          style={{
            borderLeft: index % colunas === 0 ? undefined : "1px solid var(--color-line)",
            borderTop: index >= colunas ? "1px solid var(--color-line)" : undefined,
          }}
        >
          <dt className="font-mono text-[9px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {item.label}
          </dt>
          <dd className="mt-1.5 text-base font-semibold tracking-tight text-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function BlocoSobreTitulo({ texto }: { texto: string }) {
  return (
    <div>
      <TituloSecao>Sobre o imóvel</TituloSecao>
      <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink">{texto}</p>
    </div>
  );
}

function FotoLinha({
  fotos,
  recortes,
}: {
  fotos: ImovelFoto[];
  recortes: Record<string, string>;
}) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${fotos.length}, minmax(0, 1fr))` }}
    >
      {fotos.map((foto) => (
        <div key={foto.id} className="aspect-[4/3] w-full overflow-hidden rounded-sm bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element -- captura via html2canvas */}
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

function BlocoFotos({
  fotos,
  recortes,
  mostrarTitulo,
}: {
  fotos: ImovelFoto[];
  recortes: Record<string, string>;
  mostrarTitulo: boolean;
}) {
  return (
    <div>
      {mostrarTitulo ? <TituloSecao>Fotos</TituloSecao> : null}
      <div className={mostrarTitulo ? "mt-3" : ""}>
        <FotoLinha fotos={fotos} recortes={recortes} />
      </div>
    </div>
  );
}

function BlocoContato() {
  return (
    <div className="border-y border-line bg-surface px-6 py-5">
      <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
        Próximo passo
      </p>
      <div className="mt-2 flex items-end justify-between gap-8">
        <div>
          <p className="text-lg font-semibold tracking-tight text-ink">
            Agende uma visita com a equipe Atma.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Atendimento consultivo para encontrar o imóvel certo para você.
          </p>
        </div>
        <p className="shrink-0 text-xs font-semibold tracking-[0.12em] text-ink uppercase">
          Atma Consultoria Imobiliária
        </p>
      </div>
    </div>
  );
}

function BlocoDiferenciais({ itens }: { itens: string[] }) {
  return (
    <div>
      <TituloSecao>Diferenciais</TituloSecao>
      <ul className="mt-3 grid grid-cols-3 gap-x-6 gap-y-1.5">
        {itens.map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-ink">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Monta a lista ordenada de blocos do Book — fonte única de verdade do
 * conteúdo, consumida tanto pela passada de medição quanto pelo render
 * final (`use-book-pdf.ts`). A descrição e os diferenciais aparecem por
 * inteiro — se não couberem numa página, o empacotador
 * (`src/lib/pdf/blocos.ts`) simplesmente continua na próxima.
 */
export function montarBlocosDoBook(dados: BookDados): BlocoDescriptor[] {
  const { imovel, capa, fotosGrade, recortes } = dados;
  const blocos: BlocoDescriptor[] = [
    {
      id: "banner",
      node: <BlocoHeader imovel={imovel} capa={capa} recortes={recortes} />,
    },
  ];

  blocos.push({ id: "indicadores", node: <BlocoIndicadores imovel={imovel} /> });

  if (imovel.descricao) {
    const paragrafos = imovel.descricao
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragrafos.length > 0) {
      blocos.push({ id: "sobre-0", node: <BlocoSobreTitulo texto={paragrafos[0]} /> });
      paragrafos.slice(1).forEach((texto, index) => {
        blocos.push({
          id: `sobre-${index + 1}`,
          node: (
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink">{texto}</p>
          ),
        });
      });
    }
  }

  if (fotosGrade.length > 0) {
    for (let inicio = 0; inicio < fotosGrade.length; inicio += 2) {
      const indice = inicio / 2;
      blocos.push({
        id: `fotos-${indice}`,
        node: (
          <BlocoFotos
            fotos={fotosGrade.slice(inicio, inicio + 2)}
            recortes={recortes}
            mostrarTitulo={indice === 0}
          />
        ),
      });
    }
  }

  if (imovel.diferenciais.length > 0) {
    blocos.push({ id: "diferenciais", node: <BlocoDiferenciais itens={imovel.diferenciais} /> });
  }


  blocos.push({ id: "contato", node: <BlocoContato /> });

  return blocos;
}
