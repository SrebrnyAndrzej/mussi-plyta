"use client";

import { useMemo, useState } from "react";
import {
  copy,
  cennik,
  kreatorDomyslne,
  rozkroj,
} from "@/config/brief";
import { policzRozkroj, type Formatka } from "@/lib/nesting";
import { liczba, wycenUslugi, zloty } from "@/lib/pricing";

type DekorOption = { id: string; kod: string; nazwa: string };
type EdgeIndex = 0 | 1 | 2 | 3;

const EMPTY_EDGE: Formatka["obrzeze"] = [0, 0, 0, 0];

function nextEdge(value: number) {
  return value === 0 ? 1 : value === 1 ? 2 : 0;
}

function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-shell bg-shell p-1.5 ring-1 ring-hair ${className}`}>
      <div className="h-full rounded-core bg-surface shadow-[var(--inner)]">{children}</div>
    </div>
  );
}

function EdgeEditor({
  value,
  onChange,
  dlugosc,
  szerokosc,
}: {
  value: Formatka["obrzeze"];
  onChange: (value: Formatka["obrzeze"]) => void;
  dlugosc: number;
  szerokosc: number;
}) {
  const positions = [
    "left-1/2 top-0 h-12 w-[70%] -translate-x-1/2",
    "bottom-0 left-1/2 h-12 w-[70%] -translate-x-1/2",
    "left-0 top-1/2 h-[62%] w-12 -translate-y-1/2",
    "right-0 top-1/2 h-[62%] w-12 -translate-y-1/2",
  ] as const;

  return (
    <div className="relative mx-auto aspect-[1.55/1] w-full max-w-[340px]" aria-describedby="edge-help">
      <div className="absolute inset-8 rounded-[5px] bg-paper-2 shadow-[inset_0_0_0_1px_var(--color-hair)]">
        <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-hair" />
        <div className="absolute inset-y-4 left-1/2 border-l border-dashed border-hair" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
          {dlugosc} × {szerokosc}
        </span>
      </div>
      {positions.map((position, index) => {
        const edge = index as EdgeIndex;
        const active = value[edge] > 0;
        return (
          <button
            key={copy.kreator.krawedzie[edge]}
            type="button"
            aria-label={`${copy.kreator.zmienKrawedz} ${copy.kreator.krawedzie[edge]}`}
            aria-pressed={active}
            onClick={() => {
              const changed: Formatka["obrzeze"] = [...value];
              changed[edge] = nextEdge(changed[edge]);
              onChange(changed);
            }}
            className={`pressable absolute ${position} group rounded-full`}
          >
            <span
              className={`absolute rounded-full transition-colors duration-180 ease-[var(--ease-out)] ${
                edge < 2 ? "inset-x-3 top-1/2 h-1 -translate-y-1/2" : "inset-y-3 left-1/2 w-1 -translate-x-1/2"
              } ${active ? "bg-accent" : "bg-ink/16 group-hover:bg-ink/28"}`}
            />
            <span
              className={`absolute grid size-6 place-items-center rounded-full font-mono text-[10px] font-semibold tabular-nums ${
                edge === 0
                  ? "left-1/2 top-0 -translate-x-1/2"
                  : edge === 1
                    ? "bottom-0 left-1/2 -translate-x-1/2"
                    : edge === 2
                      ? "left-0 top-1/2 -translate-y-1/2"
                      : "right-0 top-1/2 -translate-y-1/2"
              } ${active ? "bg-accent text-white" : "bg-paper-2 text-mute"}`}
            >
              {value[edge] || "0"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Board({ formatki }: { formatki: Formatka[] }) {
  const wynik = useMemo(() => policzRozkroj(formatki), [formatki]);
  const [activeSheet, setActiveSheet] = useState(0);
  const safeIndex = Math.min(activeSheet, Math.max(0, wynik.arkusze.length - 1));
  const arkusz = wynik.arkusze[safeIndex];
  const { plyta } = rozkroj;

  if (!arkusz) {
    return (
      <div className="grid min-h-64 place-items-center rounded-ctl bg-paper-2 px-8 text-center ring-1 ring-inset ring-hair">
        <div>
          <svg aria-hidden="true" viewBox="0 0 48 48" className="mx-auto size-12 text-mute">
            <rect x="7" y="10" width="34" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M19 10v28M7 25h34" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 3" />
          </svg>
          <p className="mt-4 max-w-xs text-sm leading-6 text-mute">{copy.kreator.pustyRozkroj}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {wynik.arkusze.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={copy.kreator.arkusze}>
          {wynik.arkusze.map((item, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={safeIndex === index}
              onClick={() => setActiveSheet(index)}
              className={`pressable shrink-0 rounded-full px-4 py-2 font-mono text-xs font-semibold tabular-nums ${
                safeIndex === index ? "bg-ink text-white" : "bg-paper-2 text-mute"
              }`}
            >
              {copy.kreator.arkusz} {index + 1} · {liczba.format(item.wykorzystanie * 100)}%
            </button>
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-ctl bg-paper-2 p-3 ring-1 ring-inset ring-hair sm:p-5">
        <svg
          viewBox={`0 0 ${plyta.szerokosc} ${plyta.wysokosc}`}
          role="img"
          aria-label={`${copy.kreator.arkusz} ${safeIndex + 1}`}
          className="block aspect-[2800/2070] w-full"
        >
          <rect width={plyta.szerokosc} height={plyta.wysokosc} rx="18" fill="#E5E7EA" />
          {arkusz.sztuki.map((sztuka, index) => {
            const source = formatki[sztuka.zrodlo];
            return (
              <g key={`${sztuka.zrodlo}-${index}`}>
                <rect
                  x={sztuka.x}
                  y={sztuka.y}
                  width={sztuka.dlugosc}
                  height={sztuka.szerokosc}
                  rx="10"
                  fill={sztuka.zrodlo % 2 === 0 ? "#FFFFFF" : "#F8F8F9"}
                  stroke="#9F0832"
                  strokeOpacity="0.58"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                {sztuka.dlugosc > 360 && sztuka.szerokosc > 170 && (
                  <text
                    x={sztuka.x + sztuka.dlugosc / 2}
                    y={sztuka.y + sztuka.szerokosc / 2}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="#3E444B"
                    fontSize="42"
                    fontFamily="var(--font-mono)"
                  >
                    {source.dlugosc} × {source.szerokosc}
                  </text>
                )}
              </g>
            );
          })}
          <rect
            x="1"
            y="1"
            width={plyta.szerokosc - 2}
            height={plyta.wysokosc - 2}
            rx="18"
            fill="none"
            stroke="#0E1013"
            strokeOpacity="0.2"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}

export function Creator({ dekory }: { dekory: DekorOption[] }) {
  const [formatki, setFormatki] = useState<Formatka[]>([]);
  const [dlugosc, setDlugosc] = useState<number>(kreatorDomyslne.dlugosc);
  const [szerokosc, setSzerokosc] = useState<number>(kreatorDomyslne.szerokosc);
  const [sztuk, setSztuk] = useState<number>(kreatorDomyslne.sztuk);
  const [dekor, setDekor] = useState(dekory[0]?.id ?? "");
  const [sloje, setSloje] = useState(false);
  const [obrzeze, setObrzeze] = useState<Formatka["obrzeze"]>(EMPTY_EDGE);
  const wycena = useMemo(() => wycenUslugi(formatki, kreatorDomyslne.grubosc), [formatki]);

  function addFormatka() {
    if (dlugosc < 1 || szerokosc < 1 || sztuk < 1) return;
    setFormatki((items) => [
      ...items,
      {
        dlugosc,
        szerokosc,
        sztuk: Math.min(sztuk, rozkroj.maxSztuk),
        dekor,
        sloje,
        obrzeze: [...obrzeze],
      },
    ]);
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
      <header className="max-w-3xl">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
          {copy.kreator.eyebrow}
        </p>
        <h1 className="text-balance mt-4 font-display text-[clamp(2.35rem,5vw,4.75rem)] font-bold leading-[0.96] tracking-[-0.055em] text-ink">
          {copy.kreator.tytul}
        </h1>
        <p className="text-pretty mt-5 max-w-2xl text-base leading-7 text-mute sm:text-lg">
          {copy.kreator.opis}
        </p>
      </header>

      <div className="mt-10 grid items-start gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-5">
          <Shell>
            <section aria-labelledby="new-item-title" className="p-5 sm:p-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">01</p>
                  <h2 id="new-item-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                    {copy.kreator.nowaPozycja}
                  </h2>
                </div>
                <span className="rounded-full bg-paper-2 px-3 py-2 font-mono text-[11px] tabular-nums text-mute">
                  {rozKrojFormat()}
                </span>
              </div>

              <div className="mt-6">
                <label htmlFor="dekor" className="text-xs font-semibold text-ink">{copy.kreator.dekor}</label>
                <select
                  id="dekor"
                  value={dekor}
                  onChange={(event) => setDekor(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-ctl bg-paper px-4 text-sm text-ink ring-1 ring-inset ring-hair focus:ring-accent"
                >
                  {dekory.map((item) => (
                    <option key={item.id} value={item.id}>{item.kod} · {item.nazwa}</option>
                  ))}
                </select>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <NumberField id="length" label={copy.kreator.dlugosc} value={dlugosc} max={5000} onChange={setDlugosc} />
                <NumberField id="width" label={copy.kreator.szerokosc} value={szerokosc} max={5000} onChange={setSzerokosc} />
                <NumberField id="quantity" label={copy.kreator.sztuk} value={sztuk} max={rozkroj.maxSztuk} onChange={setSztuk} unit="" />
              </div>

              <label className="mt-5 flex min-h-12 cursor-pointer items-center gap-3 rounded-ctl bg-paper px-4 ring-1 ring-inset ring-hair">
                <input
                  type="checkbox"
                  checked={sloje}
                  onChange={(event) => setSloje(event.target.checked)}
                  className="size-5 accent-accent"
                />
                <span className="text-sm font-medium text-ink">{copy.kreator.sloje}</span>
              </label>

              <div className="mt-7 border-t border-hair pt-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">{copy.kreator.obrzeze}</h3>
                  <span className="font-mono text-xs tabular-nums text-accent-ink">{obrzeze.join(" · ")}</span>
                </div>
                <p id="edge-help" className="mt-1 text-xs leading-5 text-mute">{copy.kreator.obrzezePomoc}</p>
                <div className="mt-3 rounded-ctl bg-paper p-2 ring-1 ring-inset ring-hair">
                  <EdgeEditor
                    value={obrzeze}
                    onChange={setObrzeze}
                    dlugosc={dlugosc}
                    szerokosc={szerokosc}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addFormatka}
                className="pressable mt-6 flex min-h-12 w-full items-center justify-between rounded-full bg-accent py-2 pl-5 pr-2 text-sm font-semibold text-white shadow-[var(--lift-sm)]"
              >
                {copy.kreator.dodaj}
                <span className="grid size-9 place-items-center rounded-full bg-white/14" aria-hidden="true">
                  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </section>
          </Shell>

          <Shell>
            <section aria-labelledby="list-title" className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <h2 id="list-title" className="font-display text-xl font-semibold tracking-tight text-ink">{copy.kreator.lista}</h2>
                <span className="rounded-full bg-paper-2 px-3 py-1.5 font-mono text-xs tabular-nums text-mute">
                  {formatki.reduce((sum, item) => sum + item.sztuk, 0)} {copy.kreator.sztuk.toLowerCase()}
                </span>
              </div>
              {formatki.length === 0 ? (
                <p className="mt-5 rounded-ctl bg-paper-2 px-4 py-6 text-center text-sm leading-6 text-mute ring-1 ring-inset ring-hair">
                  {copy.kreator.pustaLista}
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-hair">
                  {formatki.map((item, index) => {
                    const rejected = policzRozkroj([item]).odrzucone.length > 0;
                    const decorName = dekory.find((option) => option.id === item.dekor);
                    return (
                      <li key={`${item.dekor}-${index}`} className="py-4 first:pt-1 last:pb-0">
                        <div className="flex gap-3">
                          <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-ctl font-mono text-xs font-semibold ${rejected ? "bg-danger-paper text-accent" : "bg-paper-2 text-ink"}`}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="truncate text-sm font-semibold text-ink">{decorName?.kod} · {decorName?.nazwa}</p>
                                <p className="mt-1 font-mono text-xs tabular-nums text-mute">
                                  {item.dlugosc} × {item.szerokosc} {copy.kreator.jednostkaMm} · {item.sztuk} {copy.kreator.sztuk.toLowerCase()}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormatki((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                                className="pressable -mr-2 rounded-full px-3 py-2 text-xs font-semibold text-mute hover:bg-paper-2 hover:text-ink"
                              >
                                {copy.kreator.usun}
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                              <span>{copy.kreator.obrzezeMetry}: {item.obrzeze.join("-")}</span>
                              <span>{copy.kreator.slojeSkrot}: {item.sloje ? copy.kreator.dlugosc.toLowerCase() : copy.kreator.brak}</span>
                            </div>
                            {rejected && (
                              <div className="mt-3 rounded-ctl bg-danger-paper px-3 py-2 text-xs leading-5 text-accent-ink" role="alert">
                                <strong>{copy.kreator.odrzucone}.</strong> {copy.kreator.odrzuconeOpis}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </Shell>
        </div>

        <div className="space-y-5 xl:sticky xl:top-24">
          <Shell>
            <section aria-labelledby="board-title" className="p-5 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">02</p>
                  <h2 id="board-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{copy.kreator.rozkroj}</h2>
                </div>
                <div className="flex gap-6">
                  <Metric label={copy.kreator.arkusze} value={String(wycena.arkuszy)} />
                  <Metric label={copy.kreator.wykorzystanie} value={`${liczba.format(wycena.rozkroj.wykorzystanie * 100)}%`} />
                </div>
              </div>
              <div className="mt-6"><Board formatki={formatki} /></div>
            </section>
          </Shell>

          <Shell>
            <section aria-labelledby="quote-title" className="p-5 sm:p-7">
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">03</p>
                  <h2 id="quote-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{copy.kreator.wycena}</h2>
                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                    <QuoteItem label={`${copy.kreator.ciecie} · ${zloty.format(cennik.cieciePlyty18.cena)}`} value={zloty.format(wycena.kosztCiecia)} />
                    <QuoteItem label={`${copy.kreator.obrzezeMetry} · ${liczba.format(wycena.obrzezeMb)} mb`} value={zloty.format(wycena.kosztOklejania)} />
                    <QuoteItem label={copy.kreator.arkusze} value={String(wycena.arkuszy)} />
                  </dl>
                </div>
                <div className="border-t border-hair pt-5 md:min-w-48 md:border-l md:border-t-0 md:pl-7 md:pt-0 md:text-right">
                  <p className="text-xs font-semibold text-mute">{copy.kreator.razem}</p>
                  <p className="mt-2 font-mono text-3xl font-semibold tracking-tight tabular-nums text-ink">{zloty.format(wycena.razemNetto)}</p>
                </div>
              </div>
              <p className="mt-6 border-t border-hair pt-4 text-xs leading-5 text-mute">{copy.kreator.wycenaInfo}</p>
            </section>
          </Shell>
        </div>
      </div>
    </main>
  );
}

function NumberField({ id, label, value, max, onChange, unit = copy.kreator.jednostkaMm }: { id: string; label: string; value: number; max: number; onChange: (value: number) => void; unit?: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <span className="relative mt-2 block">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min="1"
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-h-12 w-full rounded-ctl bg-paper px-4 pr-11 font-mono text-sm font-medium tabular-nums text-ink ring-1 ring-inset ring-hair focus:ring-accent"
        />
        {unit && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-mute">{unit}</span>}
      </span>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="max-w-28 text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function QuoteItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs leading-5 text-mute">{label}</dt>
      <dd className="mt-1 font-mono font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function rozKrojFormat() {
  return `${rozkroj.plyta.szerokosc} × ${rozkroj.plyta.wysokosc} ${copy.kreator.jednostkaMm}`;
}
