"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { copy, firma, kontrahentDemo, progiRabatowe } from "@/config/brief";

const links = [
  { href: "/kreator", label: copy.wspolne.kreator },
  { href: "/katalog", label: copy.wspolne.katalog },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prog = progiRabatowe.find((item) => item.kod === kontrahentDemo.kodProgu);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-30 -translate-y-20 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-transform duration-150 ease-[var(--ease-out)] focus:translate-y-0"
      >
        {copy.wspolne.pominNawigacje}
      </a>
      <header className="sticky top-0 z-20 border-b border-hair bg-paper/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:min-h-20 sm:px-6 lg:px-8">
          <Link href="/kreator" className="pressable flex min-w-0 items-center gap-3 rounded-full">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-bold text-white shadow-[var(--lift-sm)]">
              M
            </span>
            <span className="hidden min-w-0 sm:block">
              <strong className="block truncate font-display text-[15px] leading-none text-ink">
                {firma.nazwa}
              </strong>
              <span className="mt-1 block text-[11px] leading-none text-mute">
                {copy.wspolne.portal}
              </span>
            </span>
          </Link>

          <nav aria-label={copy.wspolne.portal} className="ml-auto flex items-center rounded-full bg-shell p-1 ring-1 ring-hair">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`pressable rounded-full px-3 py-2 text-xs font-semibold sm:px-5 sm:text-sm ${
                    active ? "bg-surface text-ink shadow-[var(--lift-sm)]" : "text-mute hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 border-l border-hair pl-5 lg:flex">
            <div className="text-right">
              <p className="text-xs font-semibold text-ink">{kontrahentDemo.nazwa}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
                {copy.wspolne.prog}
              </p>
            </div>
            <span className="rounded-full bg-accent px-3 py-2 font-mono text-xs font-semibold tabular-nums text-white">
              {prog?.kod} · {Math.round((prog?.rabat ?? 0) * 100)}%
            </span>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
