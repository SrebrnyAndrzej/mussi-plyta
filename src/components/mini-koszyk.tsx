"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Ikona } from "@/components/ikona";
import { kontrahentDemo } from "@/config/brief";
import { useCartBrowserLines, useCartIndicatorSummary } from "@/lib/cart-browser";
import { useSesja } from "@/lib/sesja";
import { podsumujKoszyk, zloty } from "@/lib/pricing";

type PozycjaKoszyka = {
  id: string;
  kod: string;
  nazwa: string;
  jednostka: string;
  ilosc: number;
  cenaKatalogowa: number;
};

function odmienPozycje(ile: number) {
  if (ile === 1) return "pozycja";
  if (ile >= 2 && ile <= 4) return "pozycje";
  return "pozycji";
}

/**
 * Stały, lewitujący koszyk z podglądem zawartości.
 *
 * Nie zajmuje miejsca w nagłówku i jest dostępny przez cały czas przeglądania,
 * a klient sprawdza pozycje i kwotę bez opuszczania ekranu, na którym jest.
 * Podgląd jest wyłącznie do odczytu: ilości zmienia się na stronie koszyka,
 * żeby nie było dwóch miejsc rządzących tym samym stanem.
 *
 * Stan pochodzi z `src/lib/cart-browser.ts`, tego samego, z którego korzysta
 * wskaźnik w nawigacji.
 */
export function MiniKoszyk() {
  const [otwarty, setOtwarty] = useState(false);
  const sesja = useSesja();
  const summary = useCartIndicatorSummary();
  const pozycje = useCartBrowserLines<PozycjaKoszyka>();
  const panelId = useId();
  const przyciskRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!otwarty) return;

    function naKlawisz(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOtwarty(false);
      przyciskRef.current?.focus();
    }
    function naKlik(event: MouseEvent) {
      const cel = event.target as Node;
      if (panelRef.current?.contains(cel) || przyciskRef.current?.contains(cel)) return;
      setOtwarty(false);
    }

    document.addEventListener("keydown", naKlawisz);
    document.addEventListener("mousedown", naKlik);
    return () => {
      document.removeEventListener("keydown", naKlawisz);
      document.removeEventListener("mousedown", naKlik);
    };
  }, [otwarty]);

  /*
   * Ta sama funkcja, z której korzysta strona koszyka. Rabat liczy się od sumy
   * i zaokrągla raz, więc podgląd nie rozjeżdża się z koszykiem o grosze
   * narosłe na zaokrąglaniu każdej pozycji osobno.
   */
  const podsumowanie = podsumujKoszyk(
    pozycje.map((p) => ({ nazwa: p.nazwa, ilosc: p.ilosc, jednostka: p.jednostka, cenaKatalogowa: p.cenaKatalogowa })),
    kontrahentDemo.kodProgu,
  );
  const poRabacie = (p: PozycjaKoszyka) => p.ilosc * p.cenaKatalogowa * (1 - podsumowanie.prog.rabat);

  /* Koszyk i kwoty są wyłącznie dla zalogowanego kontrahenta. */
  if (!sesja.zalogowany) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {otwarty && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Podgląd koszyka"
          className="pointer-events-auto w-[min(22rem,calc(100vw-2rem))] origin-bottom-right rounded-shell bg-shell p-1.5 ring-1 ring-hair shadow-[var(--lift)] motion-safe:animate-[wjazd_.24s_var(--ease-out)_backwards]"
        >
          <div className="rounded-core bg-surface shadow-[var(--inner)]">
            <div className="flex items-baseline justify-between gap-3 border-b border-hair px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Koszyk</p>
              <p className="text-xs font-semibold text-ink">
                {summary.lines} {odmienPozycje(summary.lines)}
              </p>
            </div>

            {pozycje.length === 0 ? (
              <p className="px-5 py-6 text-sm leading-6 text-mute">
                Koszyk jest pusty. Dodaj dekory z katalogu albo wyślij rozkrój z kreatora.
              </p>
            ) : (
              <ul className="max-h-[min(24rem,50vh)] divide-y divide-hair overflow-y-auto">
                {pozycje.map((p) => (
                  <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-5 py-3">
                    <span className="min-w-0">
                      <strong className="block truncate text-xs font-semibold text-ink">{p.nazwa}</strong>
                      <span className="mt-1 block font-mono text-[10px] text-mute">
                        {p.kod}, {p.ilosc} {p.jednostka}
                      </span>
                    </span>
                    <strong className="self-center font-mono text-xs tabular-nums text-ink">
                      {zloty.format(poRabacie(p))}
                    </strong>
                  </li>
                ))}
              </ul>
            )}

            <dl className="divide-y divide-hair border-t border-hair text-xs">
              <div className="flex justify-between gap-4 px-5 py-2.5">
                <dt className="text-mute">Netto</dt>
                <dd className="font-mono tabular-nums text-ink">{zloty.format(podsumowanie.wartoscNetto)}</dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-2.5">
                <dt className="font-semibold text-ink">Brutto</dt>
                <dd className="font-mono font-semibold tabular-nums text-accent-ink">{zloty.format(podsumowanie.brutto)}</dd>
              </div>
            </dl>

            <div className="px-4 pb-4 pt-3">
              <Link
                href="/koszyk"
                onClick={() => setOtwarty(false)}
                className="pressable flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-xs font-semibold text-white"
              >
                Przejdź do koszyka
                <Ikona nazwa="dalej" rozmiar={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <button
        ref={przyciskRef}
        type="button"
        onClick={() => setOtwarty((stan) => !stan)}
        aria-expanded={otwarty}
        aria-controls={panelId}
        aria-label={`Koszyk, ${summary.lines} ${odmienPozycje(summary.lines)}, ${zloty.format(summary.gross)} brutto`}
        className="pointer-events-auto pressable flex min-h-12 items-center gap-3 rounded-full bg-surface/85 px-4 py-2 shadow-[var(--lift)] ring-1 ring-hair backdrop-blur-xl backdrop-saturate-150"
      >
        <span className="relative grid size-8 place-items-center rounded-full bg-paper text-accent">
          <Ikona nazwa="koszyk" rozmiar={17} />
          {summary.lines > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-accent px-1 py-0.5 font-mono text-[9px] leading-none text-white ring-2 ring-surface">
              {summary.lines}
            </span>
          )}
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-ink">
          {zloty.format(summary.gross)}
        </span>
      </button>
    </div>
  );
}
