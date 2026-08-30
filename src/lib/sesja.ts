"use client";

import { useSyncExternalStore } from "react";

/**
 * Sesja demonstracyjna.
 *
 * Do czasu podpięcia bazy nie ma prawdziwego logowania, więc sesja mieszka
 * w przeglądarce, tak samo jak koszyk. Nie chroni niczego przed kimś, kto zna
 * konsolę, i nie ma takiego zadania: odpowiada wyłącznie na pytanie, co pokazać
 * na ekranie. Prawdziwe uprawnienia sprawdza się po stronie serwera i to jest
 * zadanie na etap z Supabase.
 */

export type RolaSesji = "klient" | "hurtownia";

export type Sesja = {
  zalogowany: boolean;
  rola: RolaSesji | null;
  nazwa: string | null;
};

const KLUCZ = "mussi-b2b:sesja:v1";
const ZDARZENIE = "mussi:sesja";

/**
 * Domyślnie wylogowany, także jako migawka serwerowa.
 *
 * Kierunek jest celowy: po stronie serwera ceny nie trafiają do HTML,
 * a dopiero po hydratacji pojawiają się zalogowanemu. Odwrotnie byłoby gorzej,
 * bo ceny mignęłyby każdemu przed sprawdzeniem sesji.
 */
const wylogowana: Sesja = { zalogowany: false, rola: null, nazwa: null };

let aktualna: Sesja = wylogowana;
const listeners = new Set<() => void>();

function poprawna(value: unknown): value is Sesja {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<Sesja>;
  return typeof s.zalogowany === "boolean" && (s.rola === "klient" || s.rola === "hurtownia" || s.rola === null);
}

function odczytaj() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KLUCZ);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    aktualna = poprawna(parsed) ? parsed : wylogowana;
  } catch {
    aktualna = wylogowana;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  odczytaj();
  queueMicrotask(() => listener());

  const naZapis = (event: StorageEvent) => {
    if (event.key !== KLUCZ) return;
    odczytaj();
    listeners.forEach((l) => l());
  };
  /* Odczyt przed powiadomieniem: zapis mógł przyjść spoza `zaloguj`,
     na przykład z innej karty albo z narzędzi przeglądarki. */
  const naZdarzenie = () => {
    odczytaj();
    listener();
  };
  window.addEventListener("storage", naZapis);
  window.addEventListener(ZDARZENIE, naZdarzenie);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", naZapis);
    window.removeEventListener(ZDARZENIE, naZdarzenie);
  };
}

export function useSesja(): Sesja {
  return useSyncExternalStore(subscribe, () => aktualna, () => wylogowana);
}

/** Czy pokazywać ceny. Widzi je wyłącznie zalogowany kontrahent. */
export function useCzyWidacCeny(): boolean {
  const sesja = useSesja();
  return sesja.zalogowany;
}

export function zaloguj(rola: RolaSesji, nazwa: string) {
  if (typeof window === "undefined") return;
  aktualna = { zalogowany: true, rola, nazwa };
  window.localStorage.setItem(KLUCZ, JSON.stringify(aktualna));
  window.dispatchEvent(new Event(ZDARZENIE));
  listeners.forEach((l) => l());
}

export function wyloguj() {
  if (typeof window === "undefined") return;
  aktualna = wylogowana;
  window.localStorage.removeItem(KLUCZ);
  window.dispatchEvent(new Event(ZDARZENIE));
  listeners.forEach((l) => l());
}
