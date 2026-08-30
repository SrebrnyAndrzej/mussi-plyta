"use client";

import { useMemo, useState } from "react";
import { Ikona } from "@/components/ikona";
import { podmiotyFakturujace } from "@/config/brief";
import type { WarehouseOrderStatus } from "@/data/warehouse-demo";
import { pozycjeZamowienia } from "@/data/warehouse-demo";
import {
  kompletDlaZamowienia,
  oznaczKsef,
  rodzaje,
  sciezkaAwaryjna,
  wystawFaktury,
  wystawKorekte,
  wystawPotwierdzenie,
  wystawWz,
  type DokumentWystawiony,
  type RodzajDokumentu,
} from "@/lib/dokumenty";
import { czyPodmiotGotowy, sugerowanyPodzial } from "@/lib/fakturowanie";
import { zloty } from "@/lib/pricing";
import {
  wartoscPozycji,
  type StatusZamowienia,
  type Zamowienie,
} from "@/lib/zamowienia";

const OPERATOR = "biuro";

/** Statusy z kolejki hurtowni na model zamówienia z silnika. */
const naStatusSilnika: Record<WarehouseOrderStatus, StatusZamowienia> = {
  "Nowe": "okno-zmian",
  "Do weryfikacji": "okno-zmian",
  "Przyjęte": "zablokowane",
  "W produkcji": "w-produkcji",
  "Gotowe": "gotowe-do-odbioru",
  "Wstrzymane": "oczekuje-na-towar",
};

const opisy: Record<RodzajDokumentu, string> = {
  potwierdzenie: "Zapisuje wersję, cenę i termin widoczne w chwili akceptacji.",
  wz: "Powstaje dla faktycznie wydanego kompletu i zamyka rezerwację.",
  faktura: "Osobne dokumenty podmiotów pozostają spięte numerem zamówienia Mussi.",
  korekta: "Może odwołać się wyłącznie do wystawionej faktury i jej migawki danych.",
};

/**
 * Ścieżka dokumentów jednego zamówienia w panelu hurtowni.
 *
 * Cała logika, łącznie z numeracją, VAT i tym, co wolno wystawić w danym
 * statusie, siedzi w `src/lib/dokumenty.ts`. Ten komponent tylko ją pokazuje.
 */
