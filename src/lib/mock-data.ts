export type PropertyStatus = "Disponível" | "Reservado" | "Alugado" | "Vendido";

export type Property = {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  owner: string;
  value: number;
  area: number;
  status: PropertyStatus;
  updatedAt: string;
};

export const properties: Property[] = [
  {
    id: "AT-1042",
    title: "Cobertura Jardim das Palmeiras",
    neighborhood: "Jardim das Palmeiras",
    city: "Ribeirão Preto",
    owner: "Marcelo Andrade",
    value: 1850000,
    area: 210,
    status: "Disponível",
    updatedAt: "2026-07-14",
  },
  {
    id: "AT-1038",
    title: "Apartamento Vila Seixas",
    neighborhood: "Vila Seixas",
    city: "Ribeirão Preto",
    owner: "Camila Torres",
    value: 620000,
    area: 78,
    status: "Reservado",
    updatedAt: "2026-07-13",
  },
  {
    id: "AT-1031",
    title: "Casa Alto da Boa Vista",
    neighborhood: "Alto da Boa Vista",
    city: "Ribeirão Preto",
    owner: "Fernando Lucchesi",
    value: 980000,
    area: 260,
    status: "Alugado",
    updatedAt: "2026-07-12",
  },
  {
    id: "AT-1029",
    title: "Studio Higienópolis",
    neighborhood: "Higienópolis",
    city: "Ribeirão Preto",
    owner: "Atma Empreendimentos",
    value: 340000,
    area: 42,
    status: "Disponível",
    updatedAt: "2026-07-11",
  },
  {
    id: "AT-1024",
    title: "Sobrado Sumaré",
    neighborhood: "Sumaré",
    city: "Ribeirão Preto",
    owner: "Beatriz Onofre",
    value: 1120000,
    area: 305,
    status: "Vendido",
    updatedAt: "2026-07-09",
  },
  {
    id: "AT-1019",
    title: "Apartamento Nova Aliança",
    neighborhood: "Nova Aliança",
    city: "Ribeirão Preto",
    owner: "Rodrigo Salim",
    value: 495000,
    area: 65,
    status: "Alugado",
    updatedAt: "2026-07-08",
  },
  {
    id: "AT-1015",
    title: "Casa Terras de Sta. Rita",
    neighborhood: "Terras de Santa Rita",
    city: "Ribeirão Preto",
    owner: "Atma Empreendimentos",
    value: 1430000,
    area: 380,
    status: "Disponível",
    updatedAt: "2026-07-07",
  },
];

export const leadsPerMonth = [
  { month: "Fev", leads: 18 },
  { month: "Mar", leads: 24 },
  { month: "Abr", leads: 21 },
  { month: "Mai", leads: 29 },
  { month: "Jun", leads: 34 },
  { month: "Jul", leads: 31 },
];

export const portfolioBreakdown: { status: PropertyStatus; count: number }[] = [
  { status: "Disponível", count: 42 },
  { status: "Reservado", count: 9 },
  { status: "Alugado", count: 26 },
  { status: "Vendido", count: 13 },
];

export const kpis = [
  {
    label: "Imóveis ativos",
    value: "90",
    delta: "+6 no mês",
    trend: "up" as const,
  },
  {
    label: "Clientes na carteira",
    value: "214",
    delta: "+12 no mês",
    trend: "up" as const,
  },
  {
    label: "Contratos a vencer (30d)",
    value: "7",
    delta: "2 críticos",
    trend: "flat" as const,
  },
  {
    label: "Taxa de ocupação",
    value: "81%",
    delta: "+3 p.p.",
    trend: "up" as const,
  },
];

export const originOptions = [
  "Indicação",
  "Instagram",
  "Site Atma",
  "WhatsApp",
  "Portal imobiliário",
] as const;

export const interestOptions = properties.map((p) => `${p.id} · ${p.title}`);
