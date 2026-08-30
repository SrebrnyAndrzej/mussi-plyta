"use client";

import { useSyncExternalStore } from "react";
import { kontrahentDemo } from "@/config/brief";
import { podsumujKoszyk } from "@/lib/pricing";

export type CartIndicatorSummary = {
  lines: number;
  items: number;
  gross: number;
};

export const CART_LINES_STORAGE_KEY = "mussi-b2b:cart-lines:v1";
const CART_SUMMARY_STORAGE_KEY = "mussi-b2b:cart-summary:v1";
const CART_SUMMARY_EVENT = "mussi:cart-summary";

/**
 * Stan przed pierwszym zapisem i migawka serwerowa.
 *
 * Zera, a nie wartości przykładowe: wskaźnik nie może obiecywać pozycji,
 * których podgląd koszyka nie ma czym pokazać. Po wejściu na stronę koszyka
 * zapisuje się prawdziwy stan i obie liczby zaczynają się zgadzać.
 */
const defaultSummary: CartIndicatorSummary = { lines: 0, items: 0, gross: 0 };
let currentSummary = defaultSummary;

/**
 * Pozycje trzymane w jednej, stabilnej referencji.
 *
 * `useSyncExternalStore` porównuje migawki tożsamością, więc parsowanie JSON
 * przy każdym odczycie zapętliłoby render. Nowa tablica powstaje wyłącznie
 * wtedy, gdy naprawdę zmienił się zapis w przeglądarce.
 */
const pustePozycje: unknown[] = [];
let currentLines: unknown[] = pustePozycje;
let ostatniSurowyZapis: string | null = null;

const listeners = new Set<() => void>();

function poprawnePodsumowanie(value: unknown): value is CartIndicatorSummary {
  if (!value || typeof value !== "object") return false;
  const summary = value as Partial<CartIndicatorSummary>;
  return Number.isFinite(summary.lines) && Number.isFinite(summary.items) && Number.isFinite(summary.gross);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function readSummary() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(CART_SUMMARY_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (poprawnePodsumowanie(parsed)) currentSummary = parsed;
  } catch {
    currentSummary = defaultSummary;
  }
}

function readLines() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(CART_LINES_STORAGE_KEY);
    if (raw === ostatniSurowyZapis) return;
    ostatniSurowyZapis = raw;
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    currentLines = Array.isArray(parsed) ? parsed : pustePozycje;
  } catch {
    ostatniSurowyZapis = null;
    currentLines = pustePozycje;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  readSummary();
  readLines();
  queueMicrotask(() => listener());

  const onStorage = (event: StorageEvent) => {
    if (event.key !== CART_SUMMARY_STORAGE_KEY && event.key !== CART_LINES_STORAGE_KEY) return;
    readSummary();
    readLines();
    notify();
  };
  const onSummary = () => {
    readLines();
    listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CART_SUMMARY_EVENT, onSummary);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CART_SUMMARY_EVENT, onSummary);
  };
}

export function useCartIndicatorSummary() {
  return useSyncExternalStore(subscribe, () => currentSummary, () => defaultSummary);
}

/**
 * Pozycje koszyka na żywo, do podglądu bez wchodzenia na stronę koszyka.
 * Na serwerze zwraca pustą listę, bo koszyk mieszka w przeglądarce.
 */
export function useCartBrowserLines<T>(): T[] {
  return useSyncExternalStore(
    subscribe,
    () => currentLines as T[],
    () => pustePozycje as T[],
  );
}

export function saveCartBrowserState(lines: unknown[], summary: CartIndicatorSummary) {
  if (typeof window === "undefined") return;
  currentSummary = summary;
  currentLines = lines;
  ostatniSurowyZapis = JSON.stringify(lines);
  window.localStorage.setItem(CART_LINES_STORAGE_KEY, ostatniSurowyZapis);
  window.localStorage.setItem(CART_SUMMARY_STORAGE_KEY, JSON.stringify(summary));
  window.dispatchEvent(new Event(CART_SUMMARY_EVENT));
  notify();
}

export function readCartBrowserLines<T>(): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_LINES_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed as T[] : null;
  } catch {
    return null;
  }
}


/** Minimum, którego potrzeba, żeby przeliczyć koszyk po zmianie ilości. */
type PozycjaDoPrzeliczenia = {
  id: string;
  nazwa: string;
  ilosc: number;
  jednostka: string;
  cenaKatalogowa: number;
};

const MAKS_ILOSC = 999;

function zapiszPozycje(pozycje: PozycjaDoPrzeliczenia[]) {
  const podsumowanie = podsumujKoszyk(
    pozycje.map((p) => ({
      nazwa: p.nazwa,
      ilosc: p.ilosc,
      jednostka: p.jednostka,
      cenaKatalogowa: p.cenaKatalogowa,
    })),
    kontrahentDemo.kodProgu,
  );
  saveCartBrowserState(pozycje, {
    lines: pozycje.length,
    items: pozycje.reduce((suma, p) => suma + p.ilosc, 0),
    gross: podsumowanie.brutto,
  });
}

/**
 * Zmiana ilości pozycji.
 *
 * Zapis idzie przez ten sam magazyn, z którego czyta strona koszyka,
 * więc obie powierzchnie pokazują ten sam stan. Ilość trzyma się w granicach
 * od jednego do `MAKS_ILOSC`; zejście do zera to usunięcie, nie ujemny stan.
 */
export function zmienIloscPozycji(id: string, zmiana: number) {
  const pozycje = (readCartBrowserLines<PozycjaDoPrzeliczenia>() ?? []).map((p) =>
    p.id === id ? { ...p, ilosc: Math.max(1, Math.min(MAKS_ILOSC, p.ilosc + zmiana)) } : p,
  );
  zapiszPozycje(pozycje);
}

export function usunPozycje(id: string) {
  zapiszPozycje((readCartBrowserLines<PozycjaDoPrzeliczenia>() ?? []).filter((p) => p.id !== id));
}
