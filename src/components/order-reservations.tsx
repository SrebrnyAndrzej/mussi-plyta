"use client";

import { useMemo, useState } from "react";
import { Ikona } from "@/components/ikona";
import type { WarehouseOrderId, WarehouseOrderStatus } from "@/data/warehouse-demo";
import { podsumujRezerwacje, zarezerwuj, type PozycjaDoRezerwacji } from "@/lib/rezerwacje";

type PozycjaRezerwacji = PozycjaDoRezerwacji & {
  stan: number;
  jednostka: string;
};

const DEMO_TERAZ = new Date("2026-08-30T10:45:00+02:00");

const pozycjeWedlugZamowienia: Record<WarehouseOrderId, PozycjaRezerwacji[]> = {
  "M-2026-0848": [
    { sku: "KR-5981-BS-18", nazwa: "Płyta 5981 BS Dąb Palmowy 18 mm", ilosc: 6, stan: 17, jednostka: "ark." },
    { sku: "OB-5981-ABS2", nazwa: "Obrzeże ABS 2 mm 5981", ilosc: 42, stan: 52, jednostka: "mb" },
    { sku: "GTV-ZM-ECHC09", nazwa: "Zawias GTV cichy domyk", ilosc: 18, stan: 47, jednostka: "szt." },
  ],
  "M-2026-0847": [
    { sku: "HDF-BIA-3", nazwa: "HDF biały 3 mm", ilosc: 12, stan: 22, jednostka: "ark." },
    { sku: "BLU-TAND-500", nazwa: "Prowadnica Blum Tandem 500 mm", ilosc: 4, stan: 0, jednostka: "kpl." },
  ],
  "M-2026-0842": [
    { sku: "KR-5981-BS-18", nazwa: "Płyta 5981 BS Dąb Palmowy 18 mm", ilosc: 7, stan: 17, jednostka: "ark." },
    { sku: "OB-5981-ABS2", nazwa: "Obrzeże ABS 2 mm 5981", ilosc: 48, stan: 52, jednostka: "mb" },
    { sku: "BLU-TAND-500", nazwa: "Prowadnica Blum Tandem 500 mm", ilosc: 4, stan: 4, jednostka: "kpl." },
  ],
  "M-2026-0839": [
    { sku: "KR-5981-BS-18", nazwa: "Płyta meblowa 18 mm", ilosc: 9, stan: 17, jednostka: "ark." },
    { sku: "GTV-ZM-ECHC09", nazwa: "Zawias GTV cichy domyk", ilosc: 24, stan: 47, jednostka: "szt." },
  ],
  "M-2026-0835": [
    { sku: "HDF-BIA-3", nazwa: "HDF biały 3 mm", ilosc: 28, stan: 22, jednostka: "ark." },
    { sku: "OB-5981-ABS2", nazwa: "Obrzeże ABS 2 mm", ilosc: 64, stan: 52, jednostka: "mb" },
  ],
};

const statusTrzymaTwardaRezerwacje = (status: WarehouseOrderStatus) =>
  ["Przyjęte", "W produkcji", "Gotowe"].includes(status);

