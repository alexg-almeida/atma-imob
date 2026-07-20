import { finalidadeLabels, statusLabels } from "@/lib/imoveis/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  substituirVariaveis,
  TERMO_CORPO_PADRAO,
  TERMO_TITULO_PADRAO,
} from "@/lib/pdf/ficha-captacao";
import type { BlocoDescriptor } from "@/lib/pdf/blocos";
import type { Imovel, Proprietario } from "@/lib/supabase/types";

export type { BlocoDescriptor };

export type ProprietarioVinculo = {
  proprietario: Proprietario;
  percentual_participacao: number | null;
  principal: boolean;
};

export type FichaDados = {
  imovel: Imovel;
  tipoNome: string;
  captadorNome: string | null;
  proprietarios: ProprietarioVinculo[];
  termoTitulo?: string | null;
  termoCorpo?: string | null;
};

function linha(valor: string | number | null | undefined): string {
  if (valor == null || valor === "") return "—";
  return String(valor);
}

// ---- Primitivos visuais ----

function Campo({ label, valor, mono }: { label: string; valor: string; mono?: boolean }) {
  return (
    <div className="border-b border-line pb-1.5">
      <p className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`mt-0.5 text-[11px] text-ink ${mono ? "font-mono" : ""}`}>{valor}</p>
    </div>
  );
}

function CamposGrid({
  campos,
  colunas = 3,
}: {
  campos: { label: string; valor: string; mono?: boolean; largo?: boolean }[];
  colunas?: number;
}) {
  return (
    <div
      className="grid gap-x-8 gap-y-4"
      style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
    >
      {campos.map((campo) => (
        <div key={campo.label} className={campo.largo ? "col-span-full" : ""}>
          <Campo label={campo.label} valor={campo.valor} mono={campo.mono} />
        </div>
      ))}
    </div>
  );
}

function SecaoTitulo({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
      {numero} · {titulo}
    </p>
  );
}

// ---- Blocos ----

function BlocoCabecalho({ imovel, tipoNome }: { imovel: Imovel; tipoNome: string }) {
  return (
    <div>
      <div className="flex items-end justify-between border-b-2 border-ink pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- captura via html2canvas */}
        <img src="/brand/atma-logo.png" alt="" crossOrigin="anonymous" className="h-9 w-auto" />
        <div className="text-right">
          <p className="text-base font-bold tracking-tight text-ink uppercase">
            Ficha de Captação
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            Nº ________ · Data ___/___/______
          </p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Gerada em {formatDate(new Date().toISOString())} · {tipoNome} ·{" "}
        {finalidadeLabels[imovel.finalidade]}
      </p>
    </div>
  );
}

function BlocoIdentificacaoAreas({
  imovel,
  captadorNome,
}: {
  imovel: Imovel;
  captadorNome: string | null;
}) {
  return (
    <div>
      <SecaoTitulo numero="2" titulo="Dados do imóvel" />
      <div className="mt-3">
        <Campo label="Endereço completo" valor={linha(imovel.endereco_completo)} />
      </div>
      <div className="mt-4">
        <CamposGrid
          campos={[
            {
              label: "Cidade / UF / CEP",
              valor: linha(
                [imovel.cidade, imovel.estado, imovel.cep].filter(Boolean).join(" · "),
              ),
            },
            { label: "Status", valor: statusLabels[imovel.status] },
            {
              label: "Inscrição imobiliária",
              valor: linha(imovel.inscricao_imobiliaria),
              mono: true,
            },
            { label: "Matrícula", valor: linha(imovel.numero_matricula), mono: true },
            {
              label: "Data de captação",
              valor: imovel.data_captacao ? formatDate(imovel.data_captacao) : "—",
              mono: true,
            },
            { label: "Captador", valor: linha(captadorNome) },
            {
              label: "Área interna",
              valor: imovel.area_interna != null ? `${imovel.area_interna} m²` : "—",
              mono: true,
            },
            {
              label: "Área externa",
              valor: imovel.area_externa != null ? `${imovel.area_externa} m²` : "—",
              mono: true,
            },
            {
              label: "Área do lote",
              valor: imovel.area_lote != null ? `${imovel.area_lote} m²` : "—",
              mono: true,
            },
            {
              label: "Quartos / Suítes",
              valor: `${linha(imovel.quartos)} / ${linha(imovel.suites)}`,
              mono: true,
            },
            { label: "Banheiros", valor: linha(imovel.banheiros), mono: true },
            {
              label: "Vagas",
              valor: linha(imovel.vagas) + (imovel.tipo_vaga ? ` (${imovel.tipo_vaga})` : ""),
              mono: true,
            },
            { label: "Andar", valor: linha(imovel.andar), mono: true },
            { label: "Piso de acabamento", valor: linha(imovel.piso_acabamento) },
            { label: "Fachada", valor: linha(imovel.fachada) },
          ]}
        />
      </div>
    </div>
  );
}

