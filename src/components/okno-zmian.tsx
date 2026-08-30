"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { terminy as konfigTerminy } from "@/config/brief";
import { Ikona } from "@/components/ikona";
import { activeOrder } from "@/data/portal-demo";
import {
  aktualnaWersja,
  koniecOknaZmian,
  pozostalyCzas,
  stanOknaZmian,
  utworzWersje,
  wartoscPozycji,
  zlozWniosekOZmiane,
  type PozycjaZamowienia,
  type WpisAudytuZamowienia,
  type Zamowienie,
} from "@/lib/zamowienia";
import { zloty } from "@/lib/pricing";

const AUTOR = "stolarnia-nowak";

/**
 * Chwila przyjęcia zamówienia, ustalona raz na sesję przeglądarki.
 * Na serwerze nie ma czego kotwiczyć, bo i tak nic z tego nie renderujemy
 * przed hydratacją.
 */
let kotwicaPrzyjecia: number | null = null;

function przyjecieZamowienia(): number {
  if (typeof window === "undefined") return 0;
  if (kotwicaPrzyjecia === null) {
    kotwicaPrzyjecia = Date.now() - activeOrder.godzinOdPrzyjecia * 3_600_000;
  }
  return kotwicaPrzyjecia;
}

const KROK_ZEGARA = 30_000;

function subskrybujZegar(przeliczPonownie: () => void) {
  const zegar = setInterval(przeliczPonownie, KROK_ZEGARA);
  return () => clearInterval(zegar);
}

/* Kwantyzacja do pełnych 30 sekund, żeby zegar nie budził komponentu bez potrzeby. */
const zegarKlienta = () => Math.floor(Date.now() / KROK_ZEGARA) * KROK_ZEGARA;
const zegarSerwera = () => null;

function zbudujZamowienie(): Zamowienie {
  const przyjeteO = new Date(przyjecieZamowienia());
  const pozycje: PozycjaZamowienia[] = activeOrder.pozycje.map((p) => ({ ...p }));
  return {
    id: activeOrder.id,
    status: "okno-zmian",
    przyjeteO,
    terminOczekiwany: null,
    terminPotwierdzony: null,
    wersje: [
      {
        numer: 1,
        pozycje,
        wartoscNetto: wartoscPozycji(pozycje),
        prognoza: new Date(przyjeteO.getTime() + 6 * 24 * 3_600_000),
        utworzona: przyjeteO,
        autor: AUTOR,
        powod: null,
      },
    ],
  };
}

/**
 * Okno zmian zamówienia po stronie klienta.
 *
 * Licznik liczy naprawdę, z silnika, a nie z wpisanego tekstu. Po zamknięciu
 * okna edycja zamienia się we wniosek o zmianę, który nie modyfikuje zamówienia.
 *
 * Czas przyjęcia jest zakotwiczony względem wejścia na stronę, żeby demo
 * zawsze pokazywało żywe okno. W wersji z bazą przyjdzie z zamówienia.
 */