export function OrderDocumentWorkflow({
  orderId,
  totalNet,
  status,
}: {
  orderId: string;
  totalNet: number;
  status: WarehouseOrderStatus;
}) {
  const [wystawione, setWystawione] = useState<Record<string, DokumentWystawiony[]>>({});
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [blokady, setBlokady] = useState<string[]>([]);

  const pozycje = useMemo(() => pozycjeZamowienia(totalNet), [totalNet]);

  const zamowienie: Zamowienie = useMemo(
    () => ({
      id: orderId,
      status: naStatusSilnika[status],
      przyjeteO: null,
      terminOczekiwany: null,
      terminPotwierdzony: null,
      wersje: [
        {
          numer: 1,
          pozycje: [{ id: "calosc", nazwa: "Zamówienie", ilosc: 1, netto: totalNet }],
          wartoscNetto: wartoscPozycji([{ id: "calosc", nazwa: "Zamówienie", ilosc: 1, netto: totalNet }]),
          prognoza: new Date(),
          utworzona: new Date(),
          autor: OPERATOR,
          powod: null,
        },
      ],
    }),
    [orderId, status, totalNet],
  );

  const dokumenty = wystawione[orderId] ?? [];
  const komplet = kompletDlaZamowienia(orderId, dokumenty);
  const faktura = dokumenty.find((d) => d.rodzaj === "faktura") ?? null;
  const awaria = sciezkaAwaryjna(dokumenty);
  const gotowePodmioty = podmiotyFakturujace.filter(czyPodmiotGotowy).length;

  function dodaj(nowe: DokumentWystawiony[], tresc: string) {
    setWystawione((obecne) => ({ ...obecne, [orderId]: [...(obecne[orderId] ?? []), ...nowe] }));
    setBlokady([]);
    setKomunikat(tresc);
  }

  function potwierdz() {
    const wynik = wystawPotwierdzenie(zamowienie, pozycje, OPERATOR);
    if (!wynik.ok) { setBlokady([wynik.blad]); setKomunikat(null); return; }
    dodaj([wynik.dokument], `Potwierdzenie ${wynik.dokument.numer} zapisało wersję ${wynik.dokument.wersja} i kwotę ${zloty.format(wynik.dokument.brutto)} brutto.`);
  }

  function wydaj() {
    const wynik = wystawWz(zamowienie, { podmiot: "plyty", pozycje, autor: OPERATOR });
    if (!wynik.ok) { setBlokady([wynik.blad]); setKomunikat(null); return; }
    dodaj([wynik.dokument], wynik.dokument.numer
      ? `Wydanie ${wynik.dokument.numer} zamyka rezerwację.`
      : "WZ utworzone. Numer pojawi się po nadaniu serii w kartotece podmiotów.");
  }

  function fakturuj() {
    const wynik = wystawFaktury(zamowienie, pozycje, sugerowanyPodzial(pozycje), OPERATOR);
    if (!wynik.ok) { setBlokady(wynik.blokady.length > 0 ? wynik.blokady : [wynik.blad]); setKomunikat(null); return; }
    /* Demonstracja adaptera: pierwsza faktura nie przechodzi do KSeF. */
    const zeStanem = wynik.dokumenty.map((d, i) => oznaczKsef(d, i === 0 ? "blad" : "wyslany"));
    dodaj(zeStanem, `Wystawiono ${zeStanem.length} faktury, po jednej na podmiot.`);
  }

  function koryguj() {
    if (!faktura) return;
    const mniej = faktura.pozycje.map((p, i) => (i === 0 ? { ...p, netto: Math.round(p.netto * 0.9 * 100) / 100 } : p));
    const wynik = wystawKorekte(faktura, mniej, "Pomyłka w metrażu obrzeża", OPERATOR);
    if (!wynik.ok) { setBlokady([wynik.blad]); setKomunikat(null); return; }
    dodaj([wynik.dokument], `Korekta do ${wynik.dokument.koryguje} na ${zloty.format(wynik.dokument.brutto)} brutto.`);
  }

  const kroki: Array<{
    rodzaj: RodzajDokumentu;
    akcja: (() => void) | null;
    etykieta: string;
    dostepna: boolean;
  }> = [
    { rodzaj: "potwierdzenie", akcja: potwierdz, etykieta: "Utwórz potwierdzenie", dostepna: true },
    { rodzaj: "wz", akcja: wydaj, etykieta: "Utwórz WZ", dostepna: true },
    { rodzaj: "faktura", akcja: fakturuj, etykieta: "Wystaw faktury", dostepna: gotowePodmioty > 0 },
    { rodzaj: "korekta", akcja: koryguj, etykieta: "Wystaw korektę", dostepna: faktura !== null },
  ];

  return (
    <section aria-labelledby="pakiet-dokumentow-title" className="mt-5 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
      <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
        <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.55fr)] lg:items-start">
          <div className="min-w-0 max-w-2xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
              Dokumenty zamówienia
            </p>
            <h2 id="pakiet-dokumentow-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">
              Jeden pakiet, jedna wersja
            </h2>
            <p className="mt-3 text-sm leading-6 text-mute">
              Operator widzi całą ścieżkę dokumentów pod numerem {orderId}. Każdy dokument
              zachowuje dane obowiązujące w chwili utworzenia.
            </p>
          </div>
          <dl className="grid grid-cols-2 overflow-hidden rounded-core bg-paper ring-1 ring-hair">
            <div className="border-r border-hair p-4">
              <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Wersja</dt>
              <dd className="mt-2 font-mono text-lg font-semibold text-ink">
                {String(zamowienie.wersje.length).padStart(2, "0")}
              </dd>
            </div>
            <div className="p-4">
              <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Wystawione</dt>
              <dd className="mt-2 font-mono text-lg font-semibold tabular-nums text-ink">
                {dokumenty.length}
              </dd>
            </div>
            <div className="col-span-2 border-t border-hair px-4 py-3 text-xs text-mute">
              {komplet.brakuje.length === 0
                ? "Komplet zamknięty. Cena i podział pozycji nie zmienią się po aktualizacji cennika."
                : `Brakuje: ${komplet.brakuje.map((r) => rodzaje[r].nazwa.toLocaleLowerCase("pl")).join(", ")}.`}
            </div>
          </dl>
        </header>

        <ol className="mt-7 overflow-hidden rounded-core ring-1 ring-hair">
          {kroki.map((krok, index) => {
            const wydane = dokumenty.filter((d) => d.rodzaj === krok.rodzaj);
            const gotowy = wydane.length > 0;
            return (
              <li key={krok.rodzaj} className="grid gap-4 border-b border-hair px-5 py-5 last:border-b-0 md:grid-cols-[44px_minmax(0,1fr)_auto] md:items-center">
                <span className={`flex size-10 items-center justify-center rounded-ctl font-mono text-xs font-semibold ${gotowy ? "bg-[#edf7f0] text-ok" : krok.dostepna ? "bg-danger-paper text-accent-ink" : "bg-paper text-mute"}`}>
                  {gotowy ? <Ikona nazwa="dokumenty" className="size-4" /> : String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{rodzaje[krok.rodzaj].nazwa}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${gotowy ? "bg-[#edf7f0] text-ok" : krok.dostepna ? "bg-[#fff7e8] text-warning" : "bg-paper text-mute"}`}>
                      {gotowy ? "wystawiony" : krok.dostepna ? "do utworzenia" : "niedostępny"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-mute">{opisy[krok.rodzaj]}</p>
                  {wydane.map((d) => (
                    <p key={d.id} className="mt-2 flex flex-wrap items-baseline gap-x-3 font-mono text-[10px] text-mute">
                      <span className="font-semibold text-ink">{d.numer ?? "numer po nadaniu serii"}</span>
                      <span className="tabular-nums">{zloty.format(d.brutto)}</span>
                      {rodzaje[d.rodzaj].fiskalny && (
                        <span className={d.ksef === "blad" ? "text-warning" : "text-ok"}>
                          KSeF: {d.ksef === "blad" ? "błąd wysyłki" : d.ksef}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
                {!gotowy && krok.akcja && (
                  <button
                    type="button"
                    disabled={!krok.dostepna}
                    onClick={krok.akcja}
                    className="pressable min-h-11 rounded-full bg-accent px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-hair disabled:text-mute"
                  >
                    {krok.etykieta}
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        {blokady.length > 0 && (
          <div role="status" className="mt-4 rounded-ctl bg-[#fff7e8] p-4 ring-1 ring-[#f0dcb4]">
            <p className="flex items-center gap-2 text-xs font-semibold text-warning">
              <Ikona nazwa="ostrzezenie" className="size-3.5" />
              Dokument nie powstał
            </p>
            <ul className="mt-2 space-y-1 text-[11px] leading-5 text-mute">
              {blokady.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
        )}

        {awaria.potrzebna && (
          <p className="mt-4 rounded-ctl bg-[#fff7e8] p-4 text-xs leading-5 text-warning ring-1 ring-[#f0dcb4]">
            {awaria.komunikat}
          </p>
        )}

        {komunikat && (
          <p aria-live="polite" className="mt-4 rounded-ctl bg-[#edf7f0] p-4 text-xs font-semibold leading-5 text-ok">
            {komunikat}
          </p>
        )}
      </div>
    </section>
  );
}
