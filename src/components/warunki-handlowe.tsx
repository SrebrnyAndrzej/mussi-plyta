"use client";

import { useMemo, useState } from "react";
import { dzisDemo, progiRabatowe } from "@/config/brief";
import { Ikona } from "@/components/ikona";
import { cenniki, cenyIndywidualne, indeksyDemo, kontrahenci } from "@/data/warunki-demo";
import { zloty } from "@/lib/pricing";
import {
  czyMoznaZlozycZamowienie,
  dostepnyLimit,
  doWyzszegoProgu,
  formyPlatnosci,
  obowiazujacyCennik,
  ustalCene,
  zmienWarunki,
  type FormaPlatnosci,
  type Kontrahent,
  type StatusHandlowy,
  type WpisAudytuWarunkow,
} from "@/lib/warunki";

const OPERATOR = "biuro";

const tonStatusu: Record<StatusHandlowy, string> = {
  aktywny: "bg-[#edf7f0] text-ok",
  weryfikacja: "bg-[#fff7e8] text-warning",
  blokada: "bg-danger-paper text-accent-ink",
};

const nazwaStatusu: Record<StatusHandlowy, string> = {
  aktywny: "Aktywny",
  weryfikacja: "Weryfikacja",
  blokada: "Blokada",
};

/**
 * Warunki handlowe kontrahenta w panelu hurtowni.
 *
 * Reguły cen, limitu i blokad liczy `src/lib/warunki.ts`. Ekran pokazuje,
 * skąd wzięła się cena, i sprawdza zamówienie zanim biuro je przyjmie.
 */
