"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { CaretDown, MagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { navItems } from "./nav-items";

const glassPanel =
  "rounded-2xl border border-white/50 bg-white/35 backdrop-blur-[28px] backdrop-saturate-200 " +
  "bg-gradient-to-b from-white/60 to-white/20 " +
  "shadow-[0_20px_48px_rgba(34,34,34,0.20),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.2)]";

const panelVisible =
  "pointer-events-auto translate-y-0 opacity-100";

export function Masthead({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const [openHref, setOpenHref] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (openHref === null) return;
    function handleOutside(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenHref(null);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [openHref]);

  function handleParentClick(event: MouseEvent, href: string, hasChildren: boolean) {
    if (!hasChildren) return;
    const touchOnly = window.matchMedia("(hover: none)").matches;
    if (touchOnly && openHref !== href) {
      event.preventDefault();
      setOpenHref(href);
    }
  }

  return (
    <header className="relative z-40 border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 pt-7 pb-5">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/brand/atma-logo.png"
            alt="Atma Consultoria Imobiliária"
            width={763}
            height={257}
            priority
            className="h-12 w-[143px] shrink-0 aspect-[763/257]"
          />
        </Link>

        <div className="flex items-center gap-5">
          <label className="hidden items-center gap-2 border-b border-line pb-1 focus-within:border-primary md:flex">
            <MagnifyingGlass size={15} className="text-muted-foreground" aria-hidden />
            <input
              type="search"
              placeholder="Buscar imóvel, cliente, contrato…"
              className="w-56 bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="text-right">
            <p className="text-sm font-semibold text-ink">
              {userName ?? "Equipe Atma"}
            </p>
            <p className="text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              Equipe interna
            </p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Sair"
              aria-label="Sair"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-muted-foreground transition-colors duration-150 hover:border-strong-line hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <SignOut size={15} aria-hidden />
            </button>
          </form>
        </div>
      </div>

      <nav
        ref={navRef}
        className="mx-auto max-w-6xl px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-lg:overflow-x-auto lg:overflow-visible"
      >
        <ul className="-mb-px flex gap-8 whitespace-nowrap">
          {navItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isOpen = openHref === item.href;
            const isActive =
              pathname === item.href ||
              (item.children?.some((child) => child.href === pathname) ?? false);

            return (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  aria-haspopup={hasChildren ? "menu" : undefined}
                  onClick={(event) => handleParentClick(event, item.href, hasChildren)}
                  className={`-mt-4 flex items-center gap-1.5 border-b-2 pt-4 pb-3 text-[13px] font-semibold tracking-[0.12em] uppercase transition-colors duration-150 ease-out ${
                    isActive
                      ? "border-primary text-ink"
                      : "border-transparent text-muted-foreground hover:text-ink"
                  }`}
                >
                  {item.label}
                  {hasChildren ? (
                    <CaretDown
                      size={11}
                      aria-hidden
                      className={`transition-transform duration-200 ease-out group-hover:rotate-180 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  ) : null}
                </Link>

                {item.children ? (
                  <div
                    className={`pointer-events-none absolute top-full left-0 pt-2 opacity-0 transition-all duration-200 ease-out translate-y-1 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
                      isOpen ? panelVisible : ""
                    }`}
                  >
                    <ul className={`${glassPanel} min-w-60 p-2`}>
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setOpenHref(null)}
                            className="block rounded-xl px-3.5 py-3 text-sm font-medium tracking-normal text-ink normal-case transition-colors duration-150 ease-out hover:bg-white/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:bg-white/70 focus-visible:outline-none"
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
    </header>
  );
}