function BlocoValores({ imovel }: { imovel: Imovel }) {
  const campos = [
    ...(imovel.finalidade !== "locacao"
      ? [{ label: "Valor de venda", valor: formatCurrency(imovel.valor_venda), mono: true }]
      : []),
    ...(imovel.finalidade !== "venda"
      ? [{ label: "Valor de locação", valor: formatCurrency(imovel.valor_locacao), mono: true }]
      : []),
    { label: "Condomínio", valor: formatCurrency(imovel.valor_condominio), mono: true },
    {
      label: `IPTU mensal${imovel.repasse_iptu ? " (repassado)" : ""}`,
      valor: formatCurrency(imovel.iptu_mensal),
      mono: true,
    },
    {
      label: `Taxa de lixo${imovel.parcela_taxa_lixo ? ` (${imovel.parcela_taxa_lixo})` : ""}`,
      valor: formatCurrency(imovel.taxa_lixo),
      mono: true,
    },
    { label: "Outras taxas", valor: formatCurrency(imovel.outras_taxas), mono: true },
    {
      label: "Comissão",
      valor: imovel.comissao_percentual != null ? `${imovel.comissao_percentual}%` : "—",
      mono: true,
    },
  ];
  return (
    <div>
      <SecaoTitulo numero="3" titulo="Valores e encargos" />
      <div className="mt-3">
        <CamposGrid campos={campos} />
      </div>
    </div>
  );
}

