"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Ikona } from "@/components/ikona";
import { terminy } from "@/config/brief";
import {
  dozwolonePrzejscia,
  statusy,
  terminOczekiwany,
  zmienStatus,
  type StatusZamowienia,
  type Zamowienie,
} from "@/lib/zamowienia";

type Priorytet = "standard" | "uwaga" | "blokada";
const OPERATOR = "biuro";

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ton(priorytet: Priorytet) {
  if (priorytet === "standard") return "bg-[#edf7f0] text-ok ring-[#c8e4d2]";
  if (priorytet === "blokada") return "bg-danger-paper text-accent-ink ring-accent/15";
  return "bg-[#fff7e8] text-warning ring-[#ead7ae]";
}

export function OrderIntakeGate({
  orderId,
  stock,
  priority,
  deadline,
}: {
  orderId: string;
  stock: string;
  priority: Priorytet;
  deadline: string;
}) {
  const initialDate = useMemo(() => terminOczekiwany(new Date()), []);
  const [order, setOrder] = useState<Zamowienie>(() => ({
    id: orderId,
    status: "okno-zmian",
    przyjeteO: new Date(),
    terminOczekiwany: initialDate,
    terminPotwierdzony: null,
    wersje: [{
      numer: 1,
      pozycje: [{ id: "calosc", nazwa: orderId, ilosc: 1, netto: 0 }],
      wartoscNetto: 0,
      prognoza: initialDate,
      utworzona: new Date(),
      autor: OPERATOR,
      powod: null,
    }],
  }));
  const [decision, setDecision] = useState<StatusZamowienia | "">("");
  const [plannedDate, setPlannedDate] = useState(() => dateInputValue(initialDate));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const hasIssue = priority !== "standard";
  const allowedTransitions = dozwolonePrzejscia(order.status);
  const canSave = !hasIssue || decision !== "";

  function savePlan() {
    if (!canSave) return;
    const target = decision || "zablokowane";
    const withDeadline: Zamowienie = {
      ...order,
      terminPotwierdzony: new Date(`${plannedDate}T12:00:00`),
    };
    const result = zmienStatus(withDeadline, target, OPERATOR, statusy[target].coWidziKlient);
    if (!result.ok) {
      setError(result.blad);
      setSaved(false);
      return;
    }
    setOrder(result.zamowienie);
    setError("");
    setSaved(true);
  }

  return (
    <section aria-labelledby="order-intake-title" className="mt-5 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
      <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">Bramka realizacji</p>
            <h2 id="order-intake-title" className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">Plan obsługi {orderId}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">Jedna decyzja operatora łączy stan magazynowy, termin i sposób dalszej realizacji.</p>
          </div>
          <span className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ring-1 ${ton(priority)}`}>
            {priority === "standard" ? "Można przyjąć" : priority === "blokada" ? "Realizacja zablokowana" : "Wymaga decyzji"}
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-ctl bg-paper p-4 ring-1 ring-hair">
            <p className="font-mono text-[9px] uppercase tracking-[0.11em] text-mute">Kontrahent i ceny</p>
            <p className="mt-2 text-sm font-semibold text-ok">Zweryfikowane</p>
            <p className="mt-1 text-xs leading-5 text-mute">Warunki zapisane w migawce zamówienia.</p>
          </article>
          <article className="rounded-ctl bg-paper p-4 ring-1 ring-hair">
            <p className="font-mono text-[9px] uppercase tracking-[0.11em] text-mute">Stan i rezerwacje</p>
            <p className={`mt-2 text-sm font-semibold ${hasIssue ? "text-accent-ink" : "text-ok"}`}>{stock}</p>
            <Link href="/hurtownia/stany" className="mt-1 inline-flex text-xs font-semibold text-mute underline decoration-hair underline-offset-4 hover:text-ink">Sprawdź magazyn</Link>
          </article>
          <article className="rounded-ctl bg-paper p-4 ring-1 ring-hair">
            <p className="font-mono text-[9px] uppercase tracking-[0.11em] text-mute">Termin klienta</p>
            <p className="mt-2 text-sm font-semibold text-ink">{deadline}</p>
            <p className="mt-1 text-xs leading-5 text-mute">Zmiana wymaga zapisania powodu.</p>
          </article>
          <article className="rounded-ctl bg-paper p-4 ring-1 ring-hair">
            <p className="font-mono text-[9px] uppercase tracking-[0.11em] text-mute">Dokumenty</p>
            <p className="mt-2 text-sm font-semibold text-warning">Podział wyliczony</p>
            <p className="mt-1 text-xs leading-5 text-mute">Wystawienie zależy od kartoteki 3 podmiotów.</p>
          </article>
        </div>

        {hasIssue && (
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-ink">Jak obsłużyć braki lub niezgodności?</legend>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {allowedTransitions.map((status) => (
                <label key={status} className={`cursor-pointer rounded-ctl p-4 ring-1 transition-colors ${decision === status ? "bg-danger-paper ring-accent/25" : "bg-paper ring-hair hover:bg-paper-2"}`}>
                  <span className="flex items-start gap-3">
                    <input type="radio" name={`decyzja-${orderId}`} value={status} checked={decision === status} onChange={() => { setDecision(status); setSaved(false); setError(""); }} className="mt-0.5 size-4 accent-[var(--color-accent)]" />
                    <span><strong className="block text-sm text-ink">{statusy[status].nazwa}</strong><span className="mt-1 block text-xs leading-5 text-mute">{statusy[status].coWidziKlient}</span></span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-6 grid gap-4 border-t border-hair pt-5 sm:grid-cols-[minmax(220px,320px)_1fr_auto] sm:items-end">
          <label className="text-xs font-semibold text-ink">Planowany termin realizacji
            <input type="date" value={plannedDate} onChange={(event) => { setPlannedDate(event.target.value); setSaved(false); setError(""); }} className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 font-mono text-sm font-normal text-ink ring-1 ring-inset ring-hair" />
          </label>
          <p className="text-xs leading-5 text-mute">Jeżeli stan magazynowy nie pozwala dotrzymać standardowych {terminy.dniRealizacji} dni roboczych, zapisany plan staje się podstawą informacji dla klienta.</p>
          <button type="button" disabled={!canSave} onClick={savePlan} className="pressable min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Zapisz plan obsługi</button>
        </div>

        {!canSave && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-accent-ink"><Ikona nazwa="ostrzezenie" rozmiar={15} />Wybierz sposób obsługi braków przed zapisaniem planu.</p>}
        {error && <p role="alert" className="mt-3 flex items-center gap-2 text-xs font-semibold text-accent-ink"><Ikona nazwa="ostrzezenie" rozmiar={15} />{error}</p>}
        {saved && <p aria-live="polite" className="mt-4 rounded-ctl bg-[#edf7f0] px-4 py-3 text-sm font-semibold text-ok">Plan zapisany lokalnie: {plannedDate}. Po integracji decyzja trafi do historii zamówienia i systemu sprzedażowego.</p>}
      </div>
    </section>
  );
}