export function OrderReservations({
  orderId,
  status,
}: {
  orderId: WarehouseOrderId;
  status: WarehouseOrderStatus;
}) {
  const [odswiezenia, setOdswiezenia] = useState(0);
  const pozycje = pozycjeWedlugZamowienia[orderId];
  const twarda = statusTrzymaTwardaRezerwacje(status);
  const wynik = useMemo(
    () => zarezerwuj([], {
      zamowienie: orderId,
      pozycje,
      stany: Object.fromEntries(pozycje.map((pozycja) => [pozycja.sku, pozycja.stan])),
      twarda,
    }, DEMO_TERAZ),
    [orderId, pozycje, twarda, odswiezenia],
  );

  const podsumowanie = wynik.ok
    ? podsumujRezerwacje(wynik.rezerwacje, DEMO_TERAZ)
    : { aktywne: 0, sztuk: 0, najblizszeWygasniecie: null };

  return (
    <section aria-labelledby="rezerwacja-title" className="mt-5 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
      <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
              Kontrola dostępności
            </p>
            <h2 id="rezerwacja-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">
              Rezerwacja magazynowa
            </h2>
            <p className="mt-3 text-sm leading-6 text-mute">
              Portal blokuje cały komplet albo nie blokuje niczego. Dzięki temu operator nie potwierdzi terminu dla niepełnego zamówienia.
            </p>
          </div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold ${wynik.ok ? "bg-[#edf7f0] text-ok" : "bg-danger-paper text-accent-ink"}`}>
            <span className={`size-2 rounded-full ${wynik.ok ? "bg-ok" : "bg-accent"}`} />
            {wynik.ok ? (twarda ? "Rezerwacja twarda" : "Rezerwacja miękka") : "Brak pokrycia"}
          </span>
        </header>

        <dl className="mt-6 grid overflow-hidden rounded-core bg-paper ring-1 ring-hair sm:grid-cols-3">
          <div className="p-5 sm:border-r sm:border-hair">
            <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Indeksy</dt>
            <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">{pozycje.length}</dd>
          </div>
          <div className="border-t border-hair p-5 sm:border-r sm:border-t-0">
            <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Zarezerwowane</dt>
            <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">{podsumowanie.sztuk}</dd>
          </div>
          <div className="border-t border-hair p-5 sm:border-t-0">
            <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Ważność</dt>
            <dd className="mt-2 text-sm font-semibold text-ink">
              {!wynik.ok
                ? "nie utworzono"
                : podsumowanie.najblizszeWygasniecie
                  ? new Date(podsumowanie.najblizszeWygasniecie).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                  : "do wydania"}
            </dd>
          </div>
        </dl>

        <div className="mt-5 overflow-hidden rounded-core ring-1 ring-hair">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_.55fr_.55fr_.55fr] gap-4 border-b border-hair bg-paper px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute md:grid">
            <span>Towar</span><span className="text-right">Potrzeba</span><span className="text-right">Dostępne</span><span className="text-right">Po rezerwacji</span>
          </div>
          <ul className="divide-y divide-hair">
            {pozycje.map((pozycja) => {
              const brak = !wynik.ok ? wynik.braki.find((item) => item.sku === pozycja.sku) : undefined;
              const wolnePo = wynik.ok ? pozycja.stan - pozycja.ilosc : pozycja.stan;
              return (
                <li key={pozycja.sku} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.4fr)_.55fr_.55fr_.55fr] md:items-center">
                  <div className="min-w-0">
                    <strong className="font-mono text-xs text-ink">{pozycja.sku}</strong>
                    <p className="mt-1 text-sm font-semibold text-ink">{pozycja.nazwa}</p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-ink md:text-right">{pozycja.ilosc} {pozycja.jednostka}</span>
                  <span className={`font-mono text-xs tabular-nums md:text-right ${brak ? "text-accent-ink" : "text-mute"}`}>{pozycja.stan} {pozycja.jednostka}</span>
                  <strong className={`font-mono text-xs tabular-nums md:text-right ${brak ? "text-accent-ink" : "text-ok"}`}>
                    {brak ? `brakuje ${brak.brakuje}` : `${wolnePo} ${pozycja.jednostka}`}
                  </strong>
                </li>
              );
            })}
          </ul>
        </div>

        {!wynik.ok && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-ctl bg-danger-paper p-4 text-xs font-semibold leading-5 text-accent-ink ring-1 ring-accent/10">
            <Ikona nazwa="ostrzezenie" className="mt-0.5 size-4 shrink-0" />
            Rezerwacja nie powstała. Uzupełnij braki albo uzgodnij zamiennik, a następnie sprawdź komplet ponownie.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-mute">
            {wynik.ok
              ? twarda
                ? "Towar pozostaje zablokowany do wydania lub anulowania zamówienia."
                : "Miękka rezerwacja wygaśnie bez potwierdzenia zamówienia przez hurtownię."
              : "Stan żadnego indeksu nie został pomniejszony."}
          </p>
          <button type="button" onClick={() => setOdswiezenia((wartosc) => wartosc + 1)} className="pressable min-h-11 shrink-0 rounded-full bg-paper px-5 text-xs font-semibold text-ink ring-1 ring-hair">
            Sprawdź ponownie
          </button>
        </div>
      </div>
    </section>
  );
}