function BlocoCaracteristicas({ imovel }: { imovel: Imovel }) {
  const listas: [string, string[]][] = [
    ["Comodidades internas", imovel.comodidades_internas],
    ["Instalações", imovel.instalacoes],
    ["Lazer", imovel.lazer],
    ["Diferenciais", imovel.diferenciais],
  ];
  const comConteudo = listas.filter(([, itens]) => itens.length > 0);
  if (comConteudo.length === 0) return null;
  return (
    <div>
      <SecaoTitulo numero="4" titulo="Características" />
      <div className="mt-3 space-y-3">
        {comConteudo.map(([label, itens]) => (
          <div key={label} className="border-b border-line pb-1.5">
            <p className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-0.5 text-[11px] text-ink">{itens.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlocoProprietarioPrincipal({ proprietario }: { proprietario: Proprietario }) {
  return (
    <div>
      <SecaoTitulo numero="1" titulo="Dados do proprietário" />
      <div className="mt-3">
        <CamposGrid
          colunas={2}
          campos={[
            { label: "Nome completo", valor: linha(proprietario.nome_completo), largo: true },
            { label: "CPF/CNPJ", valor: linha(proprietario.cpf), mono: true },
            {
              label: "RG / Órgão emissor",
              valor: linha(
                [proprietario.doc_identidade_numero, proprietario.doc_identidade_orgao_exp]
                  .filter(Boolean)
                  .join(" · "),
              ),
              mono: true,
            },
            { label: "Estado civil", valor: linha(proprietario.estado_civil) },
            {
              label: "Endereço residencial",
              valor: linha(proprietario.endereco_completo),
              largo: true,
            },
            {
              label: "Telefone / WhatsApp",
              valor: linha(proprietario.whatsapp ?? proprietario.telefone),
              mono: true,
            },
            { label: "E-mail", valor: linha(proprietario.email) },
            { label: "Profissão", valor: linha(proprietario.profissao) },
          ]}
        />
      </div>
    </div>
  );
}

function LinhaCoProprietario({ vinculo }: { vinculo: ProprietarioVinculo }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-1.5 text-[11px] text-ink">
      <span>{vinculo.proprietario.nome_completo}</span>
      <span className="font-mono text-muted-foreground">{linha(vinculo.proprietario.cpf)}</span>
      <span className="font-mono">
        {vinculo.percentual_participacao != null ? `${vinculo.percentual_participacao}%` : "—"}
      </span>
    </div>
  );
}

function BlocoCoProprietariosLabelEPrimeiro({ primeiro }: { primeiro: ProprietarioVinculo }) {
  return (
    <div>
      <p className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        Demais proprietários vinculados
      </p>
      <div className="mt-2">
        <LinhaCoProprietario vinculo={primeiro} />
      </div>
    </div>
  );
}

function BlocoObservacoesTitulo({ texto }: { texto: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        Observações
      </p>
      <p className="mt-2 text-[11px] leading-relaxed whitespace-pre-line text-ink">{texto}</p>
    </div>
  );
}

function BlocoTermoTitulo({ titulo }: { titulo: string }) {
  return (
    <h2 className="text-center text-base font-bold tracking-tight text-ink uppercase">
      {titulo}
    </h2>
  );
}

function BlocoTermoRecap({
  titulo,
  campos,
}: {
  titulo: string;
  campos: { label: string; valor: string }[];
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {titulo}
      </p>
      <div className="mt-2 space-y-1.5">
        {campos.map((campo) => (
          <div key={campo.label} className="flex gap-2 text-[11px] text-ink">
            <span className="shrink-0 font-semibold">{campo.label}:</span>
            <span className="whitespace-pre-line">{campo.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlocoTermoClausula({ texto }: { texto: string }) {
  const linhas = texto.split("\n").filter((l) => l.trim() !== "");
  const ehClausula = /^\d+\.\s/.test(linhas[0] ?? "");
  return (
    <div className="space-y-1">
      {linhas.map((linhaTexto, index) => (
        <p
          key={index}
          className={`text-[11px] leading-relaxed text-ink ${
            ehClausula && index === 0 ? "font-semibold" : ""
          }`}
        >
          {linhaTexto}
        </p>
      ))}
    </div>
  );
}

function BlocoAssinaturas({ local, hoje }: { local: string; hoje: string }) {
  return (
    <div>
      <p className="text-[11px] text-ink">
        <span className="font-semibold">Local e Data: </span>
        {local}, {hoje}
      </p>
      <div className="mt-10 grid grid-cols-2 gap-10">
        <div className="border-t border-line pt-2 text-center text-[10px] text-muted-foreground">
          Assinatura do(a) Proprietário(a)
        </div>
        <div className="border-t border-line pt-2 text-center text-[10px] text-muted-foreground">
          Assinatura do Corretor/Imobiliária
        </div>
      </div>
    </div>
  );
}

/**
 * Monta a lista ordenada de blocos da ficha — fonte única de verdade do
 * conteúdo, consumida tanto pela passada de medição quanto pelo render
 * final (`use-ficha-pdf.ts`), garantindo que as duas nunca divirjam.
 */
export function montarBlocosDaFicha(dados: FichaDados): BlocoDescriptor[] {
  const { imovel, tipoNome, captadorNome, proprietarios } = dados;
  const termoTitulo = dados.termoTitulo || TERMO_TITULO_PADRAO;
  const termoCorpo = dados.termoCorpo || TERMO_CORPO_PADRAO;

  const principal = proprietarios.find((v) => v.principal) ?? proprietarios[0] ?? null;
  const coProprietarios = proprietarios.filter((v) => v !== principal);

  const blocos: BlocoDescriptor[] = [];

  blocos.push({ id: "cabecalho", node: <BlocoCabecalho imovel={imovel} tipoNome={tipoNome} /> });
  blocos.push({
    id: "identificacao-areas",
    node: <BlocoIdentificacaoAreas imovel={imovel} captadorNome={captadorNome} />,
  });
  blocos.push({ id: "valores", node: <BlocoValores imovel={imovel} /> });

  const temCaracteristicas = [
    imovel.comodidades_internas,
    imovel.instalacoes,
    imovel.lazer,
    imovel.diferenciais,
  ].some((l) => l.length > 0);
  if (temCaracteristicas) {
    blocos.push({ id: "caracteristicas", node: <BlocoCaracteristicas imovel={imovel} /> });
  }

  if (principal) {
    blocos.push({
      id: "proprietario-principal",
      node: <BlocoProprietarioPrincipal proprietario={principal.proprietario} />,
    });
  }

  if (coProprietarios.length > 0) {
    blocos.push({
      id: "co-proprietarios-label",
      node: <BlocoCoProprietariosLabelEPrimeiro primeiro={coProprietarios[0]} />,
    });
    coProprietarios.slice(1).forEach((vinculo, index) => {
      blocos.push({
        id: `co-proprietario-${index}`,
        node: <LinhaCoProprietario vinculo={vinculo} />,
      });
    });
  }

  if (imovel.observacoes) {
    const paragrafos = imovel.observacoes
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragrafos.length > 0) {
      blocos.push({
        id: "observacoes-0",
        node: <BlocoObservacoesTitulo texto={paragrafos[0]} />,
      });
      paragrafos.slice(1).forEach((texto, index) => {
        blocos.push({
          id: `observacoes-${index + 1}`,
          node: (
            <p className="text-[11px] leading-relaxed whitespace-pre-line text-ink">{texto}</p>
          ),
        });
      });
    }
  }

  // Termo de autorização — sempre começa em página nova.
  const descricaoImovel =
    imovel.descricao ||
    `${tipoNome} para ${finalidadeLabels[imovel.finalidade].toLowerCase()}${
      imovel.cidade ? ` em ${imovel.cidade}` : ""
    }`;
  const variaveis: Record<string, string> = {
    proprietario_nome: principal?.proprietario.nome_completo ?? "",
    proprietario_cpf: principal?.proprietario.cpf ?? "",
    proprietario_rg: principal?.proprietario.doc_identidade_numero ?? "",
    proprietario_endereco: principal?.proprietario.endereco_completo ?? "",
    imovel_endereco: imovel.endereco_completo ?? "",
    imovel_matricula: imovel.numero_matricula ?? "",
    imovel_descricao: descricaoImovel,
    corretor_nome: "Atma Consultoria Imobiliária",
    comissao_percentual:
      imovel.comissao_percentual != null ? String(imovel.comissao_percentual) : "______",
    local: "Ribeirão Preto",
    hoje: new Date().toLocaleDateString("pt-BR"),
  };

  blocos.push({
    id: "termo-titulo",
    node: <BlocoTermoTitulo titulo={termoTitulo} />,
    forcePageBreakBefore: true,
  });

  blocos.push({
    id: "termo-recap-proprietario",
    node: (
      <BlocoTermoRecap
        titulo="Proprietário(a)"
        campos={[
          { label: "Nome", valor: linha(principal?.proprietario.nome_completo) },
          { label: "CPF/CNPJ", valor: linha(principal?.proprietario.cpf) },
          { label: "RG", valor: linha(principal?.proprietario.doc_identidade_numero) },
          { label: "Endereço", valor: linha(principal?.proprietario.endereco_completo) },
        ]}
      />
    ),
  });
  blocos.push({
    id: "termo-recap-imovel",
    node: (
      <BlocoTermoRecap
        titulo="Imóvel"
        campos={[
          { label: "Endereço", valor: linha(imovel.endereco_completo) },
          { label: "Matrícula", valor: linha(imovel.numero_matricula) },
          { label: "Descrição", valor: descricaoImovel },
        ]}
      />
    ),
  });
  blocos.push({
    id: "termo-recap-corretor",
    node: (
      <BlocoTermoRecap
        titulo="Corretor/Imobiliária"
        campos={[
          { label: "Nome/Razão Social", valor: "Atma Consultoria Imobiliária" },
          { label: "CRECI/CNPJ", valor: "—" },
        ]}
      />
    ),
  });

  const corpoFinal = substituirVariaveis(termoCorpo, variaveis);
  corpoFinal
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((texto, index) => {
      blocos.push({ id: `termo-clausula-${index}`, node: <BlocoTermoClausula texto={texto} /> });
    });

  blocos.push({
    id: "assinaturas",
    node: <BlocoAssinaturas local={variaveis.local} hoje={variaveis.hoje} />,
  });

  return blocos;
}
