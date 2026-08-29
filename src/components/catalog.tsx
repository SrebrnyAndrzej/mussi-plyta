"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { copy, kontrahentDemo, progiRabatowe } from "@/config/brief";
import { zloty } from "@/lib/pricing";
import { zdjecia } from "@/data/media";

type Category = "plyta" | "blat" | "front" | "sklejka" | "obrzeze" | "akcesorium";
type Availability = "na-stanie" | "ostatnie-sztuki" | "na-zamowienie";
type CatalogItem = {
  id: string;
  kod: string;
  nazwa: string;
  producent: string;
  kategoria: Category;
  opis: string;
  grubosciMm: number[];
  cenaKatalogowa: number;
  cenaKontrahenta: number;
  jednostka: "arkusz" | "mb" | "szt";
  dostepnosc: Availability;
  probka: string;
};

const categories: Array<{ value: "all" | Category; label: string }> = [
  { value: "all", label: copy.katalog.wszystkie },
  { value: "plyta", label: copy.katalog.plyta },
  { value: "blat", label: copy.katalog.blat },
  { value: "front", label: copy.katalog.front },
  { value: "sklejka", label: copy.katalog.sklejka },
  { value: "obrzeze", label: copy.katalog.obrzeze },
  { value: "akcesorium", label: copy.katalog.akcesorium },
];

const availabilityLabels: Record<Availability, string> = {
  "na-stanie": copy.katalog.naStanie,
  "ostatnie-sztuki": copy.katalog.ostatnieSztuki,
  "na-zamowienie": copy.katalog.naZamowienie,
};