export function WarunkiHandlowe() {
  const [lista, setLista] = useState<Kontrahent[]>(kontrahenci);
  const [wybranyId, setWybranyId] = useState(kontrahenci[0].id);
  const [historia, setHistoria] = useState<WpisAudytuWarunkow[]>([]);
  const [powod, setPowod] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [proba, setProba] = useState(12000);
  const [dzien, setDzien] = useState(() => dzisDemo().toISOString().slice(0, 10));

  const wybrany = lista.find((k) => k.id === wybranyId) ?? lista[0];
  const dataCennika = useMemo(() => new Date(`${dzien}T12:00:00Z`), [dzien]);
  const cennik = obowiazujacyCennik(cenniki, dataCennika);
  const decyzja = czyMoznaZlozycZamowienie(wybrany, proba);
  const doProgu = doWyzszegoProgu(wybrany.obrotRoczny);
  const wolne = dostepnyLimit(wybrany);
  const wykorzystanie = wybrany.limitPrzyznany > 0
    ? Math.min(1, wybrany.limitWykorzystany / wybrany.limitPrzyznany)
    : 0;

  function zmien(zmiana: Parameters<typeof zmienWarunki>[1]) {
    const wynik = zmienWarunki(wybrany, zmiana, OPERATOR, powod);
    if (!wynik.ok) { setBlad(wynik.blad); return; }
    setLista((obecna) => obecna.map((k) => (k.id === wybrany.id ? wynik.kontrahent : k)));
    setHistoria((h) => [...wynik.wpisy, ...h]);
    setPowod("");
    setBlad(null);
  }

  return (
    <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">

      <section className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="overflow-hidden rounded-core bg-surface shadow-[var(--inner)]">
          <div className="hidden grid-cols-[1.4fr_.6fr_.9fr_1fr] gap-4 border-b border-hair bg-paper px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute md:grid">
            <span>Kontrahent</span><span>Próg</span><span>Płatność</span><span>Limit</span>
          </div>
          <div className="divide-y divide-hair">
            {lista.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => { setWybranyId(k.id); setBlad(null); }}
                className={`grid w-full gap-3 px-5 py-4 text-left md:grid-cols-[1.4fr_.6fr_.9fr_1fr] md:items-center ${wybrany.id === k.id ? "bg-paper shadow-[inset_3px_0_0_var(--color-accent)]" : "hover:bg-paper/70"}`}
              >
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-ink">{k.nazwa}</strong>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <small className="font-mono text-[10px] text-mute">{k.id}</small>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${tonStatusu[k.status]}`}>
                      {nazwaStatusu[k.status]}
                    </span>
                  </span>
                </span>
                <span className="font-mono text-xs font-semibold text-ink">{k.kodProgu}</span>
                <span className="text-xs text-mute">{formyPlatnosci.find((f) => f.id === k.formaPlatnosci)?.nazwa}</span>
                <span className="font-mono text-xs tabular-nums text-ink">
                  {k.limitPrzyznany === 0 ? "bez limitu kredytowego" : `${zloty.format(dostepnyLimit(k))} wolne`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Warunki kontrahenta</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">{wybrany.nazwa}</h2>

          <div className="mt-5 rounded-core bg-paper p-4 ring-1 ring-hair">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">Limit kupiecki</span>
              <span className="font-mono text-xs tabular-nums text-ink">
                {zloty.format(wybrany.limitWykorzystany)} z {zloty.format(wybrany.limitPrzyznany)}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface" role="presentation">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out)] ${wykorzystanie > 0.8 ? "bg-accent" : "bg-ok"}`}
                style={{ width: `${wykorzystanie * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-mute">{zloty.format(wolne)} pozostaje do wykorzystania</p>
          </div>

          <dl className="mt-4 divide-y divide-hair border-y border-hair text-xs">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-mute">Obrót roczny</dt>
              <dd className="font-mono tabular-nums text-ink">{zloty.format(wybrany.obrotRoczny)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-mute">Do wyższego progu</dt>
              <dd className="font-mono tabular-nums text-ink">
                {doProgu ? `${zloty.format(doProgu.brakuje)} do ${doProgu.kod}` : "najwyższy próg"}
              </dd>
            </div>
          </dl>

          <label className="mt-5 block text-xs font-semibold text-ink">
            Powód zmiany warunków
            <input
              type="text"
              value={powod}
              onChange={(e) => { setPowod(e.target.value); setBlad(null); }}
              placeholder="Na przykład: przekroczony próg obrotu"
              className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair placeholder:text-mute/70 focus:ring-accent"
            />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-ink">
              Próg rabatowy
              <select
                value={wybrany.kodProgu}
                onChange={(e) => zmien({ kodProgu: e.target.value })}
                className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair focus:ring-accent"
              >
                {progiRabatowe.map((p) => <option key={p.kod} value={p.kod}>{p.kod}, {p.nazwa}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-ink">
              Forma płatności
              <select
                value={wybrany.formaPlatnosci}
                onChange={(e) => zmien({ formaPlatnosci: e.target.value as FormaPlatnosci })}
                className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair focus:ring-accent"
              >
                {formyPlatnosci.map((f) => <option key={f.id} value={f.id}>{f.nazwa}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-ink">
              Limit kupiecki
              <input
                type="number"
                min={0}
                step={1000}
                value={wybrany.limitPrzyznany}
                onChange={(e) => zmien({ limitPrzyznany: Number(e.target.value) })}
                className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 font-mono text-sm tabular-nums text-ink ring-1 ring-inset ring-hair focus:ring-accent"
              />
            </label>
            <label className="block text-xs font-semibold text-ink">
              Status handlowy
              <select
                value={wybrany.status}
                onChange={(e) => zmien({ status: e.target.value as StatusHandlowy })}
                className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair focus:ring-accent"
              >
                {(Object.keys(nazwaStatusu) as StatusHandlowy[]).map((s) => (
                  <option key={s} value={s}>{nazwaStatusu[s]}</option>
                ))}
              </select>
            </label>
          </div>

          {blad && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-ctl bg-[#fff7e8] p-3 text-[11px] font-semibold leading-5 text-warning ring-1 ring-[#f0dcb4]">
              <Ikona nazwa="ostrzezenie" className="mt-0.5 size-3.5 shrink-0" />
              {blad}
            </p>
          )}

          <div className="mt-5 rounded-core bg-paper p-4 ring-1 ring-hair">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">Sprawdź zamówienie</p>
            <label className="mt-2 block">
              <span className="sr-only">Wartość brutto zamówienia</span>
              <input
                type="number"
                min={0}
                step={500}
                value={proba}
                onChange={(e) => setProba(Number(e.target.value))}
                className="min-h-11 w-full rounded-ctl bg-surface px-3 font-mono text-sm tabular-nums text-ink ring-1 ring-inset ring-hair focus:ring-accent"
              />
            </label>
            <p className={`mt-3 text-xs font-semibold leading-5 ${decyzja.ok ? "text-ok" : "text-accent-ink"}`}>
              {decyzja.ok ? "Zamówienie przechodzi." : decyzja.blad}
            </p>
            {decyzja.ostrzezenie && <p className="mt-1 text-[11px] leading-5 text-warning">{decyzja.ostrzezenie}</p>}
          </div>

          <div className="mt-5">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
              <Ikona nazwa="historia" className="size-3.5" />
              Audyt zmian
            </p>
            {historia.length === 0 ? (
              <p className="mt-2 text-[11px] text-mute">Brak zmian w tej sesji.</p>
            ) : (
              <ul className="mt-2 divide-y divide-hair text-[11px]">
                {historia.slice(0, 6).map((w, i) => (
                  <li key={`${w.kontrahent}-${w.pole}-${i}`} className="flex flex-wrap gap-x-2 py-2">
                    <strong className="text-ink">{w.pole}</strong>
                    <span className="text-mute">{w.przed} na {w.po}</span>
                    <span className="ml-auto font-mono text-[10px] text-mute">{w.autor}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      <section className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair xl:col-span-2">
        <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">Cenniki</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">
                Skąd bierze się cena
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
                Cena negocjowana indywidualnie bije próg rabatowy, bo została uzgodniona wprost.
                Przesuń datę, żeby zobaczyć wejście cennika wrześniowego.
              </p>
            </div>
            <label className="block shrink-0 text-xs font-semibold text-ink">
              Dzień wyceny
              <input
                type="date"
                value={dzien}
                onChange={(e) => setDzien(e.target.value)}
                className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 font-mono text-sm text-ink ring-1 ring-inset ring-hair focus:ring-accent sm:w-48"
              />
            </label>
          </div>

          <p className="mt-4 font-mono text-[11px] text-mute">
            Obowiązuje: <span className="text-ink">{cennik ? cennik.nazwa : "brak cennika na ten dzień"}</span>
          </p>

          <div className="mt-5 overflow-x-auto rounded-core ring-1 ring-hair">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-hair bg-paper font-mono text-[9px] uppercase tracking-[0.1em] text-mute">
                  <th scope="col" className="px-5 py-3 text-left font-semibold">Indeks</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Katalogowa</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Dla kontrahenta</th>
                  <th scope="col" className="px-5 py-3 text-left font-semibold">Źródło</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {indeksyDemo.map((indeks) => {
                  const c = ustalCene(indeks.sku, wybrany, { cenniki, indywidualne: cenyIndywidualne }, dataCennika);
                  return (
                    <tr key={indeks.sku}>
                      <td className="px-5 py-3">
                        <span className="block font-semibold text-ink">{indeks.nazwa}</span>
                        <span className="font-mono text-[10px] text-mute">{indeks.sku}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-mute">
                        {c.cenaKatalogowa === null ? "brak" : zloty.format(c.cenaKatalogowa)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-ink">
                        {c.zrodlo === "brak" ? "brak" : zloty.format(c.cena)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${c.zrodlo === "indywidualna" ? "bg-danger-paper text-accent-ink" : c.zrodlo === "brak" ? "bg-paper text-mute" : "bg-[#edf7f0] text-ok"}`}>
                          {c.zrodlo === "indywidualna" ? "cena indywidualna"
                            : c.zrodlo === "prog" ? `próg ${wybrany.kodProgu}, rabat ${Math.round(c.rabat * 100)}%`
                            : c.zrodlo === "katalogowa" ? "cena katalogowa"
                            : "poza cennikiem"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
