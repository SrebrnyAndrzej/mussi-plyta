"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Ikona } from "@/components/ikona";
import { promocjeDemo } from "@/data/promocje-demo";
import { aktywnePromocje, dniDoKonca, type Promocja } from "@/lib/promocje";

/**
 * Panel promocji na stronie głównej, w miejscu dawnej makiety rozkroju.
 *
 * Treść pochodzi z danych, które hurtownia edytuje w panelu pracownika.
 * Bez zdjęć produktowych: kontrakt zabrania ich fabrykowania, więc baner
 * niesie hasło, warunek i termin, a wyróżnikiem jest etykieta rabatu.
 */
export function PanelPromocji() {
  const promocje = useMemo(() => aktywnePromocje(promocjeDemo), []);
  const [biezaca, setBiezaca] = useState(0);

  if (promocje.length === 0) {
    return (
      <div className="rounded-shell bg-shell p-1.5 ring-1 ring-hair shadow-[var(--lift)]">
        <div className="grid min-h-[26rem] place-items-center rounded-core bg-surface p-8 text-center shadow-[var(--inner)]">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-paper text-mute">
              <Ikona nazwa="katalog" rozmiar={22} />
            </span>
            <p className="mt-5 text-sm leading-6 text-mute">
              Brak promocji na dziś. Nowe oferty pojawią się tutaj, gdy hurtownia je doda.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const p: Promocja = promocje[Math.min(biezaca, promocje.length - 1)];
  const zostalo = dniDoKonca(p);

  return (
    <div className="rounded-shell bg-shell p-1.5 ring-1 ring-hair shadow-[var(--lift)]">
      <article className="flex min-h-[26rem] flex-col rounded-core bg-surface p-6 shadow-[var(--inner)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
            Promocja {String(biezaca + 1).padStart(2, "0")} z {String(promocje.length).padStart(2, "0")}
          </p>
          <span className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 font-mono text-[11px] font-semibold text-white">
            {p.etykieta}
          </span>
        </div>

        <div className="mt-8 flex-1">
          {p.producent && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-ink">{p.producent}</p>
          )}
          <h2 className="text-balance mt-3 font-display text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-ink">
            {p.tytul}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-mute">{p.opis}</p>

          <p className="mt-6 font-mono text-[11px] text-mute">
            {zostalo === null
              ? "Oferta bezterminowa"
              : zostalo === 0
                ? "Ostatni dzień oferty"
                : `Zostało ${zostalo} ${zostalo === 1 ? "dzień" : "dni"}`}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {p.odnosnik ? (
            <Link
              href={p.odnosnik}
              className="pressable inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white"
            >
              Zobacz ofertę
              <Ikona nazwa="dalej" rozmiar={14} />
            </Link>
          ) : (
            <span className="text-xs text-mute">Szczegóły u handlowca</span>
          )}

          {promocje.length > 1 && (
            <div className="flex items-center gap-2" role="group" aria-label="Wybór promocji">
              {promocje.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBiezaca(index)}
                  aria-label={`Pokaż promocję: ${item.tytul}`}
                  aria-current={index === biezaca ? "true" : undefined}
                  className={`size-11 rounded-full transition-colors duration-300 ease-[var(--ease-out)] ${
                    index === biezaca ? "bg-paper" : "bg-transparent hover:bg-paper"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mx-auto block size-2 rounded-full ${index === biezaca ? "bg-accent" : "bg-hair"}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
