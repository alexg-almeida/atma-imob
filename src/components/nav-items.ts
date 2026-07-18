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
      { label: "Cadastrar imóvel", href: "/imoveis/novo" },
    ],
  },
  {
    label: "Leads",
    href: "/leads",
    children: [
      { label: "Todos os leads", href: "/leads" },
      { label: "Novo lead", href: "/leads/novo" },
    ],
  },
  {
    label: "Clientes",
    href: "/proprietarios",
    children: [
      { label: "Proprietários", href: "/proprietarios" },
      { label: "Cadastrar proprietário", href: "/proprietarios/novo" },
    ],
  },
  {
    label: "Parceiros",
    href: "/parceiros",
    children: [
      { label: "Todos os parceiros", href: "/parceiros" },
      { label: "Corretores", href: "/parceiros?tipo=corretor" },
      { label: "Captadores", href: "/parceiros?tipo=captador" },
      { label: "Cadastrar parceiro", href: "/parceiros/novo" },
    ],
  },
];

/** Só aparece no menu para quem tem permissão no módulo "core" (superadmin). */
export const adminNavItem: NavItem = {
  label: "Admin",
  href: "/admin/ficha-captacao",
  children: [
    { label: "Termo da ficha de captação", href: "/admin/ficha-captacao" },
  ],
};
