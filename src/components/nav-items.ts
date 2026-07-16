export type NavChild = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

export const navItems: NavItem[] = [
  { label: "Início", href: "/" },
  {
    label: "Imóveis",
    href: "/imoveis",
    children: [
      { label: "Todos os imóveis", href: "/imoveis" },
      { label: "Disponíveis", href: "/imoveis/disponiveis" },
      { label: "Em negociação", href: "/imoveis/negociacao" },
      { label: "Cadastrar imóvel", href: "/imoveis/novo" },
    ],
  },
  {
    label: "Clientes",
    href: "/clientes",
    children: [
      { label: "Carteira de clientes", href: "/clientes" },
      { label: "Leads", href: "/clientes/leads" },
      { label: "Proprietários", href: "/clientes/proprietarios" },
      { label: "Novo contato", href: "/clientes/novo" },
    ],
  },
  {
    label: "Contratos",
    href: "/contratos",
    children: [
      { label: "Contratos ativos", href: "/contratos" },
      { label: "A vencer (30 dias)", href: "/contratos/a-vencer" },
      { label: "Encerrados", href: "/contratos/encerrados" },
      { label: "Novo contrato", href: "/contratos/novo" },
    ],
  },
  {
    label: "Agenda",
    href: "/agenda",
    children: [
      { label: "Visitas agendadas", href: "/agenda" },
      { label: "Compromissos", href: "/agenda/compromissos" },
      { label: "Agendar visita", href: "/agenda/nova-visita" },
    ],
  },
];
