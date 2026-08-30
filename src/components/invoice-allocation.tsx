"use client";

import { useMemo, useState } from "react";
import {
  podmiotyFakturujace,
  type PodmiotFakturujacyId,
} from "@/config/brief";
import { invoiceAllocationCopy } from "@/data/warehouse-demo";
import { zloty } from "@/lib/pricing";

type InvoiceLineId = "materialy" | "obrzeza" | "akcesoria" | "uslugi";

type InvoiceLine = {
  id: InvoiceLineId;
  label: string;
  detail: string;
  net: number;
};

const suggestedAssignments: Record<InvoiceLineId, PodmiotFakturujacyId> = {
  materialy: "plyty",
  obrzeza: "plyty",
  akcesoria: "akcesoria",
  uslugi: "stolarnia",
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

function buildLines(totalNet: number): InvoiceLine[] {
  const materialy = roundMoney(totalNet * 0.61);
  const obrzeza = roundMoney(totalNet * 0.075);
  const akcesoria = roundMoney(totalNet * 0.19);
  const uslugi = roundMoney(totalNet - materialy - obrzeza - akcesoria);

  return [
    { id: "materialy", label: "Płyty, blaty i fronty", detail: "Materiały wykorzystane w zamówieniu", net: materialy },
    { id: "obrzeza", label: "Obrzeża", detail: "Obrzeża przypisane do rozkroju", net: obrzeza },
    { id: "akcesoria", label: "Okucia i akcesoria", detail: "Prowadnice, zawiasy i elementy montażowe", net: akcesoria },
    { id: "uslugi", label: "Usługi stolarskie", detail: "Cięcie, oklejanie i przygotowanie zamówienia", net: uslugi },
  ];
}

function pluralizeDocuments(count: number) {
  if (count === 1) return invoiceAllocationCopy.invoice;
  if (count >= 2 && count <= 4) return invoiceAllocationCopy.invoicesFew;
  return invoiceAllocationCopy.invoicesMany;
}

export function InvoiceAllocation({ orderId, totalNet }: { orderId: string; totalNet: number }) {
  const [assignmentsByOrder, setAssignmentsByOrder] = useState<
    Record<string, Record<InvoiceLineId, PodmiotFakturujacyId>>
  >({});
  const [savedOrderIds, setSavedOrderIds] = useState<string[]>([]);
  const assignments = assignmentsByOrder[orderId] ?? suggestedAssignments;
  const saved = savedOrderIds.includes(orderId);
  const lines = useMemo(() => buildLines(totalNet), [totalNet]);

  const summaries = useMemo(
    () =>
      podmiotyFakturujace.map((entity) => {
        const net = roundMoney(
          lines
            .filter((line) => assignments[line.id] === entity.id)
            .reduce((sum, line) => sum + line.net, 0),
        );
        const vat = roundMoney(net * 0.23);
        return { ...entity, net, vat, gross: roundMoney(net + vat) };
      }),
    [assignments, lines],
  );

  const documentCount = summaries.filter((summary) => summary.net > 0).length;

  function assign(lineId: InvoiceLineId, entityId: PodmiotFakturujacyId) {
    setAssignmentsByOrder((current) => ({
      ...current,
      [orderId]: { ...assignments, [lineId]: entityId },
    }));
    setSavedOrderIds((current) => current.filter((id) => id !== orderId));
  }

  function resetSuggested() {
    setAssignmentsByOrder((current) => ({
      ...current,
      [orderId]: { ...suggestedAssignments },
    }));
    setSavedOrderIds((current) => current.filter((id) => id !== orderId));
  }

  return (
    <section aria-labelledby="invoice-allocation-title" className="mt-6 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
      <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">{invoiceAllocationCopy.eyebrow}</p>
            <h2 id="invoice-allocation-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{invoiceAllocationCopy.title}</h2>
            <p className="mt-3 text-sm leading-6 text-mute">{invoiceAllocationCopy.description}</p>
          </div>
          <button type="button" onClick={resetSuggested} className="pressable min-h-11 rounded-full bg-paper px-5 text-xs font-semibold text-ink ring-1 ring-hair">
            {invoiceAllocationCopy.suggested}
          </button>
        </div>

        <div className="mt-7 overflow-hidden rounded-core ring-1 ring-hair">
          <div className="hidden grid-cols-[minmax(0,1.35fr)_.55fr_minmax(240px,.85fr)] gap-4 border-b border-hair bg-paper px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute md:grid">
            <span>Grupa pozycji</span><span className="text-right">Wartość netto</span><span>{invoiceAllocationCopy.assignment}</span>
          </div>
          <ul className="divide-y divide-hair bg-surface">
            {lines.map((line) => (
              <li key={line.id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.35fr)_.55fr_minmax(240px,.85fr)] md:items-center">
                <div><h3 className="text-sm font-semibold text-ink">{line.label}</h3><p className="mt-1 text-xs text-mute">{line.detail}</p></div>
                <strong className="font-mono text-sm tabular-nums text-ink md:text-right">{zloty.format(line.net)}</strong>
                <label className="block">
                  <span className="sr-only">{invoiceAllocationCopy.assignment}: {line.label}</span>
                  <select
                    value={assignments[line.id]}
                    onChange={(event) => assign(line.id, event.target.value as PodmiotFakturujacyId)}
                    className="min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-medium text-ink ring-1 ring-inset ring-hair focus:ring-accent"
                  >
                    {podmiotyFakturujace.map((entity) => (
                      <option key={entity.id} value={entity.id}>{entity.nazwaPrawna ?? entity.nazwaRobocza}</option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{invoiceAllocationCopy.summary}</p><p className="mt-1 text-sm font-semibold text-ink">{documentCount} {pluralizeDocuments(documentCount)} dla zamówienia {orderId}</p></div>
          <p className="max-w-xl text-xs leading-5 text-warning">{invoiceAllocationCopy.demoNotice}</p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {summaries.map((summary) => (
            <article key={summary.id} className={`rounded-core p-5 ring-1 ${summary.net > 0 ? "bg-paper ring-hair" : "bg-surface ring-hair-2"}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">{summary.nazwaRobocza}</p><h3 className="mt-2 text-sm font-semibold text-ink">{summary.nazwaPrawna ?? summary.nazwaRobocza}</h3></div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold ${summary.daneFormalne === "pelne" ? "bg-[#edf7f0] text-ok" : "bg-[#fff7e8] text-warning"}`}>
                  {summary.daneFormalne === "pelne" ? invoiceAllocationCopy.legalReady : invoiceAllocationCopy.legalMissing}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-mute">{summary.zakres}</p>
              <dl className="mt-4 divide-y divide-hair border-y border-hair text-xs">
                <div className="flex justify-between gap-4 py-2.5"><dt className="text-mute">{invoiceAllocationCopy.net}</dt><dd className="font-mono font-semibold tabular-nums text-ink">{zloty.format(summary.net)}</dd></div>
                <div className="flex justify-between gap-4 py-2.5"><dt className="text-mute">{invoiceAllocationCopy.vat}</dt><dd className="font-mono tabular-nums text-ink">{zloty.format(summary.vat)}</dd></div>
                <div className="flex justify-between gap-4 py-2.5"><dt className="font-semibold text-ink">{invoiceAllocationCopy.gross}</dt><dd className="font-mono font-semibold tabular-nums text-accent-ink">{zloty.format(summary.gross)}</dd></div>
              </dl>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {saved && <p aria-live="polite" className="mr-auto rounded-ctl bg-[#edf7f0] px-4 py-3 text-xs font-semibold text-ok"><strong>{invoiceAllocationCopy.saved}</strong><span className="mt-1 block font-normal text-mute">{invoiceAllocationCopy.savedHint}</span></p>}
          <button type="button" onClick={() => setSavedOrderIds((current) => current.includes(orderId) ? current : [...current, orderId])} className="pressable min-h-12 rounded-full bg-accent px-6 text-sm font-semibold text-white">{invoiceAllocationCopy.save}</button>
        </div>
      </div>
    </section>
  );
}
