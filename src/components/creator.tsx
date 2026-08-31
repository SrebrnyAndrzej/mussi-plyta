"use client";

import { useMemo, useState } from "react";
import {
  copy,
  cennik,
  importMussi,
  kreatorDomyslne,
  rozkroj,
} from "@/config/brief";
import { policzRozkroj, type Formatka, zapisObrzeza } from "@/lib/nesting";
import { liczba, wycenUslugi, zloty } from "@/lib/pricing";
import { suggestEdge } from "@/lib/edge-matching";
import { parseMussiTable, readMussiFile } from "@/lib/import-formats";
import { Ikona } from "@/components/ikona";

type MaterialOption = {
  id: string;
  kod: string;
  nazwa: string;
  producent: string;
  opis: string;
  dostepnosc: "na-stanie" | "ostatnie-sztuki" | "na-zamowienie";
  probka: string;
};
type EdgeOption = MaterialOption & { grubosciMm: number[] };
type CreatorFormatka = Formatka & { obrzezeProdukt?: string };
type EdgeIndex = 0 | 1 | 2 | 3;
type ImportState = {
  fileName: string;
  items: CreatorFormatka[];
  errors: string[];
  loading: boolean;
};

const EMPTY_EDGE: Formatka["obrzeze"] = [0, 0, 0, 0];

function nextEdge(value: number, thicknesses: number[]) {
  const available = [...new Set(thicknesses.filter((item) => item > 0))].sort((a, b) => a - b);
  if (available.length === 0) return 0;
  const index = available.indexOf(value);
  return index === -1 ? available[0] : available[index + 1] ?? 0;
}

function normalizeEdges(value: Formatka["obrzeze"], thicknesses: number[]): Formatka["obrzeze"] {
  const first = [...new Set(thicknesses.filter((item) => item > 0))].sort((a, b) => a - b)[0] ?? 0;
  return value.map((edge) => (edge === 0 || thicknesses.includes(edge) ? edge : first)) as Formatka["obrzeze"];
}

