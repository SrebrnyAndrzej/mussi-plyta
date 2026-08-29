"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { obslugaZamowien } from "@/config/brief";
import { projectCopy, projectPricing, projectRows, projectSteps } from "@/data/portal-demo";
import { zloty } from "@/lib/pricing";

const edgeOptions = ["ABS 2 mm 5981", "ABS 1 mm 5981", "PVC 2 mm Dąb Naturalny"] as const;

export function ProjectWorkspace() {
  const [activeStep, setActiveStep] = useState(4);
  const [margin, setMargin] = useState<number>(projectPricing.defaultMarginPercent);
  const [edge, setEdge] = useState<(typeof edgeOptions)[number]>(edgeOptions[0]);
  const [edgeOpen, setEdgeOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const clientPrice = useMemo(() => projectPricing.orderValueNet / (1 - margin / 100), [margin]);

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pt-10">
      <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
        <div>
          <Link href="/panel" className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">← {projectCopy.back}</Link>
          <h1 className="mt-5 font-display text-[clamp(2.8rem,5vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.055em] text-ink">{projectCopy.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-mute"><span>{projectCopy.client}</span><span>{projectCopy.created}</span><span>{projectCopy.updated}</span><strong className="text-accent-ink">Status: {projectSteps[activeStep].label}</strong></div>
        </div>
        <div className="rounded-core bg-surface p-4 ring-1 ring-hair shadow-[var(--lift-sm)]">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-ctl bg-[#edf7f0] font-mono text-[10px] font-bold text-ok ring-1 ring-[#c8e4d2]">XLSX</span>
            <div className="min-w-0"><p className="text-sm font-semibold text-ink">{projectCopy.source}</p><p className="mt-1 truncate font-mono text-[10px] text-ink">{projectCopy.file}</p><p className="mt-1 text-[10px] text-mute">{projectCopy.imported}</p></div>
          </div>
        </div>
      </header>

      <nav aria-label="Etapy projektu" className="mt-8 overflow-x-auto rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <ol className="flex min-w-[900px] rounded-core bg-surface p-4 shadow-[var(--inner)]">
          {projectSteps.map((step, index) => {
            const done = index < activeStep;
            const active = index === activeStep;
            return (
              <li key={step.label} className="flex min-w-0 flex-1 items-center">
                <button type="button" onClick={() => setActiveStep(index)} aria-current={active ? "step" : undefined} className="pressable group flex min-w-0 items-center gap-3 rounded-ctl p-2 text-left">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold ring-1 ${done ? "bg-accent text-white ring-accent" : active ? "bg-white text-accent-ink ring-accent" : "bg-paper text-mute ring-hair"}`}>{done ? "✓" : index + 1}</span>
                  <span className="min-w-0"><strong className="block truncate text-sm text-ink">{step.label}</strong><span className="mt-0.5 block truncate text-[10px] text-mute">{step.hint}</span></span>
                </button>
                {index < projectSteps.length - 1 && <span className={`mx-2 h-px flex-1 ${done ? "bg-accent" : "bg-hair"}`} />}
              </li>
            );
          })}
        </ol>
      </nav>

      {submitted && (
        <section aria-live="polite" className="mt-6 rounded-core bg-[#edf7f0] p-5 ring-1 ring-[#c8e4d2]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl font-semibold text-ink">{projectCopy.submitted}</h2><p className="mt-1 text-sm text-mute">{projectCopy.submittedHint}</p></div><Link href="/zamowienia" className="pressable rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white">{projectCopy.goToOrders}</Link></div>
        </section>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(380px,.82fr)]">
        <section aria-labelledby="project-summary-title" className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
            <h2 id="project-summary-title" className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink">{projectCopy.projectSummary}</h2>
            <div className="mt-5 divide-y divide-hair border-y border-hair">
              {projectRows.map((row, index) => (
                <article key={row.label} className="grid gap-4 py-5 sm:grid-cols-[1fr_1.1fr_auto] sm:items-center">
                  <div><h3 className="text-sm font-semibold text-ink">{row.label}</h3><p className="mt-1 text-xs leading-5 text-mute">{row.description}</p></div>
                  <div><p className="font-mono text-xs font-semibold text-ink">{index === 1 ? edge : row.product}</p><p className="mt-1 text-xs text-mute">{row.detail}</p>{index === 1 && <button type="button" onClick={() => setEdgeOpen((value) => !value)} className="mt-2 text-xs font-semibold text-accent-ink">{edgeOpen ? "Zamknij wybór" : "Zmień obrzeże"}</button>}</div>
                  <strong className="font-mono text-sm tabular-nums text-ink">{row.value}</strong>
                  {index === 1 && edgeOpen && (
                    <div className="rounded-ctl bg-paper p-3 sm:col-span-3" role="group" aria-label="Wybór obrzeża">
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">System sugeruje pierwszą pozycję. Możesz wybrać inną.</p>
                      <div className="flex flex-wrap gap-2">{edgeOptions.map((option) => <button key={option} type="button" aria-pressed={edge === option} onClick={() => { setEdge(option); setEdgeOpen(false); }} className={`rounded-full px-4 py-2 text-xs font-semibold ${edge === option ? "bg-accent text-white" : "bg-surface text-ink ring-1 ring-hair"}`}>{option}</button>)}</div>
                    </div>
                  )}
                </article>
              ))}
            </div>
            <dl className="mt-6 grid gap-4 rounded-ctl bg-paper p-5 sm:grid-cols-3">
              <div><dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">Technologia</dt><dd className="mt-2 text-sm font-semibold text-ink">Cięcie i okleinowanie</dd></div>
              <div><dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">Realizacja</dt><dd className="mt-2 text-sm font-semibold text-ink">{obslugaZamowien.terminRealizacjiDniRobocze} dni roboczych</dd></div>
              <div><dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">Zmiany</dt><dd className="mt-2 text-sm font-semibold text-ink">Do {obslugaZamowien.czasNaZmianyGodziny} godzin od złożenia</dd></div>
            </dl>
          </div>
        </section>

        <aside className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink">{projectCopy.estimate}</h2>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{projectCopy.orderValue}</p>
            <strong className="mt-2 block font-display text-5xl font-bold tracking-[-0.055em] text-accent">{zloty.format(projectPricing.orderValueNet)}</strong>
            <p className="mt-4 max-w-md text-xs leading-5 text-mute">{projectCopy.orderValueHint}</p>
            <div className="my-7 h-px bg-hair" />
            <div className="flex items-center justify-between gap-4"><h3 className="font-display text-xl font-semibold text-ink">{projectCopy.clientCalculation}</h3><span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">{projectCopy.privateCalculation}</span></div>
            <div className="mt-5 rounded-ctl bg-paper p-5 ring-1 ring-hair">
              <label className="block text-xs font-semibold text-mute" htmlFor="margin">{projectCopy.margin}: <strong className="font-mono text-ink">{margin}%</strong></label>
              <input id="margin" type="range" min="0" max="45" step="1" value={margin} onChange={(event) => setMargin(Number(event.target.value))} className="mt-4 w-full accent-[var(--color-accent)]" />
              <p className="mt-6 text-xs text-mute">{projectCopy.clientPrice}</p>
              <output htmlFor="margin" className="mt-2 block font-mono text-3xl font-semibold tabular-nums text-ink">{zloty.format(clientPrice)}</output>
              <p className="mt-4 text-xs leading-5 text-mute">{projectCopy.privateHint}</p>
            </div>
          </div>
        </aside>
      </div>

      <footer className="relative z-10 mt-6 flex flex-col gap-3 rounded-shell bg-surface/95 p-3 ring-1 ring-hair shadow-[var(--lift)] backdrop-blur-xl sm:sticky sm:bottom-3 sm:flex-row sm:items-center">
        <Link href="/kreator" className="pressable rounded-full bg-paper px-5 py-3 text-center text-sm font-semibold text-ink ring-1 ring-hair">{projectCopy.backToCut}</Link>
        <button type="button" onClick={() => setSaved(true)} className="pressable rounded-full bg-surface px-5 py-3 text-sm font-semibold text-ink ring-1 ring-hair sm:ml-auto">{saved ? projectCopy.saved : projectCopy.save}</button>
        <button type="button" onClick={() => { setSubmitted(true); setActiveStep(5); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="pressable rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">{projectCopy.submit}</button>
      </footer>
    </main>
  );
}
