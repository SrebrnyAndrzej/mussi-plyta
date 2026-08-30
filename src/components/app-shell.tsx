"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { copy, firma, kontrahentDemo, progiRabatowe } from "@/config/brief";
import { funkcje } from "@/config/brief";
import { portalNavigation } from "@/data/portal-demo";
import { warehouseNavigation } from "@/data/warehouse-demo";
import { MussiLogo } from "@/components/mussi-logo";
import { Ikona, type NazwaIkony } from "@/components/ikona";
import { CartIndicator } from "@/components/cart-indicator";
import { BramkaSesji } from "@/components/bramka-sesji";
import { MiniKoszyk } from "@/components/mini-koszyk";

const productLinks = [
  { href: "/panel", label: "Pulpit" },
  { href: "/projekty/palmowa", label: "Projekty" },
  { href: "/katalog", label: copy.wspolne.katalog },
  { href: "/kreator", label: copy.wspolne.kreator },
  { href: "/zamowienia", label: "Zamówienia" },
] as const;

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  if (href === "/panel") return pathname === href;
  if (href === "/hurtownia") return pathname === href;
  return pathname.startsWith(href);
}

function AccountBadge() {
  const prog = progiRabatowe.find((item) => item.kod === kontrahentDemo.kodProgu);

  return <details className="group relative"><summary className="flex cursor-pointer list-none items-center gap-3 rounded-ctl [&::-webkit-details-marker]:hidden"><span className="grid size-10 place-items-center rounded-full bg-accent font-mono text-xs font-semibold text-white">SN</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{kontrahentDemo.nazwa}</p><p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{prog?.kod} · {Math.round((prog?.rabat ?? 0) * 100)}%</p></div></summary><div className="absolute bottom-[calc(100%+12px)] left-0 w-full rounded-ctl bg-surface p-2 ring-1 ring-hair shadow-[var(--lift)]"><Link href="/wylogowano" className="block rounded-ctl px-3 py-2 text-xs font-semibold text-accent-ink hover:bg-danger-paper">Wyloguj</Link></div></details>;
}

function WarehouseAccount() {
  return <details className="group relative"><summary className="flex cursor-pointer list-none items-center gap-3 rounded-ctl [&::-webkit-details-marker]:hidden"><span className="grid size-10 place-items-center rounded-full bg-ink font-mono text-xs font-semibold text-white">MO</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">Magazyn · Operator</p><p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Zmiana dzienna</p></div></summary><div className="absolute bottom-[calc(100%+12px)] left-0 w-full rounded-ctl bg-surface p-2 ring-1 ring-hair shadow-[var(--lift)]"><Link href="/panel" className="block rounded-ctl px-3 py-2 text-xs font-semibold text-ink hover:bg-paper">Widok klienta</Link><Link href="/wylogowano" className="block rounded-ctl px-3 py-2 text-xs font-semibold text-accent-ink hover:bg-danger-paper">Wyloguj</Link></div></details>;
}

/**
 * Publiczne w portalu są wyłącznie kategorie asortymentu. Reszta, czyli panel,
 * koszyk, kreator, projekty, zamówienia i zespół, pokazuje ceny kontrahenta
 * albo jego dokumenty, więc wymaga sesji.
 */
const TRASY_PUBLICZNE = ["/katalog"];

