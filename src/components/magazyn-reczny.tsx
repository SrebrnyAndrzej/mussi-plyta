"use client";

import { useMemo, useState } from "react";
import {
  akcesoria as asortyment,
  kategorieAkcesoriow,
  type Akcesorium,
  type KategoriaAkcesorium,
} from "@/data/akcesoria";
import {
  doZamowienia,
  dostepne,
  podsumujMagazyn,
  powodyKorekty,
  stanPozycji,
  zastosujKorekte,
  type PowodKorekty,
  type WpisHistorii,
} from "@/lib/magazyn";
import { zloty } from "@/lib/pricing";
import { Ikona, type NazwaIkony } from "@/components/ikona";

const liczba = new Intl.NumberFormat("pl-PL");

const etykietaStanu = {
  zgodne: "zgodne",
  "ponizej-minimum": "poniżej minimum",
  brak: "brak",
} as const;

/** Ikona kategorii akcesorium, z zamkniętego zestawu Phosphor. */
function ikonaKategorii(kategoria: string): NazwaIkony {
  return (kategorieAkcesoriow.find((k) => k.id === kategoria)?.ikona ?? "stany") as NazwaIkony;
}

export function MagazynReczny({ autor }: { autor: string }) {
  const [pozycje, setPozycje] = useState<Akcesorium[]>(asortyment);
  const [kategoria, setKategoria] = useState<KategoriaAkcesorium | "wszystkie">("wszystkie");
  const [szukaj, setSzukaj] = useState("");
  const [tylkoProblemy, setTylkoProblemy] = useState(false);
  const [wybranySku, setWybranySku] = useState<string | null>(null);

  const [tryb, setTryb] = useState<"ustaw" | "zmien">("zmien");
  const [wartosc, setWartosc] = useState("");
  const [powod, setPowod] = useState<PowodKorekty>("inwentaryzacja");
  const [notatka, setNotatka] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [historia, setHistoria] = useState<WpisHistorii[]>([]);

  const widoczne = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    return pozycje.filter((a) => {
      if (kategoria !== "wszystkie" && a.kategoria !== kategoria) return false;
      if (tylkoProblemy && stanPozycji(a) === "zgodne") return false;
      if (q && !`${a.sku} ${a.nazwa} ${a.producent}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pozycje, kategoria, tylkoProblemy, szukaj]);

  const podsumowanie = useMemo(() => podsumujMagazyn(pozycje), [pozycje]);
  const wybrana = pozycje.find((a) => a.sku === wybranySku) ?? null;

  function zapisz() {
    if (!wybrana) {
      setBlad("Najpierw wybierz pozycję z listy.");
      return;
    }
    const liczbowa = Number(wartosc.replace(",", "."));
    const wynik = zastosujKorekte(wybrana, {
      sku: wybrana.sku,
      tryb,
      wartosc: liczbowa,
      powod,
      notatka,
      autor,
    });
    if (!wynik.ok) {
      setBlad(wynik.blad);
      return;
    }
    setPozycje((stare) => stare.map((a) => (a.sku === wynik.pozycja.sku ? wynik.pozycja : a)));
    setHistoria((h) => [wynik.wpis, ...h].slice(0, 12));
    setWartosc("");
    setNotatka("");
    setBlad(null);
  }

  return (
    <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <section className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-core bg-hair sm:grid-cols-4">
            {[
              ["Pozycji w magazynie", liczba.format(podsumowanie.pozycji), false],
              ["Poniżej minimum", liczba.format(podsumowanie.ponizejMinimum), podsumowanie.ponizejMinimum > 0],
              ["Braki", liczba.format(podsumowanie.brakow), podsumowanie.brakow > 0],
              ["Wartość netto", zloty.format(podsumowanie.wartoscNetto), false],
            ].map(([etykieta, wartoscKpi, alarm]) => (
              <div key={String(etykieta)} className="bg-surface px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">{etykieta}</p>
                <p className={`mt-1 font-mono text-lg font-semibold tabular-nums ${alarm ? "text-accent-ink" : "text-ink"}`}>
                  {wartoscKpi}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="space-y-4 rounded-core bg-surface p-4 shadow-[var(--inner)] sm:p-5">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtr kategorii">
              {[{ id: "wszystkie" as const, nazwa: "Wszystkie" }, ...kategorieAkcesoriow].map((k) => (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={kategoria === k.id}
                  onClick={() => setKategoria(k.id as KategoriaAkcesorium | "wszystkie")}
                  className={`pressable min-h-11 shrink-0 rounded-full px-4 text-xs font-semibold ${
                    kategoria === k.id ? "bg-ink text-white" : "bg-paper-2 text-mute hover:text-ink"
                  }`}
                >
                  {k.nazwa}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="block flex-1">
                <span className="sr-only">Szukaj po SKU, nazwie lub producencie</span>
                <input
                  type="search"
                  value={szukaj}
                  onChange={(e) => setSzukaj(e.target.value)}
                  placeholder="Szukaj po SKU, nazwie lub producencie"
                  className="min-h-11 w-full rounded-full bg-paper px-5 text-sm text-ink ring-1 ring-inset ring-hair placeholder:text-mute focus:ring-accent"
                />
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={tylkoProblemy} onChange={(e) => setTylkoProblemy(e.target.checked)} className="size-5 accent-accent" />
                <span className="text-sm font-semibold text-ink">Tylko braki i niedobory</span>
              </label>
              <p aria-live="polite" className="font-mono text-xs tabular-nums text-mute">
                {widoczne.length} z {pozycje.length}
              </p>
            </div>
          </div>
        </section>

        <section aria-label="Asortyment akcesoriów" className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="overflow-hidden rounded-core bg-surface shadow-[var(--inner)]">
            <div className="hidden grid-cols-[1.7fr_.6fr_.6fr_.6fr_.7fr] gap-3 border-b border-hair bg-paper px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute lg:grid">
              <span>Towar</span><span className="text-right">Dokumenty</span><span className="text-right">Rezerwacje</span><span className="text-right">Dostępne</span><span>Stan</span>
            </div>
            <ul className="divide-y divide-hair">
              {widoczne.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-mute">Żadna pozycja nie pasuje do filtrów.</li>
              )}
              {widoczne.map((a) => {
                const stan = stanPozycji(a);
                const wybrany = a.sku === wybranySku;
                const brakuje = doZamowienia(a);
                return (
                  <li key={a.sku}>
                    <button
                      type="button"
                      onClick={() => { setWybranySku(a.sku); setBlad(null); }}
                      aria-pressed={wybrany}
                      className={`grid w-full min-h-14 grid-cols-2 gap-2 px-4 py-3 text-left lg:grid-cols-[1.7fr_.6fr_.6fr_.6fr_.7fr] lg:items-center lg:gap-3 ${
                        wybrany ? "bg-paper" : "hover:bg-paper"
                      }`}
                    >
                      <span className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
                        {/* Ikona kategorii zamiast zdjęcia produktu. Zasada 10 kontraktu
                            zabrania fabrykowania fotografii, a pole `image` czeka
                            na prawdziwe zdjęcia od hurtowni. */}
                        <span className="grid size-9 shrink-0 place-items-center rounded-ctl bg-paper text-mute" aria-hidden="true">
                          <Ikona nazwa={ikonaKategorii(a.kategoria)} rozmiar={16} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-mono text-[10px] text-mute">{a.sku} · {a.producent}</span>
                          <span className="mt-0.5 block truncate text-sm font-semibold text-ink">{a.nazwa}</span>
                        </span>
                      </span>
                      <span className="font-mono text-xs tabular-nums text-ink lg:text-right">
                        <span className="lg:hidden text-mute">Dokumenty </span>{liczba.format(a.stanSystemowy)} {a.jednostka}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-mute lg:text-right">
                        <span className="lg:hidden">Rezerwacje </span>{liczba.format(a.rezerwacje)}
                      </span>
                      <span className={`font-mono text-xs font-semibold tabular-nums lg:text-right ${stan === "zgodne" ? "text-ink" : "text-accent-ink"}`}>
                        <span className="lg:hidden font-normal text-mute">Dostępne </span>{liczba.format(dostepne(a))}
                      </span>
                      <span className="col-span-2 lg:col-span-1">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          stan === "zgodne" ? "bg-paper-2 text-mute" : "bg-accent-wash text-accent-ink"
                        }`}>
                          {stan !== "zgodne" && <Ikona nazwa="ostrzezenie" rozmiar={12} />}
                          {etykietaStanu[stan]}
                        </span>
                        {brakuje > 0 && (
                          <span className="ml-2 font-mono text-[10px] text-mute">domów {liczba.format(brakuje)}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      <div className="min-w-0 space-y-5">
        <section aria-labelledby="korekta-tytul" className="rounded-shell bg-shell p-1.5 ring-1 ring-hair xl:sticky xl:top-6">
          <div className="rounded-core bg-surface p-5 shadow-[var(--inner)]">
            <div className="flex items-center gap-2.5">
              <Ikona nazwa="korekta" className="text-accent" />
              <h2 id="korekta-tytul" className="font-display text-lg font-semibold text-ink">Korekta ręczna</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-mute">
              Wpisz stan z natury, gdy różni się od dokumentów. Import zostawiamy do przyjęć hurtowych.
            </p>

            <div className="mt-5 rounded-ctl bg-paper p-4 ring-1 ring-inset ring-hair">
              {wybrana ? (
                <>
                  <p className="font-mono text-[10px] text-mute">{wybrana.sku}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{wybrana.nazwa}</p>
                  <p className="mt-2 font-mono text-xs tabular-nums text-mute">
                    dokumenty {liczba.format(wybrana.stanSystemowy)} {wybrana.jednostka} · rezerwacje {liczba.format(wybrana.rezerwacje)} · dostępne {liczba.format(dostepne(wybrana))}
                  </p>
                </>
              ) : (
                <p className="text-sm text-mute">Wybierz pozycję z listy obok, żeby ją skorygować.</p>
              )}
            </div>

            <fieldset className="mt-5" disabled={!wybrana}>
              <legend className="sr-only">Parametry korekty</legend>

              <div className="flex gap-2" role="group" aria-label="Tryb korekty">
                {([["zmien", "Zmień o"], ["ustaw", "Ustaw na"]] as const).map(([id, etykieta]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={tryb === id}
                    onClick={() => setTryb(id)}
                    className={`pressable min-h-11 flex-1 rounded-full px-4 text-xs font-semibold ${
                      tryb === id ? "bg-ink text-white" : "bg-paper-2 text-mute hover:text-ink"
                    }`}
                  >
                    {etykieta}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-sm font-semibold text-ink">
                {tryb === "zmien" ? "O ile zmienić" : "Nowy stan"}
                <div className="mt-2 flex items-center gap-2">
                  {tryb === "zmien" && (
                    <button
                      type="button"
                      onClick={() => setWartosc((v) => String((Number(v.replace(",", ".")) || 0) - 1))}
                      aria-label="Zmniejsz o jeden"
                      className="pressable grid size-11 shrink-0 place-items-center rounded-ctl bg-paper-2 text-mute"
                    >
                      <Ikona nazwa="minus" />
                    </button>
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={wartosc}
                    onChange={(e) => { setWartosc(e.target.value); setBlad(null); }}
                    placeholder={tryb === "zmien" ? "np. -3 albo 12" : "np. 48"}
                    className="min-h-11 w-full rounded-ctl bg-paper px-4 text-center font-mono text-sm tabular-nums text-ink ring-1 ring-inset ring-hair placeholder:font-sans placeholder:text-mute focus:ring-accent"
                  />
                  {tryb === "zmien" && (
                    <button
                      type="button"
                      onClick={() => setWartosc((v) => String((Number(v.replace(",", ".")) || 0) + 1))}
                      aria-label="Zwiększ o jeden"
                      className="pressable grid size-11 shrink-0 place-items-center rounded-ctl bg-paper-2 text-mute"
                    >
                      <Ikona nazwa="plus" />
                    </button>
                  )}
                </div>
              </label>

              <label className="mt-4 block text-sm font-semibold text-ink">
                Powód
                <select
                  value={powod}
                  onChange={(e) => setPowod(e.target.value as PowodKorekty)}
                  className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair focus:ring-accent"
                >
                  {powodyKorekty.map((p) => (
                    <option key={p.id} value={p.id}>{p.nazwa}</option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block text-sm font-semibold text-ink">
                Notatka
                <input
                  type="text"
                  value={notatka}
                  onChange={(e) => setNotatka(e.target.value)}
                  placeholder="np. numer dokumentu WZ"
                  className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-4 text-sm font-normal text-ink ring-1 ring-inset ring-hair placeholder:text-mute focus:ring-accent"
                />
                <span className="mt-1.5 block text-xs font-normal text-mute">Nieobowiązkowa, ale po miesiącu bardzo pomaga.</span>
              </label>

              {blad && (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-ctl bg-accent-wash px-4 py-3 text-sm font-medium text-accent-ink">
                  <Ikona nazwa="ostrzezenie" rozmiar={16} />
                  {blad}
                </p>
              )}

              <button
                type="button"
                onClick={zapisz}
                className="pressable mt-5 min-h-12 w-full rounded-full bg-ink text-sm font-semibold text-white disabled:opacity-40"
              >
                Zapisz korektę
              </button>
            </fieldset>
          </div>
        </section>

        <section aria-labelledby="historia-tytul" className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="rounded-core bg-surface p-5 shadow-[var(--inner)]">
            <div className="flex items-center gap-2.5">
              <Ikona nazwa="historia" className="text-mute" />
              <h2 id="historia-tytul" className="font-display text-lg font-semibold text-ink">Historia korekt</h2>
            </div>
            {historia.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-mute">
                Jeszcze nic nie korygowano w tej sesji. Każda zmiana zapisze tu stan przed i po, powód oraz autora.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-hair">
                {historia.map((w, i) => (
                  <li key={`${w.sku}-${i}`} className="py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-ink">{w.nazwa}</span>
                      <span className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${w.roznica > 0 ? "text-ok" : "text-accent-ink"}`}>
                        {w.roznica > 0 ? "+" : ""}{liczba.format(w.roznica)}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] tabular-nums text-mute">
                      {liczba.format(w.przed)} na {liczba.format(w.po)} · {powodyKorekty.find((p) => p.id === w.powod)?.nazwa} · {w.autor} · {w.kiedy}
                    </p>
                    {w.notatka && <p className="mt-1 text-xs text-mute">{w.notatka}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
