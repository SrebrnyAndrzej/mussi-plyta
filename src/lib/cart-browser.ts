"use client";

import { useSyncExternalStore } from "react";

export type CartIndicatorSummary = {
  lines: number;
  items: number;
  gross: number;
};

export const CART_LINES_STORAGE_KEY = "mussi-b2b:cart-lines:v1";
const CART_SUMMARY_STORAGE_KEY = "mussi-b2b:cart-summary:v1";
const CART_SUMMARY_EVENT = "mussi:cart-summary";

const defaultSummary: CartIndicatorSummary = { lines: 5, items: 124, gross: 2936.53 };
let currentSummary = defaultSummary;
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

function subscribe(listener: () => void) {
  listeners.add(listener);
  readSummary();
  queueMicrotask(() => listener());

  const onStorage = (event: StorageEvent) => {
    if (event.key !== CART_SUMMARY_STORAGE_KEY) return;
    readSummary();
    notify();
  };
  const onSummary = () => listener();
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

export function saveCartBrowserState(lines: unknown[], summary: CartIndicatorSummary) {
  if (typeof window === "undefined") return;
  currentSummary = summary;
  window.localStorage.setItem(CART_LINES_STORAGE_KEY, JSON.stringify(lines));
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
