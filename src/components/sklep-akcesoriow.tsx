"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Ikona } from "@/components/ikona";
import { copy, firma } from "@/config/brief";
import type { KategoriaAkcesorium } from "@/data/akcesoria";
import { ikonaKategorii, kategorieAkcesoriow } from "@/data/akcesoria";
import { zloty } from "@/lib/pricing";
import { useCzyWidacCeny } from "@/lib/sesja";
import {
  filtrujAkcesoria,
  policzWKategoriach,
  producenci,
  sortujAkcesoria,
  type Sortowanie,
} from "@/lib/sklep-akcesoriow";
import type { Akcesorium } from "@/data/akcesoria";
import type { Dostepnosc } from "@/data/dekory";

/**
 * Sklep akcesoriów.
 *
 * Osobna podstrona, bo akcesorium kupuje się inaczej niż płytę. Dekor klient
 * wybiera wzrokiem i liczy na metry, a okucie zna z indeksu i bierze
 * w sztukach. Dlatego na wejściu jest wyszukiwarka i kategorie, a nie
 * galeria próbek.
 *
 * Koszyk zostaje wspólny z płytą: magazyn kompletuje jedno zamówienie,
 * a nie dwa. Pozycję rozpoznaje po indeksie, stąd link `?dodaj=SKU`.
 */

type PozycjaSklepu = Akcesorium & {
  cenaKontrahenta: number;
  /* Dostępność liczy strona, żeby klient nie widział ani stanu magazynu,
     ani rezerwacji innych firm. */
  dostepnoscSklepu: Dostepnosc;
};

const ETYKIETY_DOSTEPNOSCI = {
  "na-stanie": copy.katalog.naStanie,
  "ostatnie-sztuki": copy.katalog.ostatnieSztuki,
  "na-zamowienie": copy.katalog.naZamowienie,
} as const;

const SORTOWANIA: Array<{ id: Sortowanie; nazwa: string }> = [
  { id: "nazwa", nazwa: "Alfabetycznie" },
  { id: "dostepnosc", nazwa: "Najpierw dostępne" },
  { id: "cena-rosnaco", nazwa: "Cena rosnąco" },
  { id: "cena-malejaco", nazwa: "Cena malejąco" },
];

/** Zdjęcie producenta, jeśli mamy. Inaczej ikona kategorii. */
function Miniatura({ pozycja }: { pozycja: PozycjaSklepu }) {
  const [bledne, setBledne] = useState(false);

  if (pozycja.image && !bledne) {
    return (
      /* Adresy prowadzą na serwery producentów, więc omijamy optymalizator
         next/image i pilnujemy, żeby brak pliku nie zostawił dziury. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={pozycja.image}
        alt=""
        loading="lazy"
        ref={(el) => {
          /* Obrazek z cudzego serwera potrafi się wysypać, zanim React zdąży
             się podpiąć, i wtedy `onError` nigdy nie przychodzi. Przy montowaniu
             sprawdzamy stan wprost, żeby nie została ramka z ikoną błędu. */
          if (el?.complete && el.naturalWidth === 0) setBledne(true);
        }}
        onError={() => setBledne(true)}
        className="size-full rounded-ctl object-cover"
      />
    );
  }

  return (
    <span className="grid size-full place-items-center rounded-ctl bg-paper text-mute ring-1 ring-inset ring-hair">
      <Ikona nazwa={ikonaKategorii(pozycja.kategoria)} rozmiar={22} />
    </span>
  );
}