function PortalShell({ children, pathname }: { children: ReactNode; pathname: string }) {
  const trasaPubliczna = TRASY_PUBLICZNE.some((t) => pathname === t || pathname.startsWith(`${t}/`));
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[228px_minmax(0,1fr)]">
      <a href="#main-content" className="fixed left-4 top-3 z-50 -translate-y-20 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0">
        {copy.wspolne.pominNawigacje}
      </a>
      <aside className="sticky top-0 z-30 hidden h-screen border-r border-hair bg-surface lg:flex lg:flex-col">
        <Link href="/" aria-label={`${firma.nazwa}, strona główna`} className="pressable mx-5 mt-6 rounded-ctl p-1.5"><MussiLogo priority /></Link>
        <nav aria-label={copy.wspolne.portal} className="mt-10 space-y-1 px-4">
          {widoczne(portalNavigation).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`pressable flex min-h-12 items-center gap-4 rounded-ctl px-4 text-sm font-medium ${active ? "bg-paper text-accent-ink" : "text-mute hover:bg-paper hover:text-ink"}`}>
                <Ikona nazwa={item.ikona as NazwaIkony} className={active ? "text-accent" : "text-mute"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <CartIndicator variant="sidebar" active={isActive(pathname, "/koszyk")} />
        <div className="mt-4 border-t border-hair p-5"><AccountBadge /></div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-hair bg-paper/95 px-3 pb-2 pt-1 backdrop-blur-xl lg:hidden">
          <div className="flex min-h-12 items-center">
            <Link href="/" className="pressable rounded-ctl p-1.5" aria-label={`${firma.nazwa}, strona główna`}><MussiLogo priority /></Link>
          </div>
          <nav className="flex w-full gap-1 overflow-x-auto pb-1" aria-label={copy.wspolne.portal}>
            {widoczne(portalNavigation).map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-[10px] font-semibold ${isActive(pathname, item.href) ? "bg-ink text-white" : "text-mute"}`}>
                <Ikona nazwa={item.ikona as NazwaIkony} rozmiar={15} />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>
        </header>
        {trasaPubliczna ? children : <BramkaSesji>{children}</BramkaSesji>}
      </div>
      {/* Koszyk jest poza przewijaną treścią, więc towarzyszy klientowi
          na każdym ekranie portalu, łącznie ze stroną koszyka. O tym,
          czy w ogóle się pojawia, decyduje sesja wewnątrz komponentu. */}
      <MiniKoszyk />
    </div>
  );
}

function WarehouseShell({ children, pathname }: { children: ReactNode; pathname: string }) {
  return <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[240px_minmax(0,1fr)]"><a href="#main-content" className="fixed left-4 top-3 z-50 -translate-y-20 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0">{copy.wspolne.pominNawigacje}</a><aside className="sticky top-0 z-30 hidden h-screen border-r border-hair bg-surface lg:flex lg:flex-col"><Link href="/" className="pressable mx-5 mt-6 rounded-ctl p-1.5" aria-label={`${firma.nazwa}, strona główna`}><MussiLogo priority /></Link><div className="mx-4 mt-6 rounded-ctl bg-ink px-4 py-3 text-white"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/55">Tryb pracownika</p><p className="mt-1 text-xs font-semibold">Obsługa hurtowni</p></div><nav aria-label="Panel hurtowni" className="mt-5 space-y-1 px-4">{widoczne(warehouseNavigation).map((item) => {const active=isActive(pathname,item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`pressable flex min-h-12 items-center gap-4 rounded-ctl px-4 text-sm font-medium ${active ? "bg-paper text-accent-ink" : "text-mute hover:bg-paper hover:text-ink"}`}><Ikona nazwa={item.ikona as NazwaIkony} className={active ? "text-accent" : "text-mute"} />{item.label}</Link>;})}</nav><div className="mt-auto border-t border-hair p-5"><WarehouseAccount /></div></aside><div className="min-w-0"><header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-hair bg-paper/95 px-4 backdrop-blur-xl lg:hidden"><Link href="/" className="pressable shrink-0 rounded-ctl p-1.5" aria-label={`${firma.nazwa}, strona główna`}><MussiLogo priority /></Link><nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1" aria-label="Panel hurtowni">{widoczne(warehouseNavigation).map((item)=><Link key={item.href} href={item.href} aria-current={isActive(pathname,item.href) ? "page" : undefined} className={`shrink-0 rounded-full px-2.5 py-2 text-[10px] font-semibold ${isActive(pathname,item.href)?"bg-ink text-white":"text-mute"}`}>{item.label}</Link>)}</nav></header>{children}</div></div>;
}

function TopShell({ children, pathname }: { children: ReactNode; pathname: string }) {
  const prog = progiRabatowe.find((item) => item.kod === kontrahentDemo.kodProgu);

  return (
    <>
      <a href="#main-content" className="fixed left-4 top-3 z-30 -translate-y-20 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0">{copy.wspolne.pominNawigacje}</a>
      <header className="sticky top-0 z-20 border-b border-hair bg-paper/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:min-h-20 sm:px-6 lg:px-8">
          <Link href="/" aria-label={`${firma.nazwa}, strona główna`} className="pressable flex min-w-0 items-center rounded-ctl p-1.5"><MussiLogo priority /></Link>
          <nav aria-label={copy.wspolne.portal} className="ml-auto hidden items-center gap-1 lg:flex">
            {productLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`pressable rounded-full px-4 py-2 text-xs font-semibold ${active ? "bg-surface text-ink shadow-[var(--lift-sm)]" : "text-mute hover:text-ink"}`}>{link.label}</Link>;
            })}
          </nav>
          <nav aria-label={copy.wspolne.portal} className="ml-auto flex items-center gap-1 lg:hidden">
            {[productLinks[0], productLinks[3], productLinks[4]].map((link) => (
              <Link key={link.href} href={link.href} aria-current={isActive(pathname, link.href) ? "page" : undefined} className={`rounded-full px-2.5 py-2 text-[10px] font-semibold ${isActive(pathname, link.href) ? "bg-ink text-white" : "text-mute"}`}>{link.label === copy.wspolne.kreator ? "Kreator" : link.label}</Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 border-l border-hair pl-5 xl:flex">
            <div className="text-right"><p className="text-xs font-semibold text-ink">{kontrahentDemo.nazwa}</p><p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{copy.wspolne.prog}</p></div>
            <span className="rounded-full bg-accent px-3 py-2 font-mono text-xs font-semibold tabular-nums text-white">{prog?.kod} · {Math.round((prog?.rabat ?? 0) * 100)}%</span>
            <Link href="/wylogowano" className="text-[10px] font-semibold text-mute hover:text-accent-ink">Wyloguj</Link>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}

/**
 * Wpis znika z menu, gdy jego moduł jest wyłączony flagą.
 * Bez tego wyłączenie modułu zostawiałoby w nawigacji link prowadzący do 404.
 */
const trasyZaFlaga: Record<string, boolean> = {
  "/hurtownia/warunki": funkcje.warunkiHandlowe,
  "/hurtownia/produkcja": funkcje.kolejkaProdukcji,
  "/zespol": funkcje.organizacjaIRole,
};

function widoczne<T extends { href: string }>(pozycje: readonly T[]): T[] {
  return pozycje.filter((p) => trasyZaFlaga[p.href] !== false);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/logowanie" || pathname === "/wylogowano") return children;
  if (pathname.startsWith("/hurtownia")) return <WarehouseShell pathname={pathname}>{children}</WarehouseShell>;
  // Wszystkie ekrany po zalogowaniu dzielą jedną powłokę z paskiem bocznym.
  // Wcześniej katalog i kreator wpadały do wariantu poziomego, więc chrome
  // zmieniało się w trakcie przejścia z pulpitu, choć oba warianty i tak
  // pokazywały próg kontrahenta i wylogowanie.
  const trasyPortalu = ["/panel", "/katalog", "/kreator", "/projekty", "/koszyk", "/zamowienia", "/zespol"];
  if (trasyPortalu.some((t) => pathname === t || pathname.startsWith(`${t}/`)))
    return <PortalShell pathname={pathname}>{children}</PortalShell>;
  return <TopShell pathname={pathname}>{children}</TopShell>;
}
