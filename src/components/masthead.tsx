"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  CaretDown,
  List,
  SignOut,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { navItems, adminNavItem } from "./nav-items";

const floatingPanel =
  "rounded-md border border-line bg-white shadow-float";

export function Masthead({
  userName,
  isAdmin = false,
}: {
  userName?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<"user" | null>(null);
  const [openNavHref, setOpenNavHref] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const items = isAdmin ? [...navItems, adminNavItem] : navItems;

  useEffect(() => {
    if (openPanel === null && openNavHref === null) return;
    function handleOutside(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
        setOpenNavHref(null);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [openPanel, openNavHref]);

  function itemIsActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  }

  function handleParentClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    hasChildren: boolean,
  ) {
    if (!hasChildren) return;
    const touchOnly = window.matchMedia("(hover: none)").matches;
    if (touchOnly && openNavHref !== href) {
      event.preventDefault();
      setOpenNavHref(href);
    }
  }

  return (
    <header ref={headerRef} className="relative z-40 border-b border-line bg-background">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-5 px-5 py-4 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Image
            src="/brand/atma-logo.png"
            alt="Atma Consultoria Imobiliária"
            width={763}
            height={257}
            priority
            className="h-11 w-[131px] shrink-0 aspect-[763/257] sm:h-12 sm:w-[143px]"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              aria-expanded={openPanel === "user"}
              aria-haspopup="menu"
              onClick={() => setOpenPanel(openPanel === "user" ? null : "user")}
              className="flex min-h-11 items-center gap-2 rounded-sm px-2 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-3"
            >
              <UserCircle size={22} className="text-muted-foreground" aria-hidden />
              <span className="hidden sm:block">
                <span className="block max-w-40 truncate text-sm font-semibold text-ink">
                  {userName ?? "Equipe Atma"}
                </span>
                <span className="block text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                  Equipe interna
                </span>
              </span>
              <CaretDown size={11} className="hidden text-muted-foreground sm:block" aria-hidden />
              <span className="sr-only">Abrir menu do usuário</span>
            </button>

            {openPanel === "user" ? (
              <div
                role="menu"
                className={`${floatingPanel} absolute top-full right-0 mt-2 w-60 p-2`}
              >
                <div className="border-b border-line px-3 py-2 sm:hidden">
                  <p className="truncate text-sm font-semibold text-ink">
                    {userName ?? "Equipe Atma"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Equipe interna</p>
                </div>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex min-h-11 w-full items-center gap-2 rounded-sm px-3 text-sm font-medium text-ink transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
                  >
                    <SignOut size={16} aria-hidden /> Sair do sistema
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex size-11 items-center justify-center rounded-sm border border-line text-ink transition-colors hover:border-strong-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
          >
            {mobileOpen ? <X size={19} aria-hidden /> : <List size={20} aria-hidden />}
            <span className="sr-only">{mobileOpen ? "Fechar menu" : "Abrir menu"}</span>
          </button>
        </div>
      </div>

      <nav className="mx-auto hidden max-w-6xl px-6 md:block" aria-label="Navegação principal">
        <ul className="-mb-px flex gap-8 whitespace-nowrap">
          {items.map((item) => {
            const isActive = itemIsActive(item.href);
            const isOpen = openNavHref === item.href;
            return (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  onClick={(event) => {
                    setMobileOpen(false);
                    handleParentClick(event, item.href, Boolean(item.children));
                  }}
                  aria-current={isActive ? "page" : undefined}
                  aria-expanded={item.children ? isOpen : undefined}
                  aria-haspopup={item.children ? "menu" : undefined}
                  className={`flex min-h-11 items-center gap-1.5 border-b-2 text-[13px] font-semibold tracking-[0.12em] uppercase transition-colors ${
                    isActive
                      ? "border-primary text-ink"
                      : "border-transparent text-muted-foreground hover:text-ink"
                  }`}
                >
                  {item.label}
                  {item.children ? (
                    <CaretDown
                      size={11}
                      aria-hidden
                      className={`transition-transform group-hover:rotate-180 group-focus-within:rotate-180 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  ) : null}
                </Link>

                {item.children ? (
                  <div
                    className={`pointer-events-none absolute top-full left-0 translate-y-1 pt-2 opacity-0 transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
                      isOpen ? "pointer-events-auto translate-y-0 opacity-100" : ""
                    }`}
                  >
                    <ul className={`${floatingPanel} min-w-64 p-2`}>
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => {
                              setOpenPanel(null);
                              setOpenNavHref(null);
                            }}
                            className="block rounded-sm px-3 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>

      {mobileOpen ? (
        <nav
          id="mobile-navigation"
          className="border-t border-line px-5 py-4 md:hidden"
          aria-label="Navegação principal"
        >
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.href} className="py-2">
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={itemIsActive(item.href) ? "page" : undefined}
                  className={`flex min-h-11 items-center text-[13px] font-semibold tracking-[0.1em] uppercase ${
                    itemIsActive(item.href) ? "text-primary" : "text-ink"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children ? (
                  <ul className="border-l border-line pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex min-h-10 items-center text-sm text-muted-foreground"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
