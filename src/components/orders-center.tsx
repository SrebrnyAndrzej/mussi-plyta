"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { activeOrder, demoOrders, orderDetailSections, ordersCopy, type DemoOrder } from "@/data/portal-demo";

function statusTone(status: DemoOrder["status"]) {
  if (status === "W produkcji") return "bg-danger-paper text-accent-ink";
  if (status === "Kompletacja") return "bg-[#fff5e8] text-[#9a4a00]";
  if (status === "Wysłane") return "bg-[#edf7f0] text-ok";
  if (status === "W realizacji") return "bg-[#eef5ff] text-[#275fa6]";
  return "bg-paper text-mute";
}

export function OrdersCenter() {
  const [filter, setFilter] = useState<(typeof ordersCopy.filters)[number]>(ordersCopy.filters[0]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(demoOrders[0].id);
  const [section, setSection] = useState<(typeof orderDetailSections)[number]["id"]>(orderDetailSections[0].id);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => {
    const phrase = query.trim().toLocaleLowerCase("pl");
    return demoOrders.filter((order) => {
      const matchesQuery = !phrase || `${order.id} ${order.project}`.toLocaleLowerCase("pl").includes(phrase);
      const matchesFilter =
        filter === "Wszystkie" ||
        (filter === "Wymagają uwagi" && order.availabilityTone === "warning") ||
        (filter === "Można edytować" && order.editable) ||
        (filter === "W realizacji" && !["Zakończone", "Wysłane"].includes(order.status)) ||
        (filter === "Zakończone" && order.status === "Zakończone");
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  const selected = demoOrders.find((order) => order.id === selectedId) ?? demoOrders[0];

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="font-display text-[clamp(2.8rem,5vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.055em] text-ink">{ordersCopy.title}</h1><p className="mt-3 text-sm text-mute sm:text-base">{ordersCopy.subtitle}</p></div>
        <Link href="/kreator" className="pressable shrink-0 rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-white">{ordersCopy.newOrder}</Link>
      </header>

      <button type="button" onClick={() => setFilter("Wymagają uwagi")} className="pressable mt-7 flex w-full flex-col gap-1 rounded-ctl border border-[#dfc6cd] bg-surface px-5 py-4 text-left sm:flex-row sm:items-center sm:justify-between">
        <span><strong className="text-sm text-ink">{ordersCopy.attention}</strong><span className="mt-1 block text-xs text-mute">{ordersCopy.attentionHint}</span></span><span className="text-xs font-semibold text-accent-ink">Zobacz</span>
      </button>

      <section aria-label="Filtry zamówień" className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ordersCopy.filters.map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-semibold ${filter === item ? "bg-ink text-white" : "bg-surface text-mute ring-1 ring-hair"}`}>{item}</button>)}
        </div>
        <label className="block w-full xl:max-w-sm"><span className="sr-only">{ordersCopy.search}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ordersCopy.search} className="min-h-11 w-full rounded-full bg-surface px-5 text-sm text-ink ring-1 ring-inset ring-hair placeholder:text-mute focus:ring-accent" /></label>
      </section>

      <section aria-labelledby="order-list-title" className="mt-5 overflow-hidden rounded-core bg-surface ring-1 ring-hair shadow-[var(--lift-sm)]">
        <h2 id="order-list-title" className="sr-only">Lista zamówień</h2>
        <div className="hidden grid-cols-[1.5fr_.8fr_.9fr_.8fr_.7fr_.8fr] gap-4 border-b border-hair bg-paper px-5 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute xl:grid">
          {ordersCopy.columns.map((column) => <span key={column}>{column}</span>)}
        </div>
        <div className="divide-y divide-hair">
          {filtered.length === 0 && <p className="px-5 py-12 text-center text-sm text-mute">Brak zamówień dla wybranych filtrów.</p>}
          {filtered.map((order) => {
            const selectedRow = selected.id === order.id;
            return (
              <button key={order.id} type="button" onClick={() => { setSelectedId(order.id); setEditing(false); setSaved(false); }} className={`grid w-full grid-cols-2 gap-x-4 gap-y-5 px-5 py-5 text-left xl:grid-cols-[1.5fr_.8fr_.9fr_.8fr_.7fr_.8fr] xl:items-center xl:gap-4 xl:py-4 ${selectedRow ? "bg-paper shadow-[inset_3px_0_0_var(--color-accent)]" : "hover:bg-paper/70"}`}>
                <span className="col-span-2 xl:col-span-1"><strong className="font-mono text-xs text-ink">{order.id}</strong><span className="mx-2 text-mute">·</span><span className="text-sm font-semibold text-ink">{order.project}</span></span>
                <span><small className="mb-2 block font-mono text-[9px] uppercase tracking-[0.1em] text-mute xl:hidden">{ordersCopy.columns[1]}</small><span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold ${statusTone(order.status)}`}>{order.status}</span></span>
                <span><small className="mb-2 block font-mono text-[9px] uppercase tracking-[0.1em] text-mute xl:hidden">{ordersCopy.columns[2]}</small><strong className={`block font-mono text-xs ${order.editable ? "text-accent-ink" : "text-mute"}`}>{order.editWindow}</strong><small className="mt-1 block text-[10px] text-mute">{order.editHint}</small></span>
                <span><small className="mb-2 block font-mono text-[9px] uppercase tracking-[0.1em] text-mute xl:hidden">{ordersCopy.columns[3]}</small><strong className="block font-mono text-xs text-ink">{order.delivery}</strong><small className="mt-1 block text-[10px] text-mute">{order.deliveryHint}</small></span>
                <span><small className="mb-2 block font-mono text-[9px] uppercase tracking-[0.1em] text-mute xl:hidden">{ordersCopy.columns[4]}</small><strong className={`text-xs font-semibold ${order.availabilityTone === "ok" ? "text-ok" : order.availabilityTone === "warning" ? "text-accent-ink" : "text-mute"}`}>{order.availability}</strong></span>
                <span><small className="mb-2 block font-mono text-[9px] uppercase tracking-[0.1em] text-mute xl:hidden">{ordersCopy.columns[5]}</small><strong className="font-mono text-sm tabular-nums text-ink xl:block xl:text-right">{order.value}</strong></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-core bg-surface ring-1 ring-hair shadow-[var(--lift-sm)]" aria-labelledby="selected-order-title">
        <header className="flex flex-col gap-4 border-b border-hair p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Wybrane zamówienie</p><h2 id="selected-order-title" className="mt-1 font-display text-2xl font-semibold text-ink">{selected.id} · {selected.project}</h2></div>
          <div className="flex flex-wrap gap-2"><button type="button" className="min-h-11 rounded-full bg-paper px-4 text-xs font-semibold text-ink ring-1 ring-hair">{ordersCopy.download}</button><button type="button" disabled={!selected.editable} onClick={() => { setEditing((value) => !value); setSaved(false); }} className="min-h-11 rounded-full bg-accent px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-paper-2 disabled:text-mute">{selected.editable ? editing ? ordersCopy.closeEditor : ordersCopy.edit : ordersCopy.editLocked}</button></div>
        </header>
        <div className="grid lg:grid-cols-[210px_minmax(0,1fr)]">
          <nav className="border-b border-hair bg-paper p-3 lg:border-b-0 lg:border-r" aria-label="Szczegóły zamówienia">
            {orderDetailSections.map((item) => <button key={item.id} id={item.id === "dokumenty" ? "dokumenty" : undefined} type="button" aria-pressed={section === item.id} onClick={() => setSection(item.id)} className={`block min-h-11 w-full rounded-ctl px-4 text-left text-xs font-semibold ${section === item.id ? "bg-surface text-accent-ink shadow-[var(--lift-sm)]" : "text-mute hover:text-ink"}`}>{item.label}</button>)}
          </nav>
          <div className="p-5 sm:p-7">
            {section === "plyty" && <OrderMaterials />}
            {section === "obrzeza" && <OrderEdges />}
            {section === "okucia" && <OrderHardware />}
            {section === "dokumenty" && <OrderDocuments />}
            {editing && selected.editable && <div className="mt-6 rounded-ctl border border-[#dfc6cd] bg-danger-paper p-5"><h3 className="text-sm font-semibold text-ink">Tryb edycji zamówienia</h3><p className="mt-2 text-xs leading-5 text-mute">W wersji demonstracyjnej możesz potwierdzić zmianę obrzeża i terminu odbioru. Zmiany nie są wysyłane do backendu.</p><label className="mt-4 block text-xs font-semibold text-ink">Uwagi do zamówienia<textarea className="mt-2 min-h-24 w-full rounded-ctl bg-surface p-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair focus:ring-accent" defaultValue="Proszę przygotować elementy w kolejności montażu." /></label><button type="button" onClick={() => { setSaved(true); setEditing(false); }} className="mt-4 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white">{ordersCopy.saveChanges}</button></div>}
            {saved && <p className="mt-5 rounded-ctl bg-[#edf7f0] p-4 text-sm font-semibold text-ok" aria-live="polite">{ordersCopy.savedChanges}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

function OrderMaterials() {
  return <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr_1fr]"><div><h3 className="font-display text-xl font-semibold text-ink">Podsumowanie elementów</h3><dl className="mt-4 grid grid-cols-2 gap-3 rounded-ctl bg-paper p-5"><div><dt className="text-xs text-mute">Płyty</dt><dd className="mt-2 font-mono text-sm font-semibold text-ink">42 elem.</dd></div><div><dt className="text-xs text-mute">Obrzeża</dt><dd className="mt-2 font-mono text-sm font-semibold text-ink">126,4 mb</dd></div><div><dt className="text-xs text-mute">Okucia</dt><dd className="mt-2 font-mono text-sm font-semibold text-ink">158 szt.</dd></div><div><dt className="text-xs text-mute">Wartość</dt><dd className="mt-2 font-mono text-sm font-semibold text-ink">{activeOrder.value}</dd></div></dl></div><div><h3 className="font-display text-xl font-semibold text-ink">Dostępność</h3><div className="mt-4 rounded-ctl bg-paper p-5"><p className="text-xs text-mute">Kompletne</p><p className="mt-2 font-mono text-lg font-semibold text-ok">41 elem. · 97,6%</p><div className="my-4 h-px bg-hair" /><p className="text-xs text-mute">Braki</p><p className="mt-2 font-mono text-sm font-semibold text-accent-ink">1 elem. · 2,4%</p></div></div><Timeline /></div>;
}

function OrderEdges() {
  return <div><h3 className="font-display text-xl font-semibold text-ink">Obrzeża w zamówieniu</h3><p className="mt-2 text-sm text-mute">System dobrał obrzeża do dekorów płyt. Ręczne zmiany są zachowane w specyfikacji.</p><div className="mt-5 divide-y divide-hair border-y border-hair"><p className="flex justify-between py-4 text-sm"><span>ABS 2 mm 5981</span><strong className="font-mono">95,6 m</strong></p><p className="flex justify-between py-4 text-sm"><span>ABS 1 mm biały</span><strong className="font-mono">30,8 m</strong></p></div></div>;
}

function OrderHardware() {
  return <div><h3 className="font-display text-xl font-semibold text-ink">Okucia i akcesoria</h3><p className="mt-2 text-sm text-mute">35 pozycji od Blum, GTV i Hettich. Jedna prowadnica oczekuje na dostawę.</p><div className="mt-5 rounded-ctl border border-[#d9c8ae] bg-[#fbf7f0] p-4 text-sm text-ink">Prowadnica Blum 500 mm · przewidywana dostawa 5 września</div></div>;
}

function OrderDocuments() {
  return <div><h3 className="font-display text-xl font-semibold text-ink">Dokumenty zamówienia</h3><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" className="rounded-ctl bg-paper p-5 text-left text-sm font-semibold text-ink ring-1 ring-hair">Specyfikacja zamówienia<span className="mt-1 block text-xs font-normal text-mute">PDF · 1,8 MB</span></button><button type="button" className="rounded-ctl bg-paper p-5 text-left text-sm font-semibold text-ink ring-1 ring-hair">Lista formatek<span className="mt-1 block text-xs font-normal text-mute">CSV · 42 pozycje</span></button></div></div>;
}

function Timeline() {
  return <div><h3 className="font-display text-xl font-semibold text-ink">Historia zamówienia</h3><ol className="mt-4 space-y-4">{activeOrder.timeline.slice(0, 3).reverse().map((item) => <li key={item.label} className="border-l-2 border-accent pl-4"><p className="text-xs font-semibold text-ink">{item.label}</p><p className="mt-1 font-mono text-[10px] text-mute">{item.date}</p></li>)}</ol></div>;
}
