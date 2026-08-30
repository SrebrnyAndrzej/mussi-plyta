"use client";

import { useMemo, useState } from "react";
import { Ikona } from "@/components/ikona";
import { slotyDemo, wydanieDemo, zleceniaDemo } from "@/data/produkcja-demo";
import {
  czyZakonczone,
  doWydania,
  etapy,
  kolejka,
  nastepnyEtap,
  obciazenie,
  odwolajOdbior,
  pilnosc,
  postep,
  stanRealizacji,
  ustawEtap,
  wolneMiejsca,
  zarezerwujOdbior,
  type Etap,
  type PilnoscZlecenia,
  type SlotOdbioru,
  type ZlecenieProdukcyjne,
} from "@/lib/produkcja";

const OPERATOR = "produkcja";
/* Dzień odniesienia demonstracji, żeby pilność zleceń była czytelna na pokazie. */
const DZIS = new Date("2026-08-30T08:00:00Z");

const tonPilnosci: Record<PilnoscZlecenia, string> = {
  "po-terminie": "bg-danger-paper text-accent-ink",
  zagrozone: "bg-[#fff7e8] text-warning",
  pilne: "bg-[#fff7e8] text-warning",
  spokojnie: "bg-[#edf7f0] text-ok",
};

const nazwaPilnosci: Record<PilnoscZlecenia, string> = {
  "po-terminie": "po terminie",
  zagrozone: "zagrożone",
  pilne: "pilne",
  spokojnie: "spokojnie",
};

const nazwaStanu: Record<string, string> = {
  oczekuje: "oczekuje",
  "w-toku": "w toku",
  gotowy: "gotowy",
  wstrzymany: "wstrzymany",
};

/**
 * Kolejka produkcji, plan odbiorów i realizacja częściowa.
 *
 * Kolejność, reguła następstwa etapów i pojemność okien odbioru
 * pochodzą z `src/lib/produkcja.ts`.
 */
