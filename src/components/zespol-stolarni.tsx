"use client";

import { useState } from "react";
import { Ikona } from "@/components/ikona";
import { zespolDemo } from "@/data/zespol-demo";
import {
  czyMozeZlozyc,
  podsumujZespol,
  role,
  ustawLimit,
  wylaczKonto,
  zmienRole,
  type Czlonek,
  type Rola,
} from "@/lib/organizacja";

/**
 * Zespół stolarni: kto może złożyć zamówienie i do jakiej kwoty.
 *
 * Zakres zawężony przez klienta. To nie jest pełny CRM, tylko odpowiedź
 * na pytanie, kto po stronie stolarni ma prawo kupować w imieniu firmy.
 */
export function ZespolStolarni() {
  const [zespol, setZespol] = useState<Czlonek[]>(zespolDemo);
  const [blad, setBlad] = useState<string | null>(null);
  const [proba, setProba] = useState(8000);

  /* W wersji z logowaniem to będzie zalogowany użytkownik. */
  const jaId = "U-1";
  const ja = zespol.find((c) => c.id === jaId)!;
  const p = podsumujZespol(zespol);

  function wykonaj(wynik: ReturnType<typeof zmienRole>) {
    if (!wynik.ok) { setBlad(wynik.blad); return; }
    setZespol(wynik.zespol);
    setBlad(null);
  }

  return (
    <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">

      <section className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="overflow-hidden rounded-core bg-surface shadow-[var(--inner)]">
          <div className="hidden grid-cols-[1.4fr_.8fr_.9fr_auto] gap-4 border-b border-hair bg-paper px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute md:grid">
            <span>Osoba</span><span>Rola</span><span>Limit zamówienia</span><span>Konto</span>
          </div>
          <ul className="divide-y divide-hair">
            {zespol.map((c) => (
              <li key={c.id} className={`grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_.8fr_.9fr_auto] md:items-center ${c.aktywny ? "" : "bg-paper/60"}`}>
                <div className="min-w-0">
                  <strong className={`block text-sm font-semibold ${c.aktywny ? "text-ink" : "text-mute"}`}>{c.imie}</strong>
                  <small className="mt-1 block truncate font-mono text-[10px] text-mute">{c.email}</small>
                </div>

                <label className="block min-w-0">
                  <span className="sr-only">Rola: {c.imie}</span>
                  <select
                    value={c.rola}
                    disabled={!c.aktywny}
                    onChange={(e) => wykonaj(zmienRole(zespol, c.id, e.target.value as Rola, ja))}
                    className="min-h-11 w-full rounded-ctl bg-paper px-3 text-sm text-ink ring-1 ring-inset ring-hair focus:ring-accent disabled:text-mute"
                  >
                    {(Object.keys(role) as Rola[]).map((r) => (
                      <option key={r} value={r}>{role[r].nazwa}</option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="sr-only">Limit akceptacji: {c.imie}</span>
                  {role[c.rola].limitowana ? (
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={c.limitAkceptacji ?? 0}
                      disabled={!c.aktywny}
                      onChange={(e) => wykonaj(ustawLimit(zespol, c.id, Number(e.target.value), ja))}
                      className="min-h-11 w-full rounded-ctl bg-paper px-3 font-mono text-sm tabular-nums text-ink ring-1 ring-inset ring-hair focus:ring-accent disabled:text-mute"
                    />
                  ) : (
                    <span className="block py-3 font-mono text-xs text-mute">bez limitu</span>
                  )}
                </label>

                <div className="flex justify-start md:justify-end">
                  {c.aktywny ? (
                    <button
                      type="button"
                      onClick={() => wykonaj(wylaczKonto(zespol, c.id, ja))}
                      className="pressable min-h-11 rounded-full bg-paper px-4 text-[10px] font-semibold text-mute ring-1 ring-hair"
                    >
                      Wyłącz
                    </button>
                  ) : (
                    <span className="rounded-full bg-paper px-3 py-1.5 text-[9px] font-semibold text-mute">wyłączone</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <aside className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Konto firmy</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">Kto zamawia</h2>

          <dl className="mt-5 divide-y divide-hair border-y border-hair text-xs">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-mute">Osoby aktywne</dt>
              <dd className="font-mono tabular-nums font-semibold text-ink">{p.aktywni}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-mute">Mogą zamawiać</dt>
              <dd className="font-mono tabular-nums font-semibold text-ink">{p.zamawiajacy}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-mute">Bez limitu kwoty</dt>
              <dd className="font-mono tabular-nums font-semibold text-ink">{p.bezLimitu}</dd>
            </div>
          </dl>

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
            <ul className="mt-3 space-y-2">
              {zespol.filter((c) => c.aktywny).map((c) => {
                const d = czyMozeZlozyc(c, proba, zespol);
                return (
                  <li key={c.id} className="flex flex-wrap items-baseline gap-x-2 text-[11px] leading-5">
                    <strong className="text-ink">{c.imie}</strong>
                    {!d.ok ? (
                      <span className="text-accent-ink">{d.blad}</span>
                    ) : d.wymagaAkceptacji ? (
                      <span className="text-warning">
                        akceptuje {d.akceptujacy.map((a) => a.imie).join(", ")}
                      </span>
                    ) : (
                      <span className="text-ok">składa od ręki</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] leading-5 text-mute">
              Przekroczenie limitu nie jest odmową. Zamówienie idzie do akceptacji,
              bo zatrzymanie kupującego w środku pracy kosztuje więcej niż jedno kliknięcie właściciela.
            </p>
          </div>

          <div className="mt-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">Role</p>
            <ul className="mt-2 space-y-2 text-[11px] leading-5">
              {(Object.keys(role) as Rola[]).map((r) => (
                <li key={r}>
                  <strong className="text-ink">{role[r].nazwa}</strong>
                  <span className="text-mute">. {role[r].opis}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

    </div>
  );
}
