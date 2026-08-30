"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  exceptionOwners,
  initialOperationalExceptions,
  type ExceptionDomain,
  type ExceptionSeverity,
  type ExceptionStatus,
  type OperationalException,
} from "@/data/exceptions-demo";
import { liczba } from "@/lib/pricing";
import { pilnosc } from "@/lib/produkcja";
import { zarezerwuj } from "@/lib/rezerwacje";
import { czyMoznaZlozycZamowienie } from "@/lib/warunki";
import { czyOpoznienie } from "@/lib/zamowienia";

const CURRENT_OPERATOR = "Magazyn · Operator";

const severityTone: Record<ExceptionSeverity, string> = {
  Krytyczne: "bg-danger-paper text-accent-ink",
  Pilne: "bg-[#fff7e8] text-warning",
  Standard: "bg-paper-2 text-mute",
};

const statusTone: Record<ExceptionStatus, string> = {
  Nowe: "bg-ink text-white",
  "W toku": "bg-[#eef5ff] text-[#275fa6]",
  Oczekuje: "bg-[#fff7e8] text-warning",
  Zamknięte: "bg-[#edf7f0] text-ok",
};

function slaState(item: OperationalException) {
  if (item.status === "Zamknięte") return { label: "zamknięte", tone: "text-ok" };
  const remaining = item.slaMinutes - item.ageMinutes;
  if (remaining < 0) return { label: `${Math.abs(remaining)} min po SLA`, tone: "text-accent-ink" };
  if (remaining < 60) return { label: `${remaining} min do SLA`, tone: "text-mute" };
  return { label: `${Math.ceil(remaining / 60)} godz. do SLA`, tone: "text-mute" };
}

function evaluateException(item: OperationalException): OperationalException {
  const state = item.engineState;
  if (!state) return item;

  if (state.kind === "reservation") {
    const result = zarezerwuj(state.reservations, {
      zamowienie: state.orderId,
      pozycje: state.positions,
      stany: state.stocks,
    });
    const hasShortage = !result.ok && result.braki.length > 0;
    return {
      ...item,
      severity: hasShortage ? "Krytyczne" : "Standard",
      blocking: hasShortage,
    };
  }

  if (state.kind === "production") {
    const urgency = pilnosc(state.job, new Date(state.today));
    const delayed = czyOpoznienie(state.order);
    const critical = delayed || urgency === "po-terminie" || urgency === "zagrozone";
    return {
      ...item,
      severity: critical ? "Krytyczne" : urgency === "pilne" ? "Pilne" : "Standard",
      blocking: critical,
    };
  }

  const commercialDecision = czyMoznaZlozycZamowienie(state.contractor, state.grossValue);
  return {
    ...item,
    severity: commercialDecision.ok ? (commercialDecision.ostrzezenie ? "Pilne" : "Standard") : "Krytyczne",
    blocking: !commercialDecision.ok,
  };
}

function exceptionCountLabel(count: number) {
  if (count === 1) return "1 sprawa";
  if (count >= 2 && count <= 4) return `${count} sprawy`;
  return `${count} spraw`;
}