export function OknoZmian() {
  const tik = useSyncExternalStore(subskrybujZegar, zegarKlienta, zegarSerwera);
  const [zamowienie, setZamowienie] = useState<Zamowienie>(zbudujZamowienie);
  const [historia, setHistoria] = useState<WpisAudytuZamowienia[]>([]);
  const [powod, setPowod] = useState("");
  const [tresc, setTresc] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [ilosci, setIlosci] = useState<Record<string, number>>(() =>
    Object.fromEntries(activeOrder.pozycje.map((p) => [p.id, p.ilosc])),
  );

  const teraz = useMemo(() => (tik === null ? null : new Date(tik)), [tik]);

  const stan = useMemo(
    () => (teraz ? stanOknaZmian(zamowienie.status, zamowienie.przyjeteO, teraz) : null),
    [zamowienie, teraz],
  );

  if (!teraz || !stan) {
    return (
      <section className="mt-6 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="rounded-core bg-surface p-6 shadow-[var(--inner)]">
          <p className="text-sm text-mute">Wczytywanie okna zmian</p>
        </div>
      </section>
    );
  }

  const wersja = aktualnaWersja(zamowienie);
  const otwarte = stan.tryb === "nowa-wersja";
  const koniec = koniecOknaZmian(zamowienie.przyjeteO!);
  const zmienione = wersja.pozycje.some((p) => ilosci[p.id] !== p.ilosc);

  function zapiszWersje() {
    const pozycje = aktualnaWersja(zamowienie).pozycje.map((p) => ({
      ...p,
      ilosc: ilosci[p.id],
      netto: Math.round((p.netto / p.ilosc) * ilosci[p.id] * 100) / 100,
    }));

    const wynik = utworzWersje(
      zamowienie,
      { pozycje, powod, autor: AUTOR, prognoza: aktualnaWersja(zamowienie).prognoza },
      new Date(),
    );

    if (!wynik.ok) {
      setBlad(wynik.blad);
      setKomunikat(null);
      return;
    }
    setZamowienie(wynik.zamowienie);
    setHistoria((obecna) => [wynik.wpis, ...obecna]);
    setPowod("");
    setBlad(null);
    setKomunikat(`Zapisano wersję ${wynik.wersja.numer}. Poprzednia została w historii.`);
  }

  function zapiszWniosek() {
    const wynik = zlozWniosekOZmiane(zamowienie, tresc, AUTOR, new Date());
    if (!wynik.ok) {
      setBlad(wynik.blad);
      setKomunikat(null);
      return;
    }
    setHistoria((obecna) => [wynik.wpis, ...obecna]);
    setTresc("");
    setBlad(null);
    setKomunikat("Wniosek trafił do hurtowni. Zamówienie zostaje bez zmian do jej decyzji.");
  }

  return (
    <section aria-labelledby="okno-zmian-tytul" className="mt-6 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
      <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
              Wersja {wersja.numer} zamówienia {zamowienie.id}
            </p>
            <h2 id="okno-zmian-tytul" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">
              {otwarte ? "Okno zmian jest otwarte" : "Okno zmian zamknięte"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-mute">
              {otwarte
                ? `Zmiany są możliwe przez ${konfigTerminy.oknoZmianGodzin} godzin od przyjęcia zamówienia. Każda zmiana tworzy nową wersję, poprzednia zostaje w historii.`
                : "Po zamknięciu okna zamówienia nie da się już zmienić samodzielnie. Zostaje wniosek o zmianę, o którym decyduje hurtownia."}
            </p>
          </div>

          <div className={`shrink-0 rounded-core p-5 ring-1 ${otwarte ? "bg-danger-paper ring-accent/10" : "bg-paper ring-hair"}`}>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">
              {otwarte ? "Pozostało" : "Okno zamknięte"}
            </p>
            <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${otwarte ? "text-accent-ink" : "text-ink"}`}>
              {otwarte
                ? pozostalyCzas(stan.pozostaloMs)
                : koniec.toLocaleString("pl-PL", { day: "numeric", month: "long" })}
            </p>
            <p className="mt-2 font-mono text-[11px] text-mute">
              {otwarte ? "do " : "zamknięte "}
              {koniec.toLocaleString("pl-PL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {otwarte ? (
          <div className="mt-7">
            <div className="overflow-hidden rounded-core ring-1 ring-hair">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_.6fr_.6fr] gap-4 border-b border-hair bg-paper px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute md:grid">
                <span>Pozycja</span><span className="text-right">Ilość</span><span className="text-right">Wartość netto</span>
              </div>
              <ul className="divide-y divide-hair bg-surface">
                {wersja.pozycje.map((p) => (
                  <li key={p.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.4fr)_.6fr_.6fr] md:items-center">
                    <span className="min-w-0 text-sm font-semibold text-ink">{p.nazwa}</span>
                    <label className="md:text-right">
                      <span className="sr-only">Ilość: {p.nazwa}</span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={ilosci[p.id]}
                        onChange={(event) => {
                          setIlosci((obecne) => ({ ...obecne, [p.id]: Number(event.target.value) }));
                          setKomunikat(null);
                          setBlad(null);
                        }}
                        className="min-h-11 w-full rounded-ctl bg-paper px-3 text-right font-mono text-sm tabular-nums text-ink ring-1 ring-inset ring-hair focus:ring-accent md:w-24"
                      />
                    </label>
                    <strong className="font-mono text-sm tabular-nums text-mute md:text-right">
                      {zloty.format(Math.round((p.netto / p.ilosc) * ilosci[p.id] * 100) / 100)}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block min-w-0 flex-1 text-xs font-semibold text-ink">
                Powód zmiany
                <input
                  type="text"
                  value={powod}
                  onChange={(event) => { setPowod(event.target.value); setBlad(null); }}
                  placeholder="Na przykład: klient dołożył pięć prowadnic"
                  className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair placeholder:text-mute/70 focus:ring-accent"
                />
              </label>
              <button
                type="button"
                onClick={zapiszWersje}
                disabled={!zmienione || powod.trim() === ""}
                className="pressable min-h-11 shrink-0 rounded-full bg-accent px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-hair disabled:text-mute"
              >
                Zapisz nową wersję
              </button>
            </div>
            {!zmienione && (
              <p className="mt-2 text-xs text-mute">Zmień ilość którejś pozycji, żeby utworzyć wersję.</p>
            )}
          </div>
        ) : (
          <div className="mt-7">
            <label className="block text-xs font-semibold text-ink">
              Wniosek o zmianę
              <textarea
                value={tresc}
                onChange={(event) => { setTresc(event.target.value); setBlad(null); }}
                placeholder="Opisz, o jaką zmianę chodzi. Hurtownia zdecyduje, czy da się ją jeszcze wprowadzić."
                className="mt-2 min-h-28 w-full rounded-ctl bg-paper p-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair placeholder:text-mute/70 focus:ring-accent"
              />
            </label>
            <button
              type="button"
              onClick={zapiszWniosek}
              disabled={tresc.trim().length < 10}
              className="pressable mt-4 min-h-11 rounded-full bg-accent px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-hair disabled:text-mute"
            >
              Wyślij wniosek
            </button>
          </div>
        )}

        {blad && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-ctl bg-[#fff7e8] p-4 text-xs font-semibold leading-5 text-warning ring-1 ring-[#f0dcb4]">
            <Ikona nazwa="ostrzezenie" className="mt-0.5 size-3.5 shrink-0" />
            {blad}
          </p>
        )}
        {komunikat && (
          <p aria-live="polite" className="mt-4 rounded-ctl bg-[#edf7f0] p-4 text-xs font-semibold leading-5 text-ok">
            {komunikat}
          </p>
        )}

        <div className="mt-6 rounded-core bg-paper p-5 ring-1 ring-hair">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
            <Ikona nazwa="historia" className="size-3.5" />
            Historia wersji
          </p>
          <ol className="mt-3 divide-y divide-hair text-xs">
            {zamowienie.wersje.slice().reverse().map((w) => (
              <li key={w.numer} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
                <strong className="font-mono font-semibold text-ink">Wersja {w.numer}</strong>
                <span className="font-mono tabular-nums text-ink">{zloty.format(w.wartoscNetto)}</span>
                <span className="text-mute">{w.powod ?? "wersja pierwotna"}</span>
                <span className="ml-auto font-mono text-[10px] text-mute">
                  {w.utworzona.toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ol>
          {historia.length > 0 && (
            <p className="mt-3 font-mono text-[10px] text-mute">
              Wpisów w audycie: {historia.length}
            </p>
          )}
        </div>

      </div>
    </section>
  );
}
