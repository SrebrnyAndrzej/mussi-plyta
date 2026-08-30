"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { operatorHurtowni, podmiotyFakturujace, type PodmiotFakturujacyId } from "@/config/brief";
import { Ikona } from "@/components/ikona";
import { invoiceAllocationCopy, pozycjeZamowienia } from "@/data/warehouse-demo";
import {
  odmienDokumenty,
  powodyZmianyPodmiotu,
  sugerowanyPodzial,
  walidujWystawienie,
  zmienPodmiotPozycji,
  type PowodZmianyPodmiotu,
  type Przypisania,
  type WpisAudytuFaktur,
} from "@/lib/fakturowanie";
import { zloty } from "@/lib/pricing";

function nazwaPodmiotu(id: PodmiotFakturujacyId | null): string {
  if (!id) return "brak przypisania";
  return podmiotyFakturujace.find((p) => p.id === id)?.nazwaRobocza ?? id;
}

export function InvoiceAllocation({ orderId, totalNet }: { orderId: string; totalNet: number }) {
  const pozycje = useMemo(() => pozycjeZamowienia(totalNet), [totalNet]);
  const sugestia = useMemo(() => sugerowanyPodzial(pozycje), [pozycje]);

  const [przypisaniaZamowien, setPrzypisaniaZamowien] = useState<Record<string, Przypisania>>({});
  const [historia, setHistoria] = useState<WpisAudytuFaktur[]>([]);
  const [powod, setPowod] = useState<PowodZmianyPodmiotu>("korekta-sugestii");
  const [wystawione, setWystawione] = useState<string[]>([]);

  const przypisania = przypisaniaZamowien[orderId] ?? sugestia;
  const wynik = useMemo(
    () => walidujWystawienie(pozycje, przypisania),
    [pozycje, przypisania],
  );
  const dokumenty = wynik.dokumenty;
  const blokady = wynik.ok ? [] : wynik.blokady;
  const wydane = wystawione.includes(orderId);
  const historiaZamowienia = historia.filter((w) => w.zamowienie === orderId);

  function przypisz(pozycja: string, naPodmiot: PodmiotFakturujacyId) {
    const zmiana = zmienPodmiotPozycji(pozycje, przypisania, {
      zamowienie: orderId,
      pozycja,
      naPodmiot,
      powod,
      autor: operatorHurtowni.login,
    });
    if (!zmiana.ok) return;
    setPrzypisaniaZamowien((obecne) => ({ ...obecne, [orderId]: zmiana.przypisania }));
    setHistoria((obecna) => [zmiana.wpis, ...obecna]);
    setWystawione((obecne) => obecne.filter((id) => id !== orderId));
  }

  function przywrocSugestie() {
    setPrzypisaniaZamowien((obecne) => ({ ...obecne, [orderId]: { ...sugestia } }));
    setWystawione((obecne) => obecne.filter((id) => id !== orderId));
  }

  return (
    <section aria-labelledby="invoice-allocation-title" className="mt-6 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
      <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">{invoiceAllocationCopy.eyebrow}</p>
            <h2 id="invoice-allocation-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{invoiceAllocationCopy.title}</h2>
            <p className="mt-3 text-sm leading-6 text-mute">{invoiceAllocationCopy.description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-end gap-2">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
              {invoiceAllocationCopy.reason}
              <select
                value={powod}
                onChange={(event) => setPowod(event.target.value as PowodZmianyPodmiotu)}
                className="mt-1.5 block min-h-11 w-56 rounded-ctl bg-paper px-3 text-sm font-medium normal-case tracking-normal text-ink ring-1 ring-inset ring-hair focus:ring-accent"
              >
                {powodyZmianyPodmiotu.map((p) => (
                  <option key={p.id} value={p.id}>{p.nazwa}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={przywrocSugestie} className="pressable min-h-11 rounded-full bg-paper px-5 text-xs font-semibold text-ink ring-1 ring-hair">
              {invoiceAllocationCopy.suggested}
            </button>
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-core ring-1 ring-hair">
          <div className="hidden grid-cols-[minmax(0,1.35fr)_.55fr_minmax(240px,.85fr)] gap-4 border-b border-hair bg-paper px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute md:grid">
            <span>Grupa pozycji</span><span className="text-right">Wartość netto</span><span>{invoiceAllocationCopy.assignment}</span>
          </div>
          <ul className="divide-y divide-hair bg-surface">
            {pozycje.map((pozycja) => (
              <li key={pozycja.id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.35fr)_.55fr_minmax(240px,.85fr)] md:items-center">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink">{pozycja.nazwa}</h3>
                  <p className="mt-1 text-xs text-mute">{pozycja.opis}</p>
                </div>
                <strong className="font-mono text-sm tabular-nums text-ink md:text-right">{zloty.format(pozycja.netto)}</strong>
                <label className="block min-w-0">
                  <span className="sr-only">{invoiceAllocationCopy.assignment}: {pozycja.nazwa}</span>
                  <select
                    value={przypisania[pozycja.id] ?? ""}
                    onChange={(event) => przypisz(pozycja.id, event.target.value as PodmiotFakturujacyId)}
                    className="min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-medium text-ink ring-1 ring-inset ring-hair focus:ring-accent"
                  >
                    {podmiotyFakturujace.map((p) => (
                      <option key={p.id} value={p.id}>{p.nazwaPrawna ?? p.nazwaRobocza}</option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{invoiceAllocationCopy.summary}</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {dokumenty.length} {odmienDokumenty(dokumenty.length)} dla zamówienia {orderId}
            </p>
          </div>
          <p className="max-w-xl text-xs leading-5 text-warning">{invoiceAllocationCopy.demoNotice}</p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {dokumenty.map((dokument) => (
            <article key={dokument.podmiot.id} className="min-w-0 rounded-core bg-paper p-5 ring-1 ring-hair">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">{dokument.podmiot.nazwaRobocza}</p>
                  <h3 className="mt-2 text-sm font-semibold text-ink">{dokument.podmiot.nazwaPrawna ?? dokument.podmiot.nazwaRobocza}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold ${dokument.gotowy ? "bg-[#edf7f0] text-ok" : "bg-[#fff7e8] text-warning"}`}>
                  {dokument.gotowy ? invoiceAllocationCopy.legalReady : invoiceAllocationCopy.legalMissing}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-mute">{dokument.podmiot.zakres}</p>
              <dl className="mt-4 divide-y divide-hair border-y border-hair text-xs">
                <div className="flex justify-between gap-4 py-2.5"><dt className="text-mute">{invoiceAllocationCopy.number}</dt><dd className="min-w-0 truncate font-mono text-ink">{dokument.numer ?? invoiceAllocationCopy.numberPending}</dd></div>
                <div className="flex justify-between gap-4 py-2.5"><dt className="text-mute">{invoiceAllocationCopy.net}</dt><dd className="font-mono font-semibold tabular-nums text-ink">{zloty.format(dokument.netto)}</dd></div>
                <div className="flex justify-between gap-4 py-2.5"><dt className="text-mute">{invoiceAllocationCopy.vat}</dt><dd className="font-mono tabular-nums text-ink">{zloty.format(dokument.vat)}</dd></div>
                <div className="flex justify-between gap-4 py-2.5"><dt className="font-semibold text-ink">{invoiceAllocationCopy.gross}</dt><dd className="font-mono font-semibold tabular-nums text-accent-ink">{zloty.format(dokument.brutto)}</dd></div>
              </dl>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute">{invoiceAllocationCopy.snapshotTitle}</p>
              <ul className="mt-2 space-y-1 text-[11px] leading-5 text-mute">
                <li>NIP: <span className={dokument.migawka.nip ? "text-ink" : "text-warning"}>{dokument.migawka.nip ?? "do uzupełnienia"}</span></li>
                <li>Rachunek: <span className={dokument.migawka.rachunek ? "text-ink" : "text-warning"}>{dokument.migawka.rachunek ?? "do uzupełnienia"}</span></li>
                <li>KSeF: <span className={dokument.migawka.ksef === "podlaczony" ? "text-ok" : "text-warning"}>{dokument.migawka.ksef === "podlaczony" ? "podłączony" : "niepodłączony"}</span></li>
              </ul>
            </article>
          ))}
        </div>

        {blokady.length > 0 && (
          <div role="status" className="mt-6 rounded-core bg-[#fff7e8] p-5 ring-1 ring-[#f0dcb4]">
            <p className="flex items-center gap-2 text-sm font-semibold text-warning">
              <Ikona nazwa="ostrzezenie" className="size-4" />
              {invoiceAllocationCopy.blockedTitle}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs leading-5 text-mute">
              {blokady.map((blokada) => <li key={blokada}>{blokada}</li>)}
            </ul>
            <Link href="/hurtownia/podmioty" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-5 text-xs font-semibold text-ink ring-1 ring-hair">
              {invoiceAllocationCopy.registryLink}
              <Ikona nazwa="dalej" className="size-3.5" />
            </Link>
          </div>
        )}

        <div className="mt-6 rounded-core bg-paper p-5 ring-1 ring-hair">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
            <Ikona nazwa="historia" className="size-3.5" />
            {invoiceAllocationCopy.auditTitle}
          </p>
          {historiaZamowienia.length === 0 ? (
            <p className="mt-3 text-xs text-mute">{invoiceAllocationCopy.auditEmpty}</p>
          ) : (
            <ul className="mt-3 divide-y divide-hair text-xs">
              {historiaZamowienia.map((wpis, index) => (
                <li key={`${wpis.pozycja}-${wpis.kiedy}-${index}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2.5">
                  <strong className="font-semibold text-ink">{wpis.nazwaPozycji}</strong>
                  <span className="text-mute">{nazwaPodmiotu(wpis.zPodmiotu)} na {nazwaPodmiotu(wpis.naPodmiot)}</span>
                  <span className="text-mute">
                    {powodyZmianyPodmiotu.find((p) => p.id === wpis.powod)?.nazwa}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-mute">
                    {wpis.autor}, {new Date(wpis.kiedy).toLocaleString("pl-PL")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {wydane && (
            <p aria-live="polite" className="mr-auto rounded-ctl bg-[#edf7f0] px-4 py-3 text-xs font-semibold text-ok">
              <strong>{invoiceAllocationCopy.saved}</strong>
              <span className="mt-1 block font-normal text-mute">{invoiceAllocationCopy.savedHint}</span>
            </p>
          )}
          {!wynik.ok && (
            <p className="mr-auto text-xs leading-5 text-mute">{invoiceAllocationCopy.blockedHint}</p>
          )}
          <button
            type="button"
            disabled={!wynik.ok}
            onClick={() => setWystawione((obecne) => obecne.includes(orderId) ? obecne : [...obecne, orderId])}
            className="pressable min-h-12 rounded-full bg-accent px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-hair disabled:text-mute"
          >
            {invoiceAllocationCopy.issue}
          </button>
        </div>
      </div>
    </section>
  );
}