function availableEdgeThicknesses(product: EdgeOption | undefined) {
  const supported = product?.grubosciMm.filter((item) => item === 1 || item === 2) ?? [];
  return supported.length > 0 ? supported : [1, 2];
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function placedEdges(
  edges: Formatka["obrzeze"],
  rotated: boolean,
): Formatka["obrzeze"] {
  if (!rotated) return edges;
  return [edges[2], edges[3], edges[1], edges[0]];
}

/** Kolejność krawędzi zgodna z typem Formatka: góra, dół, lewa, prawa. */
const KRAWEDZIE = ["Góra", "Dół", "Lewa", "Prawa"] as const;
/** Grubości, które hurtownia trzyma na stanie. Klik przechodzi po nich w kółko. */
const GRUBOSCI: number[] = [0, 1, 2];

function edgeStrokeWidth(value: number) {
  return value === 2 ? 8 : 4;
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
  thicknesses,
}: {
  value: Formatka["obrzeze"];
  onChange: (value: Formatka["obrzeze"]) => void;
  dlugosc: number;
  szerokosc: number;
  thicknesses: number[];
}) {
  const positions = [
    "left-1/2 top-0 h-12 w-[70%] -translate-x-1/2",
    "bottom-0 left-1/2 h-12 w-[70%] -translate-x-1/2",
    "left-0 top-1/2 h-[62%] w-12 -translate-y-1/2",
    "right-0 top-1/2 h-[62%] w-12 -translate-y-1/2",
  ] as const;

  const changeEdge = (edge: EdgeIndex) => {
    const changed: Formatka["obrzeze"] = [...value];
    changed[edge] = nextEdge(changed[edge], thicknesses);
    onChange(changed);
  };

  return (
    <div className="mx-auto w-full max-w-[340px]" aria-describedby="edge-help">
      <div className="relative aspect-[1.55/1] w-full">
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
          const next = nextEdge(value[edge], thicknesses);
          return (
            <button
              key={copy.kreator.krawedzie[edge]}
              type="button"
              aria-label={`${copy.kreator.krawedzStan} ${copy.kreator.krawedzie[edge]}: ${value[edge]} ${
                copy.kreator.jednostkaMm
              }. ${copy.kreator.krawedzPoDotknieciu} ${next} ${copy.kreator.jednostkaMm}.`}
              aria-pressed={active}
              onPointerDown={(event) => {
                if (event.pointerType === "mouse" && event.button !== 0) return;
                event.preventDefault();
                event.currentTarget.focus({ preventScroll: true });
                changeEdge(edge);
              }}
              onKeyDown={(event) => {
                if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                changeEdge(edge);
              }}
              className={`absolute ${position} group rounded-full transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:z-10`}
            >
              <span
                className={`absolute rounded-full ${
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
                {value[edge]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5" aria-live="polite">
        {value.map((edge, index) => (
          <span
            key={copy.kreator.krawedzie[index]}
            className={`rounded-full px-2.5 py-1.5 text-center font-mono text-[9px] font-semibold tabular-nums sm:text-[10px] ${
              edge ? "bg-accent text-white" : "bg-paper-2 text-mute"
            }`}
          >
            {copy.kreator.krawedzie[index]} · {edge} {copy.kreator.jednostkaMm}
          </span>
        ))}
      </div>
    </div>
  );
}

function PieceEdges({
  x,
  y,
  width,
  height,
  edges,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  edges: Formatka["obrzeze"];
}) {
  const [top, bottom, left, right] = edges;
  const common = {
    stroke: "#9F0832",
    strokeLinecap: "square" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <g aria-hidden="true">
      {top > 0 && <line {...common} x1={x} y1={y} x2={x + width} y2={y} strokeWidth={edgeStrokeWidth(top)} />}
      {bottom > 0 && <line {...common} x1={x} y1={y + height} x2={x + width} y2={y + height} strokeWidth={edgeStrokeWidth(bottom)} />}
      {left > 0 && <line {...common} x1={x} y1={y} x2={x} y2={y + height} strokeWidth={edgeStrokeWidth(left)} />}
      {right > 0 && <line {...common} x1={x + width} y1={y} x2={x + width} y2={y + height} strokeWidth={edgeStrokeWidth(right)} />}
    </g>
  );
}

function Board({
  formatki,
  onZmienObrzeze,
}: {
  formatki: Formatka[];
  /** Null oznacza podgląd bez edycji, na przykład na stronie głównej. */
  onZmienObrzeze?: (indeks: number, obrzeze: Formatka["obrzeze"]) => void;
}) {
  const wynik = useMemo(() => policzRozkroj(formatki), [formatki]);
  const [activeSheet, setActiveSheet] = useState(0);
  /* Indeks formatki źródłowej, nie ułożonej sztuki: obrzeże należy do formatki,
     a ta sama formatka bywa ułożona wiele razy. */
  const [wybrana, setWybrana] = useState<number | null>(null);
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
        <div className="mb-4 rounded-ctl bg-paper p-2 ring-1 ring-inset ring-hair">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <span className="text-xs font-semibold text-ink">{copy.kreator.arkusze}</span>
            <span className="font-mono text-[10px] font-semibold tabular-nums text-mute">
              {copy.kreator.arkusz} {safeIndex + 1} / {wynik.arkusze.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={copy.kreator.arkusze}>
            {wynik.arkusze.map((item, index) => (
              <button
                key={index}
                id={`sheet-tab-${index}`}
                type="button"
                role="tab"
                aria-controls={`sheet-panel-${index}`}
                aria-selected={safeIndex === index}
                tabIndex={safeIndex === index ? 0 : -1}
                onClick={() => setActiveSheet(index)}
                className={`pressable min-h-11 shrink-0 rounded-full px-4 font-mono text-xs font-semibold tabular-nums ${
                  safeIndex === index ? "bg-ink text-white" : "bg-paper-2 text-mute"
                }`}
              >
                {copy.kreator.arkusz} {index + 1} · {liczba.format(item.wykorzystanie * 100)}%
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        id={`sheet-panel-${safeIndex}`}
        role={wynik.arkusze.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={wynik.arkusze.length > 1 ? `sheet-tab-${safeIndex}` : undefined}
        className="overflow-hidden rounded-ctl bg-paper-2 p-3 ring-1 ring-inset ring-hair sm:p-5"
      >
        <svg
          viewBox={`0 0 ${plyta.szerokosc} ${plyta.wysokosc}`}
          role="img"
          aria-label={`${copy.kreator.arkusz} ${safeIndex + 1}`}
          className="block aspect-[2800/2070] w-full"
        >
          <rect width={plyta.szerokosc} height={plyta.wysokosc} rx="18" fill="#E5E7EA" />
          {arkusz.sztuki.map((sztuka, index) => {
            const source = formatki[sztuka.zrodlo];
            const edges = placedEdges(source.obrzeze, sztuka.obrocona);
            const zaznaczona = wybrana === sztuka.zrodlo;
            const klikalna = Boolean(onZmienObrzeze);
            return (
              <g
                key={`${sztuka.zrodlo}-${index}`}
                role={klikalna ? "button" : undefined}
                tabIndex={klikalna ? 0 : undefined}
                aria-label={
                  klikalna
                    ? `${source.dlugosc} na ${source.szerokosc} mm, obrzeże ${zapisObrzeza(source.obrzeze)}, zmień`
                    : undefined
                }
                aria-pressed={klikalna ? zaznaczona : undefined}
                onClick={klikalna ? () => setWybrana(sztuka.zrodlo) : undefined}
                onKeyDown={
                  klikalna
                    ? (event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        setWybrana(sztuka.zrodlo);
                      }
                    : undefined
                }
                className={klikalna ? "cursor-pointer focus:outline-none" : undefined}
              >
                <rect
                  x={sztuka.x}
                  y={sztuka.y}
                  width={sztuka.dlugosc}
                  height={sztuka.szerokosc}
                  rx="10"
                  fill={zaznaczona ? "#FFF4F5" : sztuka.zrodlo % 2 === 0 ? "#FFFFFF" : "#F8F8F9"}
                  stroke="#9F0832"
                  strokeOpacity={zaznaczona ? 1 : 0.58}
                  strokeWidth={zaznaczona ? 4 : 2}
                  vectorEffect="non-scaling-stroke"
                />
                <PieceEdges
                  x={sztuka.x}
                  y={sztuka.y}
                  width={sztuka.dlugosc}
                  height={sztuka.szerokosc}
                  edges={edges}
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

        {onZmienObrzeze && wybrana !== null && formatki[wybrana] && (
          <div className="mt-4 rounded-ctl bg-surface p-4 ring-1 ring-hair">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-mono text-[11px] text-mute">
                {formatki[wybrana].dlugosc} × {formatki[wybrana].szerokosc} mm
                <span className="ml-2 text-ink">obrzeże {zapisObrzeza(formatki[wybrana].obrzeze)}</span>
              </p>
              <button
                type="button"
                onClick={() => setWybrana(null)}
                className="pressable min-h-11 rounded-full px-3 text-[11px] font-semibold text-mute hover:text-ink"
              >
                Zamknij
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {KRAWEDZIE.map((krawedz, pozycja) => {
                const wartosc = formatki[wybrana!].obrzeze[pozycja];
                return (
                  <button
                    key={krawedz}
                    type="button"
                    /* Klik przechodzi przez dostępne grubości i wraca do braku,
                       żeby jedna kontrolka obsłużyła włączenie i wybór grubości. */
                    onClick={() => {
                      const nastepna = GRUBOSCI[(GRUBOSCI.indexOf(wartosc) + 1) % GRUBOSCI.length] ?? 0;
                      const zmienione = [...formatki[wybrana!].obrzeze] as Formatka["obrzeze"];
                      zmienione[pozycja] = nastepna;
                      onZmienObrzeze(wybrana!, zmienione);
                    }}
                    className={`pressable min-h-12 rounded-ctl px-3 text-left text-xs font-semibold ring-1 ${
                      wartosc > 0 ? "bg-danger-paper text-accent-ink ring-accent/20" : "bg-paper text-mute ring-hair"
                    }`}
                  >
                    <span className="block">{krawedz}</span>
                    <span className="mt-0.5 block font-mono text-[10px] font-normal">
                      {wartosc > 0 ? `${wartosc} mm` : "bez obrzeża"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onZmienObrzeze(wybrana!, [1, 1, 1, 1])}
                className="pressable min-h-11 rounded-full bg-paper px-4 text-[11px] font-semibold text-ink ring-1 ring-hair"
              >
                Dookoła 1 mm
              </button>
              <button
                type="button"
                onClick={() => onZmienObrzeze(wybrana!, [2, 2, 2, 2])}
                className="pressable min-h-11 rounded-full bg-paper px-4 text-[11px] font-semibold text-ink ring-1 ring-hair"
              >
                Dookoła 2 mm
              </button>
              <button
                type="button"
                onClick={() => onZmienObrzeze(wybrana!, [0, 0, 0, 0])}
                className="pressable min-h-11 rounded-full bg-paper px-4 text-[11px] font-semibold text-mute ring-1 ring-hair"
              >
                Zdejmij obrzeże
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EdgeProductPicker({
  edges,
  selectedId,
  suggestionId,
  onSelect,
}: {
  edges: EdgeOption[];
  selectedId: string;
  suggestionId?: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = edges.find((item) => item.id === selectedId);
  const normalizedQuery = normalizeSearch(query);
  const results = useMemo(() => {
    const filtered = normalizedQuery
      ? edges.filter((item) =>
          normalizeSearch(`${item.kod} ${item.nazwa} ${item.producent}`).includes(normalizedQuery),
        )
      : edges;

    return [...filtered]
      .sort((a, b) => {
        if (a.id === suggestionId) return -1;
        if (b.id === suggestionId) return 1;
        return a.kod.localeCompare(b.kod, "pl");
      })
      .slice(0, 12);
  }, [edges, normalizedQuery, suggestionId]);

  if (!selected) {
    return (
      <p className="mt-4 rounded-ctl bg-danger-paper px-3 py-2 text-xs text-accent-ink" role="status">
        {copy.kreator.obrzezeBrak}
      </p>
    );
  }

  const suggestionSelected = selected.id === suggestionId;

  return (
    <div className="mt-4 rounded-ctl bg-paper-2 p-3 ring-1 ring-inset ring-hair">
      <div className="flex items-center gap-3">
        <span
          className="size-10 shrink-0 rounded-[8px] ring-1 ring-inset ring-hair"
          style={{ background: selected.probka }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">{selected.kod} · {selected.nazwa}</p>
            <span className={`rounded-full px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${
              suggestionSelected ? "bg-accent text-white" : "bg-surface text-mute ring-1 ring-inset ring-hair"
            }`}>
              {suggestionSelected ? copy.kreator.obrzezeSugestia : copy.kreator.obrzezeWybraneRecznie}
            </span>
          </div>
          <p className="mt-1 font-mono text-[10px] tabular-nums text-mute">
            {selected.grubosciMm.join(" / ")} {copy.kreator.jednostkaMm} · {selected.producent}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="pressable mt-3 flex min-h-11 w-full items-center justify-between rounded-ctl bg-surface px-3 text-left text-sm font-semibold text-ink ring-1 ring-inset ring-hair"
        aria-expanded={open}
        aria-controls="edge-product-results"
        onClick={() =>
          setOpen((current) => {
            if (current) setQuery("");
            return !current;
          })
        }
      >
        {open ? copy.kreator.obrzezeZamknij : copy.kreator.obrzezeZmien}
        <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-4 transition-transform duration-180 ease-[var(--ease-out)] ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div id="edge-product-results" className="mt-2 rounded-ctl bg-surface p-2 ring-1 ring-inset ring-hair">
          <label className="block">
            <span className="sr-only">{copy.kreator.obrzezeSzukaj}</span>
            <span className="relative block">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="9" cy="9" r="5" />
                <path d="m13 13 4 4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setOpen(false);
                    setQuery("");
                  }
                }}
                placeholder={copy.kreator.obrzezeSzukaj}
                autoFocus
                className="min-h-11 w-full rounded-ctl bg-paper pl-10 pr-3 text-sm text-ink ring-1 ring-inset ring-hair placeholder:text-mute focus:ring-accent"
              />
            </span>
          </label>

          {results.length > 0 ? (
            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto" role="listbox" aria-label={copy.kreator.obrzezeWyniki}>
              {results.map((item) => {
                const recommended = item.id === suggestionId;
                const active = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`pressable flex min-h-14 w-full items-center gap-3 rounded-ctl p-2 text-left ${
                      active ? "bg-danger-paper ring-1 ring-inset ring-accent/15" : "hover:bg-paper"
                    }`}
                  >
                    <span className="size-9 shrink-0 rounded-[7px] ring-1 ring-inset ring-hair" style={{ background: item.probka }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-ink">{item.kod} · {item.nazwa}</span>
                        {recommended && <span className="shrink-0 font-mono text-[8px] font-semibold uppercase tracking-[0.08em] text-accent-ink">{copy.kreator.obrzezeSugestia}</span>}
                      </span>
                      <span className="mt-1 block font-mono text-[9px] tabular-nums text-mute">
                        {item.grubosciMm.join(" / ")} {copy.kreator.jednostkaMm} · {item.producent}
                      </span>
                    </span>
                    {active && (
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-6 text-center text-xs leading-5 text-mute" role="status">{copy.kreator.obrzezeBrakWynikow}</p>
          )}
        </div>
      )}
    </div>
  );
}

function resolveMaterial(value: string, materialy: MaterialOption[], fallbackId: string) {
  if (!value.trim()) return materialy.find((item) => item.id === fallbackId);
  const query = normalizeSearch(value).replace(/\s/g, "");
  return materialy.find((item) => {
    const id = normalizeSearch(item.id).replace(/\s/g, "");
    const code = normalizeSearch(item.kod).replace(/\s/g, "");
    const name = normalizeSearch(item.nazwa).replace(/\s/g, "");
    return query === id || query === code || query === name || name.includes(query);
  });
}

function ImportPanel({
  materialy,
  obrzeza,
  defaultMaterialId,
  onImport,
}: {
  materialy: MaterialOption[];
  obrzeza: EdgeOption[];
  defaultMaterialId: string;
  onImport: (items: CreatorFormatka[]) => void;
}) {
  const [state, setState] = useState<ImportState>({ fileName: "", items: [], errors: [], loading: false });
  const template = `${importMussi.kolumny.join(importMussi.separator)}\n${importMussi.przyklad.join(importMussi.separator)}`;

  async function handleFile(file: File) {
    setState({ fileName: file.name, items: [], errors: [], loading: true });
    try {
      const parsed = parseMussiTable(await readMussiFile(file));
      const errors = [...parsed.errors];
      const items: CreatorFormatka[] = [];
      const unknownMaterials = new Set<string>();
      parsed.rows.forEach((row) => {
        const resolvedMaterial = resolveMaterial(row.dekor, materialy, "");
        const material = resolvedMaterial ?? materialy.find((item) => item.id === defaultMaterialId);
        if (!material) {
          errors.push(`${copy.kreator.importBrakDekoru}: wiersz ${row.sourceRow}, ${row.dekor || copy.kreator.brak}.`);
          return;
        }
        if (!resolvedMaterial && row.dekor && !unknownMaterials.has(row.dekor)) {
          unknownMaterials.add(row.dekor);
          errors.push(`${row.dekor}: ${copy.kreator.importBrakDekoru}; ${copy.kreator.importDekorZastepczy} ${material.kod}.`);
        }
        const edge = suggestEdge(material, obrzeza)?.product ?? obrzeza[0];
        items.push({
          dlugosc: row.dlugosc,
          szerokosc: row.szerokosc,
          sztuk: Math.min(row.sztuk, rozkroj.maxSztuk),
          dekor: material.id,
          sloje: row.sloje,
          obrzeze: normalizeEdges(row.obrzeze, availableEdgeThicknesses(edge)),
          obrzezeProdukt: edge?.id,
        });
      });
      setState({ fileName: file.name, items, errors, loading: false });
    } catch (error) {
      setState({
        fileName: file.name,
        items: [],
        errors: [error instanceof Error ? error.message : copy.kreator.importBladPliku],
        loading: false,
      });
    }
  }

  return (
    <Shell>
      <section aria-labelledby="import-title" className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">{copy.kreator.importFormaty}</p>
            <h2 id="import-title" className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">{copy.kreator.importTytul}</h2>
            <p className="mt-2 max-w-md text-xs leading-5 text-mute">{copy.kreator.importOpis}</p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(template)}`}
            download="mussi-formatki-wzor.csv"
            className="pressable inline-flex min-h-11 w-fit items-center rounded-full bg-paper px-4 text-xs font-semibold text-ink ring-1 ring-inset ring-hair"
          >
            {copy.kreator.importWzor}
          </a>
        </div>

        <div className="mt-5 rounded-ctl bg-paper-2 p-3 ring-1 ring-inset ring-hair">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-accent-ink">{copy.kreator.importKlucz}</p>
          <p className="mt-2 overflow-x-auto whitespace-nowrap font-mono text-[10px] text-ink">{importMussi.kolumny.join(" · ")}</p>
          <p className="mt-2 text-[11px] leading-5 text-mute">{copy.kreator.importPomoc}</p>
        </div>

        <label htmlFor="mussi-file-import" className="pressable mt-4 flex min-h-16 cursor-pointer items-center gap-4 rounded-ctl bg-surface px-4 ring-1 ring-inset ring-hair hover:bg-paper">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-paper text-accent-ink" aria-hidden="true">
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M10 13V3m0 0L6 7m4-4 4 4M4 11v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{state.loading ? copy.kreator.importCzytanie : copy.kreator.importWybierz}</span>
            <span className="mt-1 block truncate font-mono text-[10px] text-mute">{state.fileName || ".csv · .xlsx"}</span>
          </span>
          <input
            id="mussi-file-import"
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            disabled={state.loading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
        </label>

        {(state.items.length > 0 || state.errors.length > 0) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-live="polite">
            <div className="rounded-ctl bg-paper p-4 ring-1 ring-inset ring-hair">
              <p className="text-xs text-mute">{copy.kreator.importGotowe}</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">{state.items.length}</p>
              {state.items.slice(0, 3).map((item, index) => (
                <p key={`${item.dekor}-${index}`} className="mt-2 truncate font-mono text-[9px] uppercase tracking-[0.08em] text-mute">
                  {item.dlugosc} × {item.szerokosc} · {item.sztuk} szt. · {item.obrzeze.join("")}
                </p>
              ))}
            </div>
            <div
              className={`rounded-ctl p-4 ring-1 ring-inset ${state.errors.length > 0 ? "bg-danger-paper text-accent-ink ring-accent/15" : "bg-paper text-mute ring-hair"}`}
              role={state.errors.length > 0 ? "alert" : undefined}
            >
              <p className="text-xs font-semibold">{copy.kreator.importBledy}</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{state.errors.length}</p>
              {state.errors.slice(0, 3).map((error) => <p key={error} className="mt-2 text-[11px] leading-5">{error}</p>)}
            </div>
          </div>
        )}

        {state.items.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onImport(state.items);
                setState({ fileName: "", items: [], errors: [], loading: false });
              }}
              className="pressable min-h-11 flex-1 rounded-full bg-accent px-5 text-sm font-semibold text-white"
            >
              {copy.kreator.importDodaj} · {state.items.length}
            </button>
            <button type="button" onClick={() => setState({ fileName: "", items: [], errors: [], loading: false })} className="pressable min-h-11 rounded-full bg-paper px-5 text-xs font-semibold text-mute ring-1 ring-inset ring-hair">
              {copy.kreator.importWyczysc}
            </button>
          </div>
        )}
      </section>
    </Shell>
  );
}

