"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Ikona } from "@/components/ikona";
import { kontrahentDemo, obslugaZamowien } from "@/config/brief";
import { cartCopy, cartServiceDemo } from "@/data/portal-demo";
import type { Dekor, Dostepnosc } from "@/data/dekory";
import { readCartBrowserLines, saveCartBrowserState } from "@/lib/cart-browser";
import { cenaDlaKontrahenta, podsumujKoszyk, zloty } from "@/lib/pricing";

type CartGroup = keyof typeof cartCopy.groups;

type CartProduct = Pick<
  Dekor,
  "id" | "kod" | "nazwa" | "producent" | "kategoria" | "cenaKatalogowa" | "dostepnosc"
> & {
  jednostka: string;
};

type CartLine = CartProduct & {
  ilosc: number;
};

const startQuantities: Record<string, number> = {
  k003: 7,
  abs22: 96,
  "blum-cliptop": 12,
  "gtv-push": 8,
};

function groupFor(category: CartProduct["kategoria"]): CartGroup {
  if (category === "obrzeze") return "obrzeze";
  if (category === "akcesorium") return "akcesorium";
  return "plyta";
}

function initialLines(products: CartProduct[], selectedId?: string): CartLine[] {
  const lines = products
    .filter((product) => startQuantities[product.id])
    .map((product) => ({ ...product, ilosc: startQuantities[product.id] }));

  lines.push({
    ...cartServiceDemo,
    kategoria: "plyta",
    ilosc: 1,
  });

  const selected = products.find((product) => product.id === selectedId);
  if (!selected) return lines;

  const existing = lines.find((line) => line.id === selected.id);
  if (existing) existing.ilosc += 1;
  else lines.push({ ...selected, ilosc: 1 });

  return lines;
}

function pluralizeItems(count: number) {
  if (count === 1) return cartCopy.item;
  if (count >= 2 && count <= 4) return cartCopy.itemsFew;
  return cartCopy.itemsMany;
}