export function KolejkaProdukcji() {
  const [zlecenia, setZlecenia] = useState<ZlecenieProdukcyjne[]>(zleceniaDemo);
  const [sloty, setSloty] = useState<SlotOdbioru[]>(slotyDemo);
  const [wybraneId, setWybraneId] = useState(zleceniaDemo[1].zamowienie);
  const [blad, setBlad] = useState<string | null>(null);

  const uporzadkowane = useMemo(() => kolejka(zlecenia, DZIS), [zlecenia]);
  const wybrane = zlecenia.find((z) => z.zamowienie === wybraneId) ?? zlecenia[0];
  const obciazenieDni = useMemo(() => obciazenie(zlecenia), [zlecenia]);
  const realizacja = stanRealizacji(wydanieDemo);
  const zostaje = doWydania(wydanieDemo);

  function przesun(etap: Etap, stan: "w-toku" | "gotowy" | "wstrzymany") {
    const wynik = ustawEtap(wybrane, etap, stan, OPERATOR);
    if (!wynik.ok) { setBlad(wynik.blad); return; }
    setZlecenia((obecne) => obecne.map((z) => (z.zamowienie === wybrane.zamowienie ? wynik.zlecenie : z)));
    setBlad(null);
  }

  function zapisz(slotId: string) {
    const wynik = zarezerwujOdbior(sloty, slotId, wybrane.zamowienie);
    if (!wynik.ok) { setBlad(wynik.blad); return; }
    setSloty(wynik.sloty);
    setBlad(null);
  }

  const maksGodziny = Math.max(...obciazenieDni.map((d) => d.godziny), 1);

  return (
    <div className="mt-8 grid gap-5">

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="overflow-hidden rounded-core bg-surface shadow-[var(--inner)]">
            <div className="hidden grid-cols-[1.3fr_.7fr_.7fr_1fr] gap-4 border-b border-hair bg-paper px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute md:grid">
              <span>Zlecenie</span><span>Termin</span><span>Stan</span><span>Etapy</span>
            </div>
            <div className="divide-y divide-hair">
              {uporzadkowane.map((z) => {
                const p = pilnosc(z, DZIS);
                const nastepny = nastepnyEtap(z);
                return (
                  <button
                    key={z.zamowienie}
                    type="button"
                    onClick={() => { setWybraneId(z.zamowienie); setBlad(null); }}
                    className={`grid w-full gap-3 px-5 py-4 text-left md:grid-cols-[1.3fr_.7fr_.7fr_1fr] md:items-center ${wybrane.zamowienie === z.zamowienie ? "bg-paper shadow-[inset_3px_0_0_var(--color-accent)]" : "hover:bg-paper/70"}`}
                  >
                    <span className="min-w-0">
                      <strong className="block font-mono text-xs text-ink">{z.zamowienie}</strong>
                      <span className="mt-1 block text-sm font-semibold text-ink">{z.klient}</span>
                    </span>
                    <span className="font-mono text-xs tabular-nums text-ink">{z.termin}</span>
                    <span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold ${tonPilnosci[p]}`}>
                        {czyZakonczone(z) ? "zakończone" : nazwaPilnosci[p]}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="flex h-1.5 gap-1" role="presentation">
                        {etapy.map((e) => (
                          <span
                            key={e.id}
                            className={`h-full flex-1 rounded-full ${z.etapy[e.id] === "gotowy" ? "bg-ok" : z.etapy[e.id] === "w-toku" ? "bg-accent" : z.etapy[e.id] === "wstrzymany" ? "bg-warning" : "bg-hair"}`}
                          />
                        ))}
                      </span>
                      <small className="mt-1.5 block text-[10px] text-mute">
                        {nastepny ? `dalej: ${etapy.find((e) => e.id === nastepny)?.nazwa}` : "komplet gotowy"}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Wybrane zlecenie</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">{wybrane.zamowienie}</h2>
            <p className="mt-1 text-sm font-semibold text-ink">{wybrane.klient}</p>
            <p className="mt-3 font-mono text-[11px] text-mute">
              Postęp {Math.round(postep(wybrane) * 100)}%, pracochłonność {wybrane.pracochlonnosc} godz.
            </p>

            <ul className="mt-5 divide-y divide-hair border-y border-hair">
              {etapy.map((e) => {
                const stan = wybrane.etapy[e.id];
                return (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm font-semibold text-ink">{e.nazwa}</strong>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${stan === "gotowy" ? "bg-[#edf7f0] text-ok" : stan === "w-toku" ? "bg-danger-paper text-accent-ink" : stan === "wstrzymany" ? "bg-[#fff7e8] text-warning" : "bg-paper text-mute"}`}>
                        {nazwaStanu[stan]}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      {stan !== "w-toku" && stan !== "gotowy" && (
                        <button type="button" onClick={() => przesun(e.id, "w-toku")} className="pressable min-h-11 rounded-full bg-paper px-3 text-[10px] font-semibold text-ink ring-1 ring-hair">
                          Rozpocznij
                        </button>
                      )}
                      {stan !== "gotowy" && (
                        <button type="button" onClick={() => przesun(e.id, "gotowy")} className="pressable min-h-11 rounded-full bg-accent px-3 text-[10px] font-semibold text-white">
                          Zamknij
                        </button>
                      )}
                      {stan !== "wstrzymany" && stan !== "gotowy" && (
                        <button type="button" onClick={() => przesun(e.id, "wstrzymany")} className="pressable min-h-11 rounded-full bg-paper px-3 text-[10px] font-semibold text-mute ring-1 ring-hair">
                          Wstrzymaj
                        </button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>

            {blad && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-ctl bg-[#fff7e8] p-3 text-[11px] font-semibold leading-5 text-warning ring-1 ring-[#f0dcb4]">
                <Ikona nazwa="ostrzezenie" className="mt-0.5 size-3.5 shrink-0" />
                {blad}
              </p>
            )}

            <div className="mt-5 rounded-core bg-paper p-4 ring-1 ring-hair">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">Realizacja</p>
              <p className={`mt-2 text-sm font-semibold ${realizacja === "pelna" ? "text-ok" : "text-warning"}`}>
                {realizacja === "pelna" ? "Komplet wydany" : realizacja === "czesciowa" ? "Wydanie częściowe" : "Nic nie wydano"}
              </p>
              {zostaje.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11px] leading-5 text-mute">
                  {zostaje.map((p) => (
                    <li key={p.sku}>{p.nazwa}: zostaje {p.zamowiono - p.wydano} z {p.zamowiono}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[11px] leading-5 text-mute">
                Klient odbiera to, co gotowe. Reszta zostaje na zamówieniu, zamiast blokować cały odbiór.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,.85fr)]">
        <section className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">Plan odbiorów</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">Okna na rampie</h2>
            <p className="mt-2 text-sm leading-6 text-mute">
              Zapisz {wybrane.zamowienie} na odbiór. Jedno zamówienie zajmuje jedno okno.
            </p>
            <ul className="mt-5 divide-y divide-hair border-y border-hair">
              {sloty.map((s) => {
                const wolne = wolneMiejsca(s);
                const nasze = s.zajete.includes(wybrane.zamowienie);
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <strong className="block font-mono text-xs text-ink">{s.dzien}, {s.od} do {s.do}</strong>
                      <small className="mt-1 block text-[10px] text-mute">
                        {wolne} z {s.pojemnosc} wolne{s.zajete.length > 0 ? `, zajęte przez ${s.zajete.join(", ")}` : ""}
                      </small>
                    </span>
                    {nasze ? (
                      <button type="button" onClick={() => { setSloty(odwolajOdbior(sloty, wybrane.zamowienie)); setBlad(null); }} className="pressable min-h-11 shrink-0 rounded-full bg-paper px-4 text-[10px] font-semibold text-ink ring-1 ring-hair">
                        Odwołaj
                      </button>
                    ) : (
                      <button type="button" disabled={wolne <= 0} onClick={() => zapisz(s.id)} className="pressable min-h-11 shrink-0 rounded-full bg-accent px-4 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-hair disabled:text-mute">
                        {wolne <= 0 ? "Pełne" : "Zapisz"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">Obciążenie</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">Co stoi na jaki termin</h2>
            <p className="mt-2 text-sm leading-6 text-mute">
              Spiętrzenie widać zanim nastąpi, więc termin da się przesunąć wcześniej niż w dniu odbioru.
            </p>
            <ul className="mt-5 space-y-3">
              {obciazenieDni.map((d) => (
                <li key={d.dzien}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-xs text-ink">{d.dzien}</span>
                    <span className="font-mono text-[11px] tabular-nums text-mute">
                      {d.godziny} godz., {d.zlecenia} zlec.
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper" role="presentation">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out)] ${d.godziny > 8 ? "bg-accent" : "bg-ok"}`}
                      style={{ width: `${(d.godziny / maksGodziny) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-5 text-mute">
              Dzień powyżej ośmiu godzin jest oznaczony akcentem. To jedna zmiana jednej osoby,
              a nie realna zdolność hurtowni, więc próg do potwierdzenia z produkcją.
            </p>
          </div>
        </section>
      </div>

    </div>
  );
}