export function Catalog({ produkty }: { produkty: CatalogItem[] }) {
  const [category, setCategory] = useState<"all" | Category>("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const prog = progiRabatowe.find((item) => item.kod === kontrahentDemo.kodProgu);
  const filtered = useMemo(
    () =>
      produkty.filter(
        (item) =>
          (category === "all" || item.kategoria === category) &&
          (!availableOnly || item.dostepnosc === "na-stanie"),
      ),
    [availableOnly, category, produkty],
  );

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
      <header className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
            {copy.katalog.eyebrow}
          </p>
          <h1 className="text-balance mt-4 font-display text-[clamp(2.35rem,5vw,4.75rem)] font-bold leading-[0.96] tracking-[-0.055em] text-ink">
            {copy.katalog.tytul}
          </h1>
          <p className="text-pretty mt-5 max-w-2xl text-base leading-7 text-mute sm:text-lg">
            {copy.katalog.opis}
          </p>
        </div>

        <div className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="flex items-center gap-5 rounded-core bg-surface px-5 py-4 shadow-[var(--inner)]">
            <div>
              <p className="text-xs font-semibold text-ink">{kontrahentDemo.nazwa}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{copy.wspolne.prog}</p>
            </div>
            <div className="border-l border-hair pl-5 text-right">
              <p className="font-mono text-lg font-semibold tabular-nums text-accent-ink">{prog?.kod} · {Math.round((prog?.rabat ?? 0) * 100)}%</p>
              <p className="mt-0.5 text-[10px] text-mute">{prog?.nazwa}</p>
            </div>
          </div>
        </div>
      </header>

      <figure className="mt-9 overflow-hidden rounded-shell ring-1 ring-hair">
        <Image
          src={zdjecia.dekory.src}
          alt={zdjecia.dekory.alt}
          width={zdjecia.dekory.szer}
          height={zdjecia.dekory.wys}
          sizes="(min-width: 1024px) 1440px, 100vw"
          className="aspect-[21/9] w-full object-cover"
          priority
        />
        <figcaption className="bg-surface px-5 py-3 text-xs leading-5 text-mute">
          {copy.katalog.podpisEkspozycji}
        </figcaption>
      </figure>

      <section aria-labelledby="catalog-filter-title" className="mt-5 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="rounded-core bg-surface p-4 shadow-[var(--inner)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 id="catalog-filter-title" className="text-xs font-semibold text-ink">{copy.katalog.filtrKategorii}</h2>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={copy.katalog.filtrKategorii}>
                {categories.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={category === item.value}
                    onClick={() => setCategory(item.value)}
                    className={`pressable shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${
                      category === item.value ? "bg-ink text-white" : "bg-paper-2 text-mute hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-6 border-t border-hair pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(event) => setAvailableOnly(event.target.checked)}
                  className="size-5 accent-accent"
                />
                <span className="text-sm font-semibold text-ink">{copy.katalog.dostepne}</span>
              </label>
              <p aria-live="polite" className="font-mono text-xs tabular-nums text-mute">
                {filtered.length} {copy.katalog.pozycji}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={copy.katalog.wyniki} className="mt-5">
        {filtered.length === 0 ? (
          <div className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
            <div className="grid min-h-56 place-items-center rounded-core bg-surface px-6 text-center shadow-[var(--inner)]">
              <p className="max-w-sm text-sm leading-6 text-mute">{copy.katalog.brakWynikow}</p>
            </div>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((produkt) => (
              <li key={produkt.id} className="lift-on-hover pressable rounded-shell bg-shell p-1.5 ring-1 ring-hair">
                <article className="flex h-full min-h-[34rem] flex-col overflow-hidden rounded-core bg-surface shadow-[var(--inner)]">
                  <div className="relative aspect-[1.42/1] overflow-hidden bg-paper-2" style={{ background: produkt.probka }}>
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
                      <span className="rounded-full bg-white/92 px-3 py-2 font-mono text-[10px] font-semibold tracking-[0.08em] text-ink shadow-[var(--lift-sm)]">
                        {produkt.kod}
                      </span>
                      <span className={`rounded-full px-3 py-2 text-[10px] font-semibold shadow-[var(--lift-sm)] ${
                        produkt.dostepnosc === "na-stanie"
                          ? "bg-ink text-white"
                          : produkt.dostepnosc === "ostatnie-sztuki"
                            ? "bg-white text-accent-ink"
                            : "bg-white text-mute"
                      }`}>
                        {availabilityLabels[produkt.dostepnosc]}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{produkt.producent}</p>
                    <h2 className="text-balance mt-2 font-display text-xl font-semibold leading-tight tracking-tight text-ink">{produkt.nazwa}</h2>
                    <p className="text-pretty mt-3 text-sm leading-6 text-mute">{produkt.opis}</p>

                    <dl className="mt-5 border-t border-hair pt-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-xs text-mute">{copy.katalog.grubosc}</dt>
                        <dd className="font-mono text-xs font-medium tabular-nums text-ink">{produkt.grubosciMm.join(" / ")} {copy.kreator.jednostkaMm}</dd>
                      </div>
                    </dl>

                    <div className="mt-auto pt-6">
                      <div className="flex items-end justify-between gap-4 rounded-ctl bg-paper px-4 py-3 ring-1 ring-inset ring-hair">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">{copy.katalog.twojaCena}</p>
                          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{zloty.format(produkt.cenaKontrahenta)}</p>
                        </div>
                        <p className="pb-1 text-right text-[10px] leading-4 text-mute">/ {produkt.jednostka}<br />{copy.wspolne.cenaNetto}</p>
                      </div>
                      {produkt.kategoria !== "obrzeze" && produkt.kategoria !== "akcesorium" && (
                        <Link
                          href={`/kreator?material=${encodeURIComponent(produkt.id)}`}
                          className="pressable mt-3 flex min-h-11 w-full items-center justify-between rounded-full bg-ink py-1.5 pl-4 pr-1.5 text-xs font-semibold text-white"
                        >
                          {copy.katalog.uzyjWKreatorze}
                          <span className="grid size-8 place-items-center rounded-full bg-white/12" aria-hidden="true">
                            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