export function Cart({ products, selectedId }: { products: CartProduct[]; selectedId?: string }) {
  const [lines, setLines] = useState<CartLine[]>(() => initialLines(products, selectedId));
  const [submitted, setSubmitted] = useState(false);
  const [browserReady, setBrowserReady] = useState(false);

  const summary = useMemo(
    () =>
      podsumujKoszyk(
        lines.map((line) => ({
          nazwa: line.nazwa,
          ilosc: line.ilosc,
          jednostka: line.jednostka,
          cenaKatalogowa: line.cenaKatalogowa,
        })),
        kontrahentDemo.kodProgu,
      ),
    [lines],
  );

  const groups = useMemo(() => {
    const grouped = new Map<CartGroup, CartLine[]>();
    for (const line of lines) {
      const group = line.id === cartServiceDemo.id ? "usluga" : groupFor(line.kategoria);
      grouped.set(group, [...(grouped.get(group) ?? []), line]);
    }
    return [...grouped.entries()];
  }, [lines]);

  const needsConfirmation = lines.some((line) => line.dostepnosc !== "na-stanie");

  useEffect(() => {
    const stored = readCartBrowserLines<CartLine>();
    const selected = products.find((product) => product.id === selectedId);
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (stored) {
        if (selected) {
          const existing = stored.find((line) => line.id === selected.id);
          setLines(existing
            ? stored.map((line) => line.id === selected.id ? { ...line, ilosc: line.ilosc + 1 } : line)
            : [...stored, { ...selected, ilosc: 1 }]);
        } else {
          setLines(stored);
        }
      }
      setBrowserReady(true);
    });
    return () => { cancelled = true; };
  }, [products, selectedId]);

  useEffect(() => {
    if (!browserReady) return;
    saveCartBrowserState(lines, {
      lines: lines.length,
      items: lines.reduce((sum, line) => sum + line.ilosc, 0),
      gross: summary.brutto,
    });
  }, [browserReady, lines, summary.brutto]);

  function changeQuantity(id: string, change: number) {
    setSubmitted(false);
    setLines((current) =>
      current.map((line) =>
        line.id === id ? { ...line, ilosc: Math.max(1, Math.min(999, line.ilosc + change)) } : line,
      ),
    );
  }

  function removeLine(id: string) {
    setSubmitted(false);
    setLines((current) => current.filter((line) => line.id !== id));
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pt-12">
      <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">{cartCopy.eyebrow}</p>
          <h1 className="text-balance mt-4 font-display text-[clamp(2.7rem,5vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.055em] text-ink">{cartCopy.title}</h1>
          <p className="text-pretty mt-5 max-w-2xl text-base leading-7 text-mute sm:text-lg">{cartCopy.subtitle}</p>
        </div>
        <Link href="/katalog" className="pressable inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-5 text-sm font-semibold text-ink ring-1 ring-hair">
          {cartCopy.backToCatalog}
        </Link>
      </header>

      {selectedId && (
        <p aria-live="polite" className="mt-6 rounded-ctl bg-[#edf7f0] px-4 py-3 text-sm font-medium text-ok ring-1 ring-[#c8e4d2]">
          {cartCopy.addedFromCatalog}
        </p>
      )}

      {submitted && (
        <section aria-live="polite" className="mt-6 rounded-core bg-[#edf7f0] p-5 ring-1 ring-[#c8e4d2]">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink">{cartCopy.submitted}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">{cartCopy.submittedHint}</p>
        </section>
      )}

      {lines.length === 0 ? (
        <section className="mt-8 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="grid min-h-80 place-items-center rounded-core bg-surface px-6 text-center shadow-[var(--inner)]">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-paper text-accent"><Ikona nazwa="koszyk" rozmiar={24} /></span>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{cartCopy.emptyTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-mute">{cartCopy.emptyHint}</p>
              <Link href="/katalog" className="pressable mt-6 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white">{cartCopy.browseCatalog}</Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)] xl:items-start">
          <section aria-labelledby="cart-items-title" className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
            <div className="rounded-core bg-surface p-4 shadow-[var(--inner)] sm:p-6">
              <div className="flex items-baseline justify-between gap-4 border-b border-hair pb-5">
                <h2 id="cart-items-title" className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink">{cartCopy.items}</h2>
                <p className="font-mono text-xs tabular-nums text-mute">{lines.length} {pluralizeItems(lines.length)}</p>
              </div>

              <div className="divide-y divide-hair">
                {groups.map(([group, groupLines]) => (
                  <section key={group} aria-labelledby={`cart-group-${group}`} className="py-6 first:pt-5 last:pb-0">
                    <h3 id={`cart-group-${group}`} className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">{cartCopy.groups[group]}</h3>
                    <ul className="mt-3 divide-y divide-hair-2">
                      {groupLines.map((line) => {
                        const unitPrice = cenaDlaKontrahenta(line.cenaKatalogowa, kontrahentDemo.kodProgu);
                        return (
                          <li key={line.id} className="grid gap-4 py-5 first:pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-mute">{line.kod}</span>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${line.dostepnosc === "na-stanie" ? "bg-[#edf7f0] text-ok" : "bg-[#fff7e8] text-warning"}`}>
                                  {cartCopy.availability[line.dostepnosc as Dostepnosc]}
                                </span>
                              </div>
                              <h4 className="text-balance mt-2 font-display text-lg font-semibold leading-tight tracking-[-0.02em] text-ink">{line.nazwa}</h4>
                              <p className="mt-1 text-xs text-mute">{line.producent} · {cartCopy.unitPrice}: <span className="font-mono tabular-nums text-ink">{zloty.format(unitPrice)} / {line.jednostka}</span></p>
                            </div>

                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                              <div>
                                <p className="mb-2 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-mute">{cartCopy.quantity}</p>
                                <div className="flex items-center rounded-full bg-paper p-1 ring-1 ring-hair">
                                  <button type="button" onClick={() => changeQuantity(line.id, -1)} disabled={line.ilosc <= 1} aria-label={`${cartCopy.quantity}: mniej, ${line.nazwa}`} className="pressable grid size-9 place-items-center rounded-full text-ink disabled:cursor-not-allowed disabled:opacity-35"><Ikona nazwa="minus" rozmiar={15} /></button>
                                  <output aria-live="polite" className="min-w-11 text-center font-mono text-sm font-semibold tabular-nums text-ink">{line.ilosc}</output>
                                  <button type="button" onClick={() => changeQuantity(line.id, 1)} aria-label={`${cartCopy.quantity}: więcej, ${line.nazwa}`} className="pressable grid size-9 place-items-center rounded-full text-ink"><Ikona nazwa="plus" rozmiar={15} /></button>
                                </div>
                              </div>
                              <div className="min-w-24 text-right">
                                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">{cartCopy.lineValue}</p>
                                <strong className="mt-2 block font-mono text-sm tabular-nums text-ink">{zloty.format(unitPrice * line.ilosc)}</strong>
                              </div>
                              <button type="button" onClick={() => removeLine(line.id)} aria-label={`${cartCopy.remove}: ${line.nazwa}`} className="pressable grid size-10 shrink-0 place-items-center rounded-full text-mute ring-1 ring-hair hover:text-accent-ink"><Ikona nazwa="usun" rozmiar={17} /></button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </section>

          <aside className="rounded-shell bg-shell p-1.5 ring-1 ring-hair xl:sticky xl:top-6">
            <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-accent-ink">{cartCopy.demoLabel}</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">{cartCopy.summary}</h2>
                </div>
                <Ikona nazwa="koszyk" className="text-accent" rozmiar={24} />
              </div>
              <p className="mt-3 text-xs leading-5 text-mute">{cartCopy.customerPriceHint}</p>

              <dl className="mt-6 divide-y divide-hair border-y border-hair">
                <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-mute">{cartCopy.net}</dt><dd className="font-mono text-base font-semibold tabular-nums text-ink">{zloty.format(summary.wartoscNetto)}</dd></div>
                <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-mute">{cartCopy.vat}</dt><dd className="font-mono text-base font-semibold tabular-nums text-ink">{zloty.format(summary.vat)}</dd></div>
                <div className="flex items-end justify-between gap-4 py-5"><dt className="text-sm font-semibold text-ink">{cartCopy.gross}</dt><dd className="font-display text-3xl font-bold tracking-[-0.045em] tabular-nums text-accent">{zloty.format(summary.brutto)}</dd></div>
              </dl>

              <div className={`mt-5 rounded-ctl p-4 ring-1 ${needsConfirmation ? "bg-[#fff7e8] ring-[#ead7ae]" : "bg-[#edf7f0] ring-[#c8e4d2]"}`}>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute">{cartCopy.completion}</p>
                <p className={`mt-2 text-sm font-semibold ${needsConfirmation ? "text-warning" : "text-ok"}`}>
                  {needsConfirmation ? cartCopy.stockWarning : `${obslugaZamowien.terminRealizacjiDniRobocze} dni roboczych`}
                </p>
                {needsConfirmation && <p className="mt-1 text-xs leading-5 text-mute">{cartCopy.stockWarningHint} {obslugaZamowien.komunikatBraku}</p>}
              </div>

              <p className="mt-5 text-xs leading-5 text-mute">{cartCopy.editWindow}</p>
              <button type="button" onClick={() => setSubmitted(true)} className="pressable mt-6 min-h-12 w-full rounded-full bg-accent px-5 text-sm font-semibold text-white">{cartCopy.submit}</button>
              <Link href="/projekty/palmowa" className="pressable mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-paper px-5 text-center text-sm font-semibold text-ink ring-1 ring-hair">{cartCopy.continueProject}</Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
