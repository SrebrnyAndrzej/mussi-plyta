import { createHmac, timingSafeEqual } from "node:crypto";
import type { RolaSesji } from "@/lib/sesja";

/**
 * Sesja podpisana po stronie serwera.
 *
 * `src/lib/sesja.ts` trzyma sesję w przeglądarce i jest tylko zasłoną
 * na interfejsie: kto zna konsolę, ustawi sobie w niej cokolwiek.
 * Ten moduł jest właściwym zabezpieczeniem. Token podpisujemy sekretem,
 * którego przeglądarka nie zna, więc nie da się go podrobić ani przedłużyć.
 *
 * Specyfikacja w sekcji „Bezpieczeństwo” wymaga sprawdzania uprawnień
 * po stronie serwera przy każdej operacji. To jest ta strona.
 */

export const NAZWA_CIASTECZKA = "mussi_sesja";

export type SesjaSerwera = {
  rola: RolaSesji;
  /** Identyfikator kontrahenta. Null dla pracownika hurtowni. */
  kontrahent: string | null;
  /** Znacznik wygaśnięcia w sekundach epoki. */
  wygasa: number;
};

/** Domyślnie doba. Krócej niż typowa zmiana plus zapas. */
export const WAZNOSC_SEKUND = 24 * 60 * 60;

function sekret(): string {
  const s = process.env.SESJA_SEKRET;
  if (!s || s.length < 16) {
    /* Brak sekretu to błąd wdrożenia. Lepiej odmówić wszystkiego
       niż podpisywać przewidywalnym kluczem. */
    throw new Error("SESJA_SEKRET nie jest ustawiony albo jest za krótki.");
  }
  return s;
}

function podpisz(dane: string): string {
  return createHmac("sha256", sekret()).update(dane).digest("base64url");
}

function bezpieczneRowne(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  /* Porównanie stałoczasowe wymaga równych długości, więc różnicę
     długości odrzucamy osobno, zanim dojdzie do porównania. */
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function utworzToken(
  rola: RolaSesji,
  kontrahent: string | null,
  teraz: Date = new Date(),
): string {
  const tresc: SesjaSerwera = {
    rola,
    kontrahent,
    wygasa: Math.floor(teraz.getTime() / 1000) + WAZNOSC_SEKUND,
  };
  const ladunek = Buffer.from(JSON.stringify(tresc)).toString("base64url");
  return `${ladunek}.${podpisz(ladunek)}`;
}

export type WynikTokenu =
  | { ok: true; sesja: SesjaSerwera }
  | { ok: false; powod: "brak" | "ksztalt" | "podpis" | "wygasl" };

export function odczytajToken(token: string | undefined, teraz: Date = new Date()): WynikTokenu {
  if (!token) return { ok: false, powod: "brak" };

  const kropka = token.lastIndexOf(".");
  if (kropka <= 0) return { ok: false, powod: "ksztalt" };

  const ladunek = token.slice(0, kropka);
  const podpis = token.slice(kropka + 1);

  if (!bezpieczneRowne(podpis, podpisz(ladunek))) {
    return { ok: false, powod: "podpis" };
  }

  let sesja: SesjaSerwera;
  try {
    sesja = JSON.parse(Buffer.from(ladunek, "base64url").toString("utf8")) as SesjaSerwera;
  } catch {
    return { ok: false, powod: "ksztalt" };
  }

  if (sesja.rola !== "klient" && sesja.rola !== "hurtownia") {
    return { ok: false, powod: "ksztalt" };
  }
  if (typeof sesja.wygasa !== "number" || !Number.isFinite(sesja.wygasa)) {
    return { ok: false, powod: "ksztalt" };
  }
  if (sesja.wygasa * 1000 <= teraz.getTime()) {
    return { ok: false, powod: "wygasl" };
  }

  return { ok: true, sesja };
}

export type Odmowa = { status: 401 | 403; blad: string };

/**
 * Straż dla tras API.
 *
 * Zwraca sesję albo odmowę z rozróżnieniem: 401 znaczy „nie wiem, kim jesteś”,
 * a 403 „wiem, i nie wolno ci tutaj”. To rozróżnienie ma znaczenie dla klienta,
 * bo przy 401 warto się zalogować, a przy 403 nie ma sensu próbować dalej.
 */
export function wymagajSesji(
  token: string | undefined,
  wymaganaRola?: RolaSesji,
  teraz: Date = new Date(),
): { ok: true; sesja: SesjaSerwera } | { ok: false } & Odmowa {
  const wynik = odczytajToken(token, teraz);
  if (!wynik.ok) {
    const komunikat =
      wynik.powod === "wygasl"
        ? "Sesja wygasła. Zaloguj się ponownie."
        : "Brak ważnej sesji.";
    return { ok: false, status: 401, blad: komunikat };
  }
  if (wymaganaRola && wynik.sesja.rola !== wymaganaRola) {
    return { ok: false, status: 403, blad: "To konto nie ma dostępu do tej operacji." };
  }
  return { ok: true, sesja: wynik.sesja };
}

/** Ciasteczko jest HttpOnly, więc na serwerze czytamy je z nagłówka żądania. */
export function pobierzToken(request: Request): string | undefined {
  const naglowek = request.headers.get("cookie");
  if (!naglowek) return undefined;
  for (const kawalek of naglowek.split(";")) {
    const [nazwa, ...reszta] = kawalek.trim().split("=");
    if (nazwa === NAZWA_CIASTECZKA) return reszta.join("=");
  }
  return undefined;
}
