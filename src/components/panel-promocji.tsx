"use client";

import Image from "next/image";
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
      {/* Ciemna plansza jako akcent kompozycyjny, zgodnie z zasadą 1 kontraktu.
          Ten sam język co baner promocyjny, żeby to, co widzi klient na stronie,
          zgadzało się z tym, co hurtownia wystawia w mediach. */}
      <article className="relative flex min-h-[26rem] flex-col overflow-hidden rounded-core bg-ink p-6 text-white shadow-[var(--inner)] sm:p-8">

        {/* Ślad ruchu: kąt otwarcia zawiasu. Fakt techniczny, nie ozdoba. */}
        <svg
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute -top-[14%] right-[-6%] w-[58%] opacity-90"
        >
          <circle cx="200" cy="200" r="196" stroke="#9F0832" strokeOpacity=".24" />
          <path d="M200 44 A156 156 0 0 1 338 248" stroke="#C4315A" strokeWidth="2.5" strokeOpacity=".85" />
          <text
            x="243"
            y="126"
            fill="#ffffff"
            fillOpacity=".45"
            fontFamily="ui-monospace, monospace"
            fontSize="20"
            letterSpacing="1"
          >
            110°
          </text>
        </svg>

        {p.grafika && (
          /* Zdjęcie dostarcza hurtownia, więc niczego nie fabrykujemy.
             Poświata pod produktem odrywa go od ciemnego tła. */
          <span className="pointer-events-none absolute bottom-[-6%] right-[-4%] w-[52%]">
            <span
              aria-hidden="true"
              className="absolute inset-[-20%] rounded-full"
              style={{ background: "radial-gradient(52% 48% at 52% 48%, rgb(196 49 90 / 0.34) 0%, transparent 68%)" }}
            />
            <Image
              src={p.grafika}
              alt=""
              aria-hidden="true"
              priority
              width={1418}
              height={994}
              sizes="(min-width: 1024px) 420px, 60vw"
              className="relative w-full max-w-none rotate-[-6deg] drop-shadow-[0_26px_34px_rgba(0,0,0,0.55)]"
            />
          </span>
        )}

        <div className="relative z-10 flex items-start justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
            Promocja {String(biezaca + 1).padStart(2, "0")} z {String(promocje.length).padStart(2, "0")}
          </p>
          <span className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 font-mono text-[11px] font-semibold text-white">
            {p.etykieta}
          </span>
        </div>

        <div className="relative z-10 mt-8 flex-1">
          {p.producent && (
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C4315A]">{p.producent}</p>
          )}
          <h2 className="text-balance mt-3 max-w-[12ch] font-display text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
            {p.tytul}
          </h2>
          <p className="mt-4 max-w-[20rem] text-sm leading-6 text-white/60">{p.opis}</p>

          <p className="mt-6 font-mono text-[11px] text-white/50">
            {zostalo === null
              ? "Oferta bezterminowa"
              : zostalo === 0
                ? "Ostatni dzień oferty"
                : `Zostało ${zostalo} ${zostalo === 1 ? "dzień" : "dni"}`}
          </p>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap items-center justify-between gap-4">
          {p.odnosnik ? (
            <Link
              href={p.odnosnik}
              className="pressable inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink"
            >
              Zobacz ofertę
              <Ikona nazwa="dalej" rozmiar={14} />
            </Link>
          ) : (
            <span className="text-xs text-white/50">Szczegóły u handlowca</span>
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
                    index === biezaca ? "bg-white/10" : "bg-transparent hover:bg-white/5"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mx-auto block size-2 rounded-full ${index === biezaca ? "bg-[#C4315A]" : "bg-white/25"}`}
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
