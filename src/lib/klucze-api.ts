import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { dzienHurtowni } from "@/lib/czas";

/**
 * Klucze API dla aplikacji kontrahenta.
 *
 * Portal loguje człowieka podpisanym ciasteczkiem. Cudza aplikacja nie ma
 * przeglądarki ani sesji, więc dostaje klucz: długi sekret w nagłówku,
 * przypisany do jednej firmy i do wskazanego zakresu danych.
 *
 * Trzy rzeczy, które muszą tu być zrobione porządnie, bo poprawianie ich
 * później oznacza wymianę kluczy u wszystkich klientów:
 *
 * 1. Sekret nie leży u nas w postaci jawnej, tylko jako skrót. Wyciek naszej
 *    konfiguracji nie daje wtedy dostępu do cen kontrahentów.
 * 2. Klucz niesie własny, jawny identyfikator. Dzięki temu w logach widać,
 *    który klucz pytał, bez zapisywania sekretu.
 * 3. Porównanie jest stałoczasowe. Zwykłe `===` przerywa na pierwszej różnej
 *    literze, a z czasu odpowiedzi da się sekret odgadywać znak po znaku.
 */

/** Wyróżnik w tekście klucza, żeby dało się go rozpoznać w cudzym kodzie i logach. */
export const PREFIKS = "mussi";

export type Zakres = "cennik";

export type KluczApi = {
  /** Jawny identyfikator. Trafia do logów zamiast sekretu. */
  id: string;
  /** Kontrahent, którego dane widzi ten klucz. */
  kontrahent: string;
  /** Skrót sekretu, nigdy sam sekret. */
  skrot: string;
  zakresy: Zakres[];
  aktywny: boolean;
  /** Dzień w formacie ISO albo null, gdy klucz jest bezterminowy. */
  wazneDo?: string | null;
};

export function skrot(sekret: string): string {
  return createHash("sha256").update(sekret).digest("hex");
}

/**
 * Nowy klucz do wydania kontrahentowi.
 *
 * Zwraca komplet: tekst do przekazania klientowi i wpis do konfiguracji.
 * Sekret pokazujemy jeden raz, bo u nas zostaje wyłącznie skrót.
 */
export function utworzKlucz(kontrahent: string, zakresy: Zakres[] = ["cennik"]) {
  const id = randomBytes(4).toString("hex");
  const sekret = randomBytes(24).toString("base64url");
  return {
    doPrzekazania: `${PREFIKS}_${id}_${sekret}`,
    wpis: { id, kontrahent, skrot: skrot(sekret), zakresy, aktywny: true } satisfies KluczApi,
  };
}

/**
 * Kształt klucza: `mussi_<id>_<sekret>`.
 *
 * Sekret jest w base64url, a ten alfabet zawiera podkreślenie, więc nie da się
 * rozbić klucza zwykłym podziałem po `_`. Identyfikator jest szesnastkowy,
 * co pozwala odciąć dwa pierwsze człony i wziąć całą resztę jako sekret.
 */
const KSZTALT_KLUCZA = new RegExp(`^${PREFIKS}_([0-9a-f]+)_(.+)$`);

export function rozbijKlucz(surowy: string): { id: string; sekret: string } | null {
  const trafienie = KSZTALT_KLUCZA.exec(surowy.trim());
  if (!trafienie) return null;
  return { id: trafienie[1], sekret: trafienie[2] };
}

function rowneStaloczasowo(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  /* Różnicę długości odrzucamy osobno, bo porównanie stałoczasowe
     wymaga równych buforów. Sama długość skrótu nie jest sekretem. */
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export type PowodOdmowy =
  | "brak-naglowka"
  | "zly-format"
  | "nieznany-klucz"
  | "zly-sekret"
  | "wylaczony"
  | "wygasl"
  | "poza-zakresem";

export type WynikWeryfikacji =
  | { ok: true; klucz: KluczApi }
  | { ok: false; powod: PowodOdmowy };

/**
 * Sprawdza klucz z nagłówka.
 *
 * Odmowy nie różnicujemy w odpowiedzi HTTP: klient dostaje jedno 401
 * niezależnie od powodu, żeby nie dało się po komunikatach zgadywać,
 * które identyfikatory istnieją. Powód zostaje dla naszych logów.
 */
export function zweryfikujKlucz(
  naglowek: string | null | undefined,
  klucze: readonly KluczApi[],
  wymaganyZakres: Zakres,
  dzis: Date = new Date(),
): WynikWeryfikacji {
  if (!naglowek) return { ok: false, powod: "brak-naglowka" };

  const surowy = naglowek.replace(/^Bearer\s+/i, "").trim();
  const rozbity = rozbijKlucz(surowy);
  if (!rozbity) return { ok: false, powod: "zly-format" };

  const klucz = klucze.find((k) => k.id === rozbity.id);
  if (!klucz) return { ok: false, powod: "nieznany-klucz" };
  if (!rowneStaloczasowo(skrot(rozbity.sekret), klucz.skrot)) {
    return { ok: false, powod: "zly-sekret" };
  }
  if (!klucz.aktywny) return { ok: false, powod: "wylaczony" };
  if (klucz.wazneDo && dzienHurtowni(dzis) > klucz.wazneDo) {
    return { ok: false, powod: "wygasl" };
  }
  if (!klucz.zakresy.includes(wymaganyZakres)) {
    return { ok: false, powod: "poza-zakresem" };
  }

  return { ok: true, klucz };
}

/**
 * Klucze ze środowiska.
 *
 * Portal nie ma jeszcze bazy, więc konfiguracja siedzi w zmiennej
 * `KLUCZE_API` jako JSON. Kształt sprawdzamy przy każdym odczycie: wpis
 * bez skrótu albo bez kontrahenta jest błędem wdrożenia i lepiej, żeby
 * krzyknął, niż żeby po cichu wpuszczał lub blokował.
 */
export function wczytajKlucze(zrodlo: string | undefined = process.env.KLUCZE_API): KluczApi[] {
  if (!zrodlo?.trim()) return [];

  let dane: unknown;
  try {
    dane = JSON.parse(zrodlo);
  } catch {
    throw new Error("KLUCZE_API nie jest poprawnym JSON-em.");
  }
  if (!Array.isArray(dane)) throw new Error("KLUCZE_API musi być tablicą kluczy.");

  return dane.map((wpis, i) => {
    const k = wpis as Partial<KluczApi>;
    if (!k.id || !k.kontrahent || !k.skrot || !Array.isArray(k.zakresy)) {
      throw new Error(`KLUCZE_API: wpis numer ${i + 1} nie ma kompletu pól.`);
    }
    return {
      id: k.id,
      kontrahent: k.kontrahent,
      skrot: k.skrot,
      zakresy: k.zakresy as Zakres[],
      aktywny: k.aktywny !== false,
      wazneDo: k.wazneDo ?? null,
    };
  });
}
