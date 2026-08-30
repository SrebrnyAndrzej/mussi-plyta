"use client";

import { useMemo, useState } from "react";
import {
  initialPurchaseOrders,
  procurementInventory,
  procurementRequests,
  procurementReservations,
  supplierById,
  suppliers,
  type ProcurementUrgency,
  type ProcurementDemand,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from "@/data/procurement-demo";
import { dostepne, stanPozycji } from "@/lib/magazyn";
import { liczba, zloty } from "@/lib/pricing";
import { zarezerwuj } from "@/lib/rezerwacje";

type Tab = "Zapotrzebowanie" | "Zamówienia do dostawców" | "Przyjęcia";

const urgencyTone: Record<ProcurementUrgency, string> = {
  krytyczne: "bg-danger-paper text-accent-ink",
  pilne: "bg-[#fff7e8] text-warning",
  planowe: "bg-paper-2 text-mute",
};

const statusTone: Record<PurchaseOrderStatus, string> = {
  Robocze: "bg-paper-2 text-mute",
  Wysłane: "bg-[#eef5ff] text-[#275fa6]",
  Potwierdzone: "bg-[#edf7f0] text-ok",
  "Dostawa częściowa": "bg-[#fff7e8] text-warning",
  Przyjęte: "bg-ink text-white",
};

function unique(values: string[]) {
  return [...new Set(values)];
}

function blockedOrdersLabel(count: number) {
  if (count === 1) return "1 zamówienie czeka na towar";
  if (count >= 2 && count <= 4) return `${count} zamówienia czekają na towar`;
  return `${count} zamówień czeka na towar`;
}

export function ProcurementCenter() {
  const procurementDemand = useMemo<ProcurementDemand[]>(() => {
    const stany = Object.fromEntries(procurementInventory.map((item) => [item.sku, item.stanSystemowy]));

    return procurementRequests.flatMap((request) => {
      const inventory = procurementInventory.find((item) => item.sku === request.sku);
      if (!inventory) return [];

      const result = zarezerwuj(procurementReservations, {
        zamowienie: `zapotrzebowanie-${request.id}`,
        pozycje: [{ sku: request.sku, nazwa: inventory.nazwa, ilosc: request.required }],
        stany,
      });
      const shortage = result.ok ? null : result.braki.find((item) => item.sku === request.sku);

      return [{
        ...request,
        name: inventory.nazwa,
        available: dostepne(inventory),
        toOrder: shortage?.brakuje ?? 0,
        unitNet: inventory.cena,
        stockState: stanPozycji(inventory),
      }];
    });
  }, []);
  const [tab, setTab] = useState<Tab>("Zapotrzebowanie");
  const [supplierFilter, setSupplierFilter] = useState("wszyscy");
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(procurementDemand.filter((item) => item.urgency !== "planowe").map((item) => item.id)));
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [selectedOrderId, setSelectedOrderId] = useState(initialPurchaseOrders[0].id);
  const [message, setMessage] = useState("");

  const visibleDemand = useMemo(() => procurementDemand.filter((item) => (supplierFilter === "wszyscy" || item.supplierId === supplierFilter) && (!onlyUrgent || item.urgency !== "planowe")), [procurementDemand, supplierFilter, onlyUrgent]);
  const selectedDemand = procurementDemand.filter((item) => selected.has(item.id));
  const selectedValue = selectedDemand.reduce((sum, item) => sum + item.toOrder * item.unitNet, 0);
  const selectedSuppliers = unique(selectedDemand.map((item) => item.supplierId));
  const blockedOrders = unique(procurementDemand.flatMap((item) => item.customerOrders));
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0];

  function demandById(id: string) {
    return procurementDemand.find((item) => item.id === id);
  }

  function toggleDemand(id: string) {
    setMessage("");
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function createDrafts() {
    if (selectedDemand.length === 0) return;
    const drafts = selectedSuppliers.map((supplierId, index): PurchaseOrder => {
      const lines = selectedDemand.filter((item) => item.supplierId === supplierId).map((item) => ({ demandId: item.id, quantity: item.toOrder, received: 0 }));
      const customerOrders = unique(lines.flatMap((line) => demandById(line.demandId)?.customerOrders ?? []));
      return {
        id: `ZD-2026-R${String(index + 1).padStart(2, "0")}`,
        supplierId,
        status: "Robocze",
        sentAt: null,
        expectedAt: "do potwierdzenia",
        valueNet: lines.reduce((sum, line) => sum + line.quantity * (demandById(line.demandId)?.unitNet ?? 0), 0),
        lines,
        customerOrders,
      };
    });
    setOrders((current) => [...drafts, ...current.filter((order) => order.status !== "Robocze")]);
    setSelectedOrderId(drafts[0].id);
    setMessage(`Utworzono ${drafts.length} robocze zamówienia, po jednym dla każdego dostawcy.`);
    setTab("Zamówienia do dostawców");
  }

  function updateOrder(id: string, change: (order: PurchaseOrder) => PurchaseOrder) {
    setOrders((current) => current.map((order) => order.id === id ? change(order) : order));
  }

  function sendOrder() {
    if (!selectedOrder) return;
    updateOrder(selectedOrder.id, (order) => ({
      ...order,
      status: "Wysłane",
      sentAt: new Date().toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }),
      expectedAt: "do potwierdzenia",
    }));
    setMessage(`${selectedOrder.id} wysłano do dostawcy. Oczekujemy na potwierdzenie terminu.`);
  }

  /**
   * Ilości faktycznie przyjęte, wpisywane przez magazyniera.
   * Domyślnie tyle, ile zamówiono, więc pełne przyjęcie to jedno kliknięcie.
   */
  const [przyjete, setPrzyjete] = useState<Record<string, number>>({});
  const iloscPrzyjeta = (linia: { demandId: string; quantity: number }) =>
    przyjete[linia.demandId] ?? linia.quantity;

  /** Częściowe przyjęcie ma sens dopiero, gdy któraś ilość jest niższa od zamówionej. */
  const czyCzesciowe = (selectedOrder?.lines ?? []).some(
    (line) => iloscPrzyjeta(line) < line.quantity,
  );

  function receiveOrder(partial: boolean) {
    if (!selectedOrder) return;
    updateOrder(selectedOrder.id, (order) => ({
      ...order,
      status: partial ? "Dostawa częściowa" : "Przyjęte",
      lines: order.lines.map((line) => ({
        ...line,
        received: partial ? Math.min(iloscPrzyjeta(line), line.quantity) : line.quantity,
      })),
    }));
    setMessage(partial ? `Zapisano częściowe przyjęcie ${selectedOrder.id}. Braki pozostają w kolejce.` : `${selectedOrder.id} przyjęto w całości. Powiązane zamówienia mogą zostać ponownie zweryfikowane.`);
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">Zaopatrzenie</p>
          <h1 className="mt-3 font-display text-[clamp(2.8rem,5vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.055em] text-ink">Zakupy i dostawy</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-mute sm:text-base">Od braku magazynowego do przyjęcia dostawy i odblokowania zamówienia klienta.</p>
        </div>
        <span className="w-fit rounded-full bg-danger-paper px-4 py-2.5 text-xs font-semibold text-accent-ink ring-1 ring-accent/10">{blockedOrdersLabel(blockedOrders.length)}</span>
      </header>

      <section aria-label="Podsumowanie zakupów" className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Indeksy do zamówienia", liczba.format(procurementDemand.length)],
          ["Krytyczne braki", liczba.format(procurementDemand.filter((item) => item.urgency === "krytyczne").length)],
          ["Dostawcy", liczba.format(suppliers.length)],
          ["Wartość zapotrzebowania", zloty.format(procurementDemand.reduce((sum, item) => sum + item.toOrder * item.unitNet, 0))],
        ].map(([label, value]) => <article key={label} className="rounded-core bg-surface p-5 ring-1 ring-hair shadow-[var(--lift-sm)]"><p className="text-xs font-semibold text-mute">{label}</p><p className="mt-3 font-display text-3xl font-bold tracking-[-0.045em] text-ink">{value}</p></article>)}
      </section>

      <nav className="mt-7 flex gap-2 overflow-x-auto pb-1" aria-label="Obszary zakupów">
        {(["Zapotrzebowanie", "Zamówienia do dostawców", "Przyjęcia"] as Tab[]).map((item) => <button key={item} type="button" onClick={() => { setTab(item); setMessage(""); }} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold ${tab === item ? "bg-ink text-white" : "bg-surface text-mute ring-1 ring-hair"}`}>{item}</button>)}
      </nav>

      {message && <p className="mt-4 rounded-ctl bg-[#edf7f0] px-4 py-3 text-sm font-semibold text-ok ring-1 ring-[#c8e4d2]" aria-live="polite">{message}</p>}

      {tab === "Zapotrzebowanie" && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <section className="overflow-hidden rounded-core bg-surface ring-1 ring-hair shadow-[var(--lift-sm)]">
            <div className="flex flex-col gap-3 border-b border-hair bg-paper p-4 sm:flex-row sm:items-center">
              <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} aria-label="Filtruj według dostawcy" className="min-h-11 rounded-ctl bg-surface px-3 text-sm text-ink ring-1 ring-inset ring-hair"><option value="wszyscy">Wszyscy dostawcy</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-xs font-semibold text-ink"><input type="checkbox" checked={onlyUrgent} onChange={(event) => setOnlyUrgent(event.target.checked)} className="size-4 accent-[var(--color-accent)]" />Tylko krytyczne i pilne</label>
            </div>
            <div className="hidden grid-cols-[32px_1.4fr_.7fr_.55fr_.65fr] gap-4 border-b border-hair px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute md:grid"><span /><span>Towar i zamówienia</span><span>Dostawca</span><span>Brakuje</span><span>Potrzebne</span></div>
            <div className="divide-y divide-hair">{visibleDemand.map((item) => <label key={item.id} className={`grid cursor-pointer gap-3 px-5 py-4 transition-colors md:grid-cols-[32px_1.4fr_.7fr_.55fr_.65fr] md:items-center ${selected.has(item.id) ? "bg-paper" : "hover:bg-paper/60"}`}><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleDemand(item.id)} className="size-4 accent-[var(--color-accent)]" /><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><strong className="font-mono text-[10px] text-ink">{item.sku}</strong><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${urgencyTone[item.urgency]}`}>{item.urgency}</span></span><span className="mt-1 block text-sm font-semibold text-ink">{item.name}</span><span className="mt-1 block truncate font-mono text-[9px] text-mute">{item.customerOrders.join(" · ")}</span></span><span className="text-xs font-semibold text-mute">{supplierById(item.supplierId)?.name}</span><strong className="font-mono text-sm tabular-nums text-accent-ink">{liczba.format(item.toOrder)} {item.unit}</strong><span><strong className="block text-xs text-ink">{item.neededBy}</strong><small className="mt-1 block text-[10px] text-mute">stan: {liczba.format(item.available)} {item.unit}</small></span></label>)}</div>
          </section>

          <aside className="rounded-shell bg-shell p-1.5 ring-1 ring-hair xl:sticky xl:top-6"><div className="rounded-core bg-surface p-5 shadow-[var(--inner)]"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Roboczy podział</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">{selectedDemand.length} wybranych indeksów</h2><dl className="mt-5 divide-y divide-hair border-y border-hair text-xs"><div className="flex justify-between gap-4 py-3"><dt className="text-mute">Dostawcy</dt><dd className="font-mono font-semibold text-ink">{selectedSuppliers.length}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-mute">Zamówienia klientów</dt><dd className="font-mono font-semibold text-ink">{unique(selectedDemand.flatMap((item) => item.customerOrders)).length}</dd></div><div className="flex items-end justify-between gap-4 py-4"><dt className="font-semibold text-ink">Wartość netto</dt><dd className="font-display text-2xl font-bold tracking-[-0.04em] text-accent-ink">{zloty.format(selectedValue)}</dd></div></dl><p className="mt-4 text-xs leading-5 text-mute">System utworzy osobne zamówienie robocze dla każdego dostawcy i zachowa powiązania z zamówieniami klientów.</p><button type="button" disabled={selectedDemand.length === 0} onClick={createDrafts} className="pressable mt-5 min-h-12 w-full rounded-full bg-accent px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Utwórz zamówienia robocze</button></div></aside>
        </div>
      )}

      {tab === "Zamówienia do dostawców" && selectedOrder && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <section className="overflow-hidden rounded-core bg-surface ring-1 ring-hair shadow-[var(--lift-sm)]"><div className="hidden grid-cols-[.9fr_1.15fr_.65fr_.8fr_.7fr] gap-4 border-b border-hair bg-paper px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute md:grid"><span>Numer</span><span>Dostawca</span><span>Status</span><span>Dostawa</span><span>Netto</span></div><div className="divide-y divide-hair">{orders.map((order) => <button key={order.id} type="button" onClick={() => { setSelectedOrderId(order.id); setMessage(""); }} className={`grid w-full gap-3 px-5 py-4 text-left md:grid-cols-[.9fr_1.15fr_.65fr_.8fr_.7fr] md:items-center ${selectedOrder.id === order.id ? "bg-paper shadow-[inset_3px_0_0_var(--color-accent)]" : "hover:bg-paper/60"}`}><strong className="font-mono text-xs text-ink">{order.id}</strong><span className="text-sm font-semibold text-ink">{supplierById(order.supplierId)?.name}</span><span><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold ${statusTone[order.status]}`}>{order.status}</span></span><span className="text-xs text-mute">{order.expectedAt}</span><strong className="font-mono text-xs tabular-nums text-ink">{zloty.format(order.valueNet)}</strong></button>)}</div></section>
          <aside className="rounded-shell bg-shell p-1.5 ring-1 ring-hair"><div className="rounded-core bg-surface p-5 shadow-[var(--inner)]"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Wybrane zamówienie</p><h2 className="mt-2 font-display text-2xl font-semibold text-ink">{selectedOrder.id}</h2><p className="mt-1 text-sm font-semibold text-ink">{supplierById(selectedOrder.supplierId)?.name}</p><ul className="mt-5 divide-y divide-hair border-y border-hair">{selectedOrder.lines.map((line) => { const item = demandById(line.demandId); return <li key={line.demandId} className="py-3"><p className="text-xs font-semibold text-ink">{item?.name}</p><p className="mt-1 font-mono text-[10px] text-mute">{line.quantity} {item?.unit} · {item?.sku}</p></li>; })}</ul><div className="mt-4 rounded-ctl bg-paper p-4"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Odblokuje zamówienia</p><p className="mt-2 text-xs font-semibold leading-5 text-ink">{selectedOrder.customerOrders.join(" · ")}</p></div>{selectedOrder.status === "Robocze" ? <button type="button" onClick={sendOrder} className="pressable mt-5 min-h-12 w-full rounded-full bg-accent px-5 text-sm font-semibold text-white">Wyślij do dostawcy</button> : <p className="mt-5 text-xs leading-5 text-mute">Wysłano: {selectedOrder.sentAt ?? "oczekuje"}. Termin: <strong className="text-ink">{selectedOrder.expectedAt}</strong>.</p>}</div></aside>
        </div>
      )}

      {tab === "Przyjęcia" && selectedOrder && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="rounded-shell bg-shell p-1.5 ring-1 ring-hair"><div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Dokument przyjęcia</p><h2 className="mt-2 font-display text-2xl font-semibold text-ink">{selectedOrder.id}</h2><p className="mt-1 text-sm text-mute">{supplierById(selectedOrder.supplierId)?.name} · plan: {selectedOrder.expectedAt}</p></div><select value={selectedOrder.id} onChange={(event) => setSelectedOrderId(event.target.value)} aria-label="Wybierz dostawę do przyjęcia" className="min-h-11 rounded-ctl bg-paper px-3 text-sm text-ink ring-1 ring-inset ring-hair">{orders.filter((order) => order.status !== "Robocze").map((order) => <option key={order.id} value={order.id}>{order.id} · {supplierById(order.supplierId)?.name}</option>)}</select></div><div className="mt-6 divide-y divide-hair border-y border-hair">{selectedOrder.lines.map((line) => { const item = demandById(line.demandId); return <article key={line.demandId} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-sm font-semibold text-ink">{item?.name}</p><p className="mt-1 font-mono text-[10px] text-mute">{item?.sku}</p></div><span className="font-mono text-xs text-mute">zamówiono {line.quantity} {item?.unit}</span><span className="flex items-center gap-2"><label className="sr-only" htmlFor={`przyjeto-${line.demandId}`}>Przyjęto: {item?.name}</label><input id={`przyjeto-${line.demandId}`} type="number" min={0} max={line.quantity} value={iloscPrzyjeta(line)} onChange={(event) => setPrzyjete((obecne) => ({ ...obecne, [line.demandId]: Number(event.target.value) }))} className="min-h-11 w-20 rounded-ctl bg-paper px-2 text-right font-mono text-xs tabular-nums text-ink ring-1 ring-inset ring-hair focus:ring-accent" /><strong className={`font-mono text-xs ${line.received < line.quantity ? "text-warning" : "text-ok"}`}>przyjęto {line.received} {item?.unit}</strong></span></article>; })}</div></div></section>
          <aside className="rounded-core bg-ink p-6 text-white"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">Kontrola dostawy</p><h2 className="mt-3 font-display text-2xl font-semibold">Zgodność ilościowa</h2><p className="mt-3 text-sm leading-6 text-white/60">Pełne przyjęcie zamyka zapotrzebowanie. Przyjęcie częściowe pozostawia brak w kolejce zakupowej.</p><div className="mt-6 grid gap-3"><button type="button" onClick={() => receiveOrder(false)} className="pressable min-h-12 rounded-full bg-white px-5 text-sm font-semibold text-ink">Przyjmij całość</button><button type="button" disabled={!czyCzesciowe} onClick={() => receiveOrder(true)} className="pressable min-h-12 rounded-full bg-white/10 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:text-white/40 ring-1 ring-white/15">Zapisz dostawę częściową</button></div></aside>
        </div>
      )}
    </main>
  );
}