export function Creator({
  materialy,
  obrzeza,
  initialMaterialId,
}: {
  materialy: MaterialOption[];
  obrzeza: EdgeOption[];
  initialMaterialId?: string;
}) {
  const initialMaterial = materialy.find((item) => item.id === initialMaterialId) ?? materialy[0];
  const initialSuggestion = suggestEdge(initialMaterial, obrzeza);
  const [formatki, setFormatki] = useState<CreatorFormatka[]>([]);
  const [dlugosc, setDlugosc] = useState<number>(kreatorDomyslne.dlugosc);
  const [szerokosc, setSzerokosc] = useState<number>(kreatorDomyslne.szerokosc);
  const [sztuk, setSztuk] = useState<number>(kreatorDomyslne.sztuk);
  const [dekor, setDekor] = useState(initialMaterial?.id ?? "");
  const [obrzezeProdukt, setObrzezeProdukt] = useState(initialSuggestion?.product.id ?? obrzeza[0]?.id ?? "");
  const [sloje, setSloje] = useState(false);
  const [obrzeze, setObrzeze] = useState<Formatka["obrzeze"]>(EMPTY_EDGE);
  const wycena = useMemo(() => wycenUslugi(formatki, kreatorDomyslne.grubosc), [formatki]);
  const material = materialy.find((item) => item.id === dekor);
  const suggestion = useMemo(() => suggestEdge(material, obrzeza), [material, obrzeza]);
  const selectedEdge = obrzeza.find((item) => item.id === obrzezeProdukt);
  const edgeThicknesses = availableEdgeThicknesses(selectedEdge);

  function selectMaterial(id: string) {
    setDekor(id);
    const nextMaterial = materialy.find((item) => item.id === id);
    const nextSuggestion = suggestEdge(nextMaterial, obrzeza);
    const nextEdgeId = nextSuggestion?.product.id ?? obrzeza[0]?.id ?? "";
    const nextProduct = obrzeza.find((item) => item.id === nextEdgeId);
    const nextThicknesses = availableEdgeThicknesses(nextProduct);
    setObrzezeProdukt(nextEdgeId);
    setObrzeze((current) => normalizeEdges(current, nextThicknesses));
  }

  function selectEdgeProduct(id: string) {
    const nextProduct = obrzeza.find((item) => item.id === id);
    const nextThicknesses = availableEdgeThicknesses(nextProduct);
    setObrzezeProdukt(id);
    setObrzeze((current) => normalizeEdges(current, nextThicknesses));
  }

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
        obrzezeProdukt,
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
        {/* min-w-0: element siatki domyślnie ma min-width auto i nie zwęża się
            poniżej naturalnej szerokości treści, co na telefonie rozpychało
            kolumnę do 544 px i dawało przewijanie w poziomie. */}
        <div className="min-w-0 space-y-5">
          <ImportPanel
            materialy={materialy}
            obrzeza={obrzeza}
            defaultMaterialId={dekor}
            onImport={(items) => setFormatki((current) => [...current, ...items])}
          />
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
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="dekor" className="text-xs font-semibold text-ink">{copy.kreator.dekor}</label>
                  {initialMaterialId && material?.id === initialMaterialId && (
                    <span className="rounded-full bg-danger-paper px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-accent-ink">
                      {copy.kreator.wybranoZKatalogu}
                    </span>
                  )}
                </div>
                <select
                  id="dekor"
                  value={dekor}
                  onChange={(event) => selectMaterial(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-ctl bg-paper px-4 text-sm text-ink ring-1 ring-inset ring-hair focus:ring-accent"
                >
                  {materialy.map((item) => (
                    <option key={item.id} value={item.id}>{item.kod} · {item.nazwa}</option>
                  ))}
                </select>
                {material && (
                  <div className="mt-2 flex items-center gap-3 rounded-ctl bg-paper-2 p-2.5 ring-1 ring-inset ring-hair">
                    <span
                      className="size-9 shrink-0 rounded-[7px] ring-1 ring-inset ring-hair"
                      style={{ background: material.probka }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">{material.kod} · {material.nazwa}</p>
                      <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.08em] text-mute">
                        {material.producent} · {material.opis}
                      </p>
                    </div>
                  </div>
                )}
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
                  <span className="rounded-full bg-danger-paper px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-accent-ink">
                    {obrzeze.join(" · ")}
                  </span>
                </div>
                <p id="edge-help" className="mt-1 text-xs leading-5 text-mute">{copy.kreator.obrzezePomoc}</p>
                <EdgeProductPicker
                  edges={obrzeza}
                  selectedId={obrzezeProdukt}
                  suggestionId={suggestion?.product.id}
                  onSelect={selectEdgeProduct}
                />
                <div className="mt-3 rounded-ctl bg-paper p-2 ring-1 ring-inset ring-hair">
                  <EdgeEditor
                    value={obrzeze}
                    onChange={setObrzeze}
                    dlugosc={dlugosc}
                    szerokosc={szerokosc}
                    thicknesses={edgeThicknesses}
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
                <div className="mt-5 grid min-h-44 place-items-center rounded-ctl bg-paper-2 px-5 py-8 text-center ring-1 ring-inset ring-hair" role="status">
                  <div>
                    <span className="mx-auto grid size-11 place-items-center rounded-full bg-surface text-mute ring-1 ring-inset ring-hair" aria-hidden="true">
                      <Ikona nazwa="projekty" rozmiar={20} />
                    </span>
                    <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-mute">{copy.kreator.pustaLista}</p>
                  </div>
                </div>
              ) : (
                <ul
                  className={`mt-4 divide-y divide-hair ${formatki.length > 6 ? "max-h-[36rem] overflow-y-auto overscroll-contain pr-2" : ""}`}
                  aria-label={copy.kreator.lista}
                  tabIndex={formatki.length > 6 ? 0 : undefined}
                >
                  {formatki.map((item, index) => {
                    const rejected = policzRozkroj([item]).odrzucone.length > 0;
                    const decorName = materialy.find((option) => option.id === item.dekor);
                    const edgeName = obrzeza.find((option) => option.id === item.obrzezeProdukt);
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
                                className="pressable -mr-2 min-h-11 rounded-full px-3 text-xs font-semibold text-mute hover:bg-paper-2 hover:text-ink"
                              >
                                {copy.kreator.usun}
                              </button>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                              <EdgeSummary value={item.obrzeze} />
                              {edgeName && <span>{copy.kreator.obrzezeProdukt}: {edgeName.kod}</span>}
                              <span>{copy.kreator.slojeSkrot}: {item.sloje ? copy.kreator.dlugosc.toLowerCase() : copy.kreator.brak}</span>
                            </div>
                            {rejected && (
                              <div className="mt-3 rounded-ctl bg-danger-paper px-3 py-2 text-xs leading-5 text-accent-ink" role="alert">
                                <strong>{copy.kreator.odrzucone}.</strong> {copy.kreator.odrzuconeOpis} {copy.kreator.wymiary}: {item.dlugosc} × {item.szerokosc} {copy.kreator.jednostkaMm}; {copy.kreator.arkusz.toLowerCase()}: {rozkroj.plyta.szerokosc} × {rozkroj.plyta.wysokosc} {copy.kreator.jednostkaMm}.
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
              <div className="mt-6">
                <Board
                  formatki={formatki}
                  onZmienObrzeze={(indeks, obrzeze) =>
                    setFormatki((items) =>
                      items.map((item, i) => (i === indeks ? { ...item, obrzeze } : item)),
                    )
                  }
                />
              </div>
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

function EdgeSummary({ value }: { value: Formatka["obrzeze"] }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative block h-7 w-10 rounded-[3px] bg-paper-2 ring-1 ring-inset ring-hair" aria-hidden="true">
        {value[0] > 0 && <span className={`absolute inset-x-0 top-0 bg-accent ${value[0] === 2 ? "h-1" : "h-0.5"}`} />}
        {value[1] > 0 && <span className={`absolute inset-x-0 bottom-0 bg-accent ${value[1] === 2 ? "h-1" : "h-0.5"}`} />}
        {value[2] > 0 && <span className={`absolute inset-y-0 left-0 bg-accent ${value[2] === 2 ? "w-1" : "w-0.5"}`} />}
        {value[3] > 0 && <span className={`absolute inset-y-0 right-0 bg-accent ${value[3] === 2 ? "w-1" : "w-0.5"}`} />}
      </span>
      <span>{copy.kreator.obrzezeMetry}: {value.join("-")}</span>
    </span>
  );
}

function rozKrojFormat() {
  return `${rozkroj.plyta.szerokosc} × ${rozkroj.plyta.wysokosc} ${copy.kreator.jednostkaMm}`;
}