export function ExceptionCenter() {
  const [items, setItems] = useState(() => initialOperationalExceptions.map(evaluateException));
  const [selectedId, setSelectedId] = useState(initialOperationalExceptions[0].id);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<"Wszystkie" | ExceptionDomain>("Wszystkie");
  const [severity, setSeverity] = useState<"Wszystkie" | ExceptionSeverity>("Wszystkie");
  const [mineOnly, setMineOnly] = useState(false);
  const [owner, setOwner] = useState(initialOperationalExceptions[0].owner);
  const [status, setStatus] = useState<ExceptionStatus>(initialOperationalExceptions[0].status);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item.id} ${item.title} ${item.description} ${item.orderIds.join(" ")}`.toLocaleLowerCase("pl");
    return (!query || text.includes(query.toLocaleLowerCase("pl")))
      && (domain === "Wszystkie" || item.domain === domain)
      && (severity === "Wszystkie" || item.severity === severity)
      && (!mineOnly || item.owner === CURRENT_OPERATOR);
  }), [items, query, domain, severity, mineOnly]);

  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const openItems = items.filter((item) => item.status !== "Zamknięte");
  const overdue = openItems.filter((item) => item.ageMinutes > item.slaMinutes).length;
  const unassigned = openItems.filter((item) => item.owner === "Nieprzypisane").length;
  const blocking = openItems.filter((item) => item.blocking).length;

  function selectItem(item: OperationalException) {
    setSelectedId(item.id);
    setOwner(item.owner);
    setStatus(item.status);
    setNote("");
    setError("");
    setMessage("");
  }

  function takeOwnership() {
    setOwner(CURRENT_OPERATOR);
    setError("");
    setMessage("");
  }

  function saveDecision() {
    if (status === "Zamknięte" && !note.trim()) {
      setError("Przy zamknięciu wpisz rozwiązanie.");
      return;
    }
    if (owner === "Nieprzypisane") {
      setError("Przypisz właściciela przed zapisaniem decyzji.");
      return;
    }
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, owner, status } : item));
    setError("");
    setMessage(status === "Zamknięte" ? `${selected.id} zamknięto i zapisano w historii decyzji.` : `${selected.id} zaktualizowano. Właściciel: ${owner}.`);
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">Kontrola operacyjna</p>
          <h1 className="mt-3 font-display text-[clamp(2.8rem,5vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.055em] text-ink">Centrum wyjątków</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-mute sm:text-base">Jedna kolejka problemów z magazynu, produkcji, zakupów, sprzedaży, dokumentów i integracji.</p>
        </div>
        <button type="button" onClick={() => setMineOnly((value) => !value)} className={`pressable w-fit rounded-full px-5 py-3 text-sm font-semibold ${mineOnly ? "bg-ink text-white" : "bg-surface text-ink ring-1 ring-hair"}`}>{mineOnly ? "Pokazujesz moją kolejkę" : "Pokaż moją kolejkę"}</button>
      </header>

      <section aria-label="Podsumowanie wyjątków" className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Otwarte sprawy", liczba.format(openItems.length), false],
          ["Po przekroczonym SLA", liczba.format(overdue), overdue > 0],
          ["Bez właściciela", liczba.format(unassigned), unassigned > 0],
          ["Blokują realizację", liczba.format(blocking), blocking > 0],
        ].map(([label, value, alert]) => <article key={String(label)} className={`rounded-core p-5 ring-1 shadow-[var(--lift-sm)] ${alert ? "bg-danger-paper ring-accent/10" : "bg-surface ring-hair"}`}><p className={`text-xs font-semibold ${alert ? "text-accent-ink" : "text-mute"}`}>{label}</p><p className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-ink">{value}</p></article>)}
      </section>

      <section aria-label="Filtry wyjątków" className="mt-6 grid gap-3 rounded-core bg-surface p-4 ring-1 ring-hair md:grid-cols-[minmax(220px,1fr)_auto_auto] md:items-center">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj numeru, zamówienia lub problemu" className="min-h-11 w-full rounded-full bg-paper px-5 text-sm text-ink ring-1 ring-inset ring-hair" />
        <select value={domain} onChange={(event) => setDomain(event.target.value as typeof domain)} aria-label="Filtruj według obszaru" className="min-h-11 rounded-ctl bg-paper px-3 text-sm text-ink ring-1 ring-inset ring-hair"><option>Wszystkie</option>{(["Magazyn", "Produkcja", "Sprzedaż", "Dokumenty", "Integracja", "Zakupy"] as ExceptionDomain[]).map((item) => <option key={item}>{item}</option>)}</select>
        <select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} aria-label="Filtruj według priorytetu" className="min-h-11 rounded-ctl bg-paper px-3 text-sm text-ink ring-1 ring-inset ring-hair"><option>Wszystkie</option>{(["Krytyczne", "Pilne", "Standard"] as ExceptionSeverity[]).map((item) => <option key={item}>{item}</option>)}</select>
      </section>

      {message && <p aria-live="polite" className="mt-4 rounded-ctl bg-[#edf7f0] px-4 py-3 text-sm font-semibold text-ok ring-1 ring-[#c8e4d2]">{message}</p>}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
        <section aria-label="Lista wyjątków" className="overflow-hidden rounded-core bg-surface ring-1 ring-hair shadow-[var(--lift-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-hair bg-paper px-5 py-3"><p className="font-mono text-[9px] uppercase tracking-[0.11em] text-mute">Kolejka według pilności i SLA</p><p className="text-xs font-semibold text-ink">{exceptionCountLabel(filtered.length)}</p></div>
          {filtered.length === 0 ? <div className="grid min-h-64 place-items-center px-6 text-center"><div><p className="font-display text-2xl font-semibold text-ink">Brak spraw dla tych filtrów</p><p className="mt-2 text-sm text-mute">Zmień obszar, priorytet albo wyłącz filtr mojej kolejki.</p></div></div> : <div className="divide-y divide-hair">{filtered.map((item) => { const sla = slaState(item); return <button key={item.id} type="button" onClick={() => selectItem(item)} className={`grid w-full gap-3 px-5 py-4 text-left md:grid-cols-[minmax(0,1.5fr)_.65fr_.7fr] md:items-center ${selected.id === item.id ? "bg-paper shadow-[inset_3px_0_0_var(--color-accent)]" : "hover:bg-paper/60"}`}><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><strong className="font-mono text-[10px] text-ink">{item.id}</strong><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${severityTone[item.severity]}`}>{item.severity}</span>{item.blocking && <span className="font-mono text-[9px] font-semibold text-accent-ink">blokada</span>}</span><span className="mt-2 block text-sm font-semibold leading-5 text-ink">{item.title}</span><span className="mt-1 block truncate font-mono text-[9px] text-mute">{item.orderIds.join(" · ")}</span></span><span><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold ${statusTone[item.status]}`}>{item.status}</span><span className="mt-2 block text-[10px] text-mute">{item.domain}</span></span><span><strong className={`block font-mono text-[10px] ${sla.tone}`}>{sla.label}</strong><span className="mt-2 block truncate text-[10px] text-mute">{item.owner}</span></span></button>; })}</div>}
        </section>

        <aside className="rounded-shell bg-shell p-1.5 ring-1 ring-hair xl:sticky xl:top-6">
          <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Wybrana sprawa</p><h2 className="mt-2 font-display text-2xl font-semibold text-ink">{selected.id}</h2></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${severityTone[selected.severity]}`}>{selected.severity}</span></div>
            <h3 className="mt-4 text-base font-semibold leading-6 text-ink">{selected.title}</h3>
            <p className="mt-2 text-sm leading-6 text-mute">{selected.description}</p>
            <div className="mt-5 rounded-ctl bg-paper p-4"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Rekomendowana decyzja</p><p className="mt-2 text-xs font-semibold leading-5 text-ink">{selected.recommendedAction}</p></div>
            <dl className="mt-5 divide-y divide-hair border-y border-hair text-xs"><div className="flex justify-between gap-4 py-3"><dt className="text-mute">Utworzono</dt><dd className="font-mono text-ink">{selected.createdAt}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-mute">SLA</dt><dd className={`font-mono font-semibold ${slaState(selected).tone}`}>{slaState(selected).label}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-mute">Zamówienia</dt><dd className="max-w-[220px] text-right font-mono text-ink">{selected.orderIds.join(" · ")}</dd></div></dl>
            <Link href={selected.sourceHref} className="pressable mt-4 flex min-h-11 items-center justify-center rounded-full bg-paper px-5 text-xs font-semibold text-ink ring-1 ring-hair">{selected.sourceLabel}</Link>

            <div className="mt-5 border-t border-hair pt-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="text-xs font-semibold text-ink">Właściciel<select value={owner} onChange={(event) => { setOwner(event.target.value); setError(""); setMessage(""); }} className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair">{exceptionOwners.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold text-ink">Status<select value={status} onChange={(event) => { setStatus(event.target.value as ExceptionStatus); setError(""); setMessage(""); }} className="mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair">{(["Nowe", "W toku", "Oczekuje", "Zamknięte"] as ExceptionStatus[]).map((item) => <option key={item}>{item}</option>)}</select></label></div>
              {owner !== CURRENT_OPERATOR && <button type="button" onClick={takeOwnership} className="mt-3 text-xs font-semibold text-accent-ink underline decoration-accent/25 underline-offset-4">Przejmij tę sprawę</button>}
              <label className="mt-4 block text-xs font-semibold text-ink">Notatka lub rozwiązanie<textarea value={note} onChange={(event) => { setNote(event.target.value); setError(""); setMessage(""); }} placeholder="Co sprawdzono, jaka była decyzja i co dzieje się dalej" className="mt-2 min-h-24 w-full rounded-ctl bg-paper p-3 text-sm font-normal text-ink ring-1 ring-inset ring-hair" /></label>
              {error && <p role="alert" className="mt-3 rounded-ctl bg-danger-paper px-3 py-2 text-xs font-semibold text-accent-ink">{error}</p>}
              <button type="button" onClick={saveDecision} className="pressable mt-4 min-h-12 w-full rounded-full bg-accent px-5 text-sm font-semibold text-white">Zapisz decyzję</button>
              <p className="mt-3 text-[10px] leading-4 text-mute">W integracji zapis utworzy zdarzenie z autorem, czasem, poprzednim i nowym stanem.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