export function SklepAkcesoriow({
  pozycje,
  kategoriaStartowa = null,
}: {
  pozycje: PozycjaSklepu[];
  /** Kategoria z adresu. Wchodzi jako stan początkowy, dalej rządzi klient. */
  kategoriaStartowa?: KategoriaAkcesorium | null;
}) {
  const [fraza, setFraza] = useState("");
  const [kategoria, setKategoria] = useState<KategoriaAkcesorium | null>(kategoriaStartowa);
  const [producent, setProducent] = useState<string | null>(null);
  const [tylkoDostepne, setTylkoDostepne] = useState(false);
  const [sortowanie, setSortowanie] = useState<Sortowanie>("dostepnosc");
  const widacCeny = useCzyWidacCeny();

  const liczbyKategorii = useMemo(() => policzWKategoriach(pozycje), [pozycje]);
  const listaProducentow = useMemo(() => producenci(pozycje), [pozycje]);

  const wynik = useMemo(() => {
    const przefiltrowane = filtrujAkcesoria(pozycje, {
      fraza,
      kategoria,
      producent,
      tylkoDostepne,
    }) as PozycjaSklepu[];
    return sortujAkcesoria(przefiltrowane, sortowanie) as PozycjaSklepu[];
  }, [fraza, kategoria, pozycje, producent, sortowanie, tylkoDostepne]);

  const czysteFiltry = !fraza && !kategoria && !producent && !tylkoDostepne;

  return (
    <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-mute">
          Sklep {firma.nazwa}
        </p>
        <h1 className="text-balance mt-3 font-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.04em] text-ink">
          Akcesoria meblowe
        </h1>
        <p className="text-pretty mt-4 text-lg leading-8 text-mute">
          Okucia, systemy szuflad, oświetlenie i chemia. {pozycje.length} indeksów prosto z magazynu
          przy {firma.ulica}. Znajdź po nazwie albo po symbolu producenta i dodaj do tego samego
          koszyka, w którym masz płytę.
        </p>
      </header>

      <section className="mt-10" aria-label="Kategorie">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {kategorieAkcesoriow.map((k) => {
            const aktywna = kategoria === k.id;
            return (
              <li key={k.id}>
                <button
                  type="button"
                  aria-pressed={aktywna}
                  onClick={() => setKategoria(aktywna ? null : k.id)}
                  className={`pressable flex min-h-16 w-full items-center gap-3 rounded-ctl px-4 py-3 text-left ring-1 ${
                    aktywna
                      ? "bg-ink text-white ring-ink"
                      : "bg-surface text-ink ring-hair hover:bg-paper"
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full ${
                      aktywna ? "bg-white/12 text-white" : "bg-paper text-mute"
                    }`}
                  >
                    <Ikona nazwa={k.ikona} rozmiar={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{k.nazwa}</span>
                    <span
                      className={`mt-0.5 block font-mono text-[10px] tabular-nums ${
                        aktywna ? "text-white/70" : "text-mute"
                      }`}
                    >
                      {liczbyKategorii[k.id] ?? 0}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-ctl bg-surface p-4 ring-1 ring-hair" aria-label="Szukanie">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <label htmlFor="szukaj" className="sr-only">
              Szukaj akcesorium
            </label>
            <input
              id="szukaj"
              type="search"
              value={fraza}
              onChange={(e) => setFraza(e.target.value)}
              placeholder="Nazwa, producent albo symbol, np. BLU-CLIP-110"
              className="min-h-12 w-full rounded-full bg-paper pl-11 pr-4 text-sm text-ink ring-1 ring-inset ring-hair placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute">
              <Ikona nazwa="katalog" rozmiar={16} />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="sortowanie" className="sr-only">
              Kolejność
            </label>
            <select
              id="sortowanie"
              value={sortowanie}
              onChange={(e) => setSortowanie(e.target.value as Sortowanie)}
              className="min-h-12 rounded-full bg-paper px-4 text-xs font-semibold text-ink ring-1 ring-inset ring-hair focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {SORTOWANIA.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nazwa}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-pressed={tylkoDostepne}
              onClick={() => setTylkoDostepne((v) => !v)}
              className={`pressable min-h-12 rounded-full px-4 text-xs font-semibold ring-1 ${
                tylkoDostepne
                  ? "bg-ink text-white ring-ink"
                  : "bg-paper text-mute ring-hair hover:text-ink"
              }`}
            >
              Tylko dostępne
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hair pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
            Producent
          </span>
          {listaProducentow.map((p) => {
            const aktywny = producent === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={aktywny}
                onClick={() => setProducent(aktywny ? null : p)}
                className={`pressable min-h-9 rounded-full px-3 text-[11px] font-semibold ring-1 ${
                  aktywny
                    ? "bg-accent text-white ring-accent"
                    : "bg-paper text-mute ring-hair hover:text-ink"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-xs tabular-nums text-mute">
          {wynik.length} z {pozycje.length} indeksów
        </p>
        {!czysteFiltry && (
          <button
            type="button"
            onClick={() => {
              setFraza("");
              setKategoria(null);
              setProducent(null);
              setTylkoDostepne(false);
            }}
            className="pressable min-h-9 rounded-full px-3 text-[11px] font-semibold text-mute hover:text-ink"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      {wynik.length === 0 ? (
        <p className="mt-6 rounded-ctl bg-surface px-5 py-10 text-center text-sm text-mute ring-1 ring-hair">
          Nic nie pasuje do tych warunków. Spróbuj samego symbolu producenta albo zdejmij filtry.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {wynik.map((pozycja) => (
            <li key={pozycja.sku}>
              <article className="flex h-full flex-col rounded-ctl bg-surface p-4 ring-1 ring-hair">
                <div className="flex gap-4">
                  <div className="size-16 shrink-0">
                    <Miniatura pozycja={pozycja} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                      {pozycja.producent} · {pozycja.sku}
                    </p>
                    <h2 className="text-balance mt-1 font-display text-base font-semibold leading-snug text-ink">
                      {pozycja.nazwa}
                    </h2>
                  </div>
                </div>

                <p className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      pozycja.dostepnoscSklepu === "na-stanie"
                        ? "bg-paper text-ink ring-1 ring-hair"
                        : pozycja.dostepnoscSklepu === "ostatnie-sztuki"
                          ? "bg-danger-paper text-accent-ink ring-1 ring-accent/20"
                          : "bg-paper text-mute ring-1 ring-hair"
                    }`}
                  >
                    {ETYKIETY_DOSTEPNOSCI[pozycja.dostepnoscSklepu]}
                  </span>
                </p>

                <div className="mt-auto pt-4">
                  {widacCeny ? (
                    <div className="flex items-end justify-between gap-3 rounded-ctl bg-paper px-4 py-3 ring-1 ring-inset ring-hair">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                          {copy.katalog.twojaCena}
                        </p>
                        <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">
                          {zloty.format(pozycja.cenaKontrahenta)}
                        </p>
                      </div>
                      <p className="pb-1 text-right text-[10px] leading-4 text-mute">
                        / {pozycja.jednostka}
                        <br />
                        {copy.wspolne.cenaNetto}
                      </p>
                    </div>
                  ) : (
                    <Link
                      href="/logowanie"
                      className="pressable flex min-h-12 items-center justify-between gap-3 rounded-ctl bg-paper px-4 py-3 ring-1 ring-inset ring-hair"
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                          Cena dla Twojej firmy
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-ink">
                          Zaloguj się, aby zobaczyć
                        </span>
                      </span>
                      <Ikona nazwa="dalej" rozmiar={14} />
                    </Link>
                  )}

                  <Link
                    href={`/koszyk?dodaj=${encodeURIComponent(pozycja.sku)}`}
                    aria-label={`${copy.katalog.dodajDoKoszyka}: ${pozycja.nazwa}`}
                    className="pressable mt-3 flex min-h-11 w-full items-center justify-between rounded-full bg-accent py-1.5 pl-4 pr-1.5 text-xs font-semibold text-white"
                  >
                    {copy.katalog.dodajDoKoszyka}
                    <span className="grid size-8 place-items-center rounded-full bg-white/12">
                      <Ikona nazwa="koszyk" rozmiar={16} />
                    </span>
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
