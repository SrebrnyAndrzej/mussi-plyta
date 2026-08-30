"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Ikona } from "@/components/ikona";
import { useSesja, type RolaSesji } from "@/lib/sesja";

/**
 * Prywatna część portalu.
 *
 * Specyfikacja w sekcji SEO dzieli portal na dwie strefy: publiczna zostaje
 * strona, oferta i kategorie, a panel klienta, koszyk, kalkulacje, dokumenty
 * i zamówienia mają być poza indeksem. Ta bramka pilnuje tego podziału
 * na ekranie: bez sesji nie pokazujemy zawartości, w której siedzą ceny
 * kontrahenta, terminy i dokumenty.
 *
 * To zasłona na interfejsie, nie zabezpieczenie. Prawdziwa kontrola dostępu
 * należy do serwera i wchodzi razem z bazą.
 */
export function BramkaSesji({
  children,
  wymaganaRola,
}: {
  children: ReactNode;
  /** Gdy podana, sama sesja nie wystarczy: rola musi się zgadzać. */
  wymaganaRola?: RolaSesji;
}) {
  const sesja = useSesja();
  const wpuszczamy = sesja.zalogowany && (!wymaganaRola || sesja.rola === wymaganaRola);
  if (wpuszczamy) return <>{children}</>;

  const zlaRola = sesja.zalogowany && wymaganaRola && sesja.rola !== wymaganaRola;

  return (
    <main id="main-content" className="grid min-h-[70vh] place-items-center px-4 py-14">
      <section className="w-full max-w-xl rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="rounded-core bg-surface p-7 text-center shadow-[var(--inner)] sm:p-10">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-paper text-accent">
            <Ikona nazwa="klienci" rozmiar={22} />
          </span>
          <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
            {wymaganaRola === "hurtownia" ? "Zaplecze hurtowni" : "Strefa kontrahenta"}
          </p>
          <h1 className="text-balance mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">
            {zlaRola ? "To konto nie ma dostępu do tej części" : "Ta część portalu jest dla zalogowanych"}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-mute">
            {wymaganaRola === "hurtownia"
              ? "Zaplecze widzą wyłącznie pracownicy hurtowni. Zalogowany kontrahent ma swój portal, bez stanów magazynowych i warunków innych firm."
              : "Ceny, terminy i dokumenty zależą od warunków handlowych Twojej firmy, więc pokazujemy je dopiero po zalogowaniu. Asortyment obejrzysz bez konta."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/logowanie" className="pressable flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white">
              Zaloguj się
            </Link>
            <Link
              href={wymaganaRola === "hurtownia" ? "/panel" : "/katalog"}
              className="pressable flex min-h-12 items-center justify-center gap-2 rounded-full bg-paper px-6 text-sm font-semibold text-ink ring-1 ring-hair"
            >
              {wymaganaRola === "hurtownia" ? "Wróć do portalu" : "Przeglądaj katalog"}
              <Ikona nazwa="dalej" rozmiar={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
