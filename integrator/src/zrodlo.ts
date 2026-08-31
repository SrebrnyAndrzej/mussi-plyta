import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { Konfiguracja, Kolumny } from "./konfiguracja.ts";

/**
 * Odczyt stanów ze źródła.
 *
 * Dwa warianty. `firebird` to docelowa baza Streamsoft Pro w sieci hurtowni.
 * `plik` służy do prób bez dostępu do ich serwera, żeby całą resztę agenta
 * dało się napisać i przetestować, zanim dostaniemy połączenie.
 */

export type PozycjaStanu = { sku: string; stan: number; rezerwacje: number };

export type Paczka = {
  zrodlo: string;
  wygenerowano: string;
  partia: string;
  pozycje: PozycjaStanu[];
};

/**
 * Nazwy kolumn u klienta bywają w innej wielkości liter niż w zapytaniu,
 * bo Firebird zwraca je wielkimi literami, o ile nie były w cudzysłowach.
 */
function wartosc(wiersz: Record<string, unknown>, kolumna: string): unknown {
  if (kolumna in wiersz) return wiersz[kolumna];
  const klucz = Object.keys(wiersz).find((k) => k.toLowerCase() === kolumna.toLowerCase());
  return klucz ? wiersz[klucz] : undefined;
}

function naLiczbe(surowa: unknown): number | null {
  if (typeof surowa === "number") return Number.isFinite(surowa) ? surowa : null;
  if (typeof surowa === "string") {
    /* Firebird potrafi oddać liczbę jako tekst, czasem z przecinkiem. */
    const n = Number(surowa.replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export type WynikOdczytu = {
  pozycje: PozycjaStanu[];
  /** Wiersze, których nie dało się przetłumaczyć. Zgłaszane, nie pomijane po cichu. */
  pominiete: Array<{ powod: string; wiersz: unknown }>;
};

export function przetlumaczWiersze(
  wiersze: Array<Record<string, unknown>>,
  kolumny: Kolumny,
): WynikOdczytu {
  const pozycje: PozycjaStanu[] = [];
  const pominiete: WynikOdczytu["pominiete"] = [];

  for (const wiersz of wiersze) {
    const sku = wartosc(wiersz, kolumny.sku);
    if (typeof sku !== "string" || sku.trim() === "") {
      pominiete.push({ powod: `Kolumna ${kolumny.sku} pusta albo nie jest tekstem.`, wiersz });
      continue;
    }
    const stan = naLiczbe(wartosc(wiersz, kolumny.stan));
    const rezerwacje = naLiczbe(wartosc(wiersz, kolumny.rezerwacje));
    if (stan === null || rezerwacje === null) {
      pominiete.push({ powod: "Stan albo rezerwacje nie są liczbą.", wiersz });
      continue;
    }
    pozycje.push({ sku: sku.trim(), stan, rezerwacje });
  }

  return { pozycje, pominiete };
}

/**
 * Identyfikator partii liczony z treści.
 *
 * Dzięki temu powtórzone uruchomienie na niezmienionych danych daje tę samą
 * partię, a portal ją odrzuci jako już przyjętą. To jest nasza idempotencja.
 */
export function policzPartie(pozycje: PozycjaStanu[]): string {
  const tresc = pozycje
    .map((p) => `${p.sku}:${p.stan}:${p.rezerwacje}`)
    .sort()
    .join("|");
  return createHash("sha256").update(tresc).digest("hex").slice(0, 32);
}

async function czytajZFirebirda(k: Konfiguracja): Promise<Array<Record<string, unknown>>> {
  /* Import dopiero tutaj, żeby próby na źródle plikowym działały bez
     zainstalowanego sterownika i bez serwera bazy. */
  const { default: Firebird } = await import("node-firebird");

  const opcje = {
    host: k.zrodlo.host,
    port: k.zrodlo.port ?? 3050,
    database: k.zrodlo.baza,
    user: k.zrodlo.uzytkownik,
    password: k.zrodlo.haslo,
    lowercase_keys: false,
  };

  return new Promise((rozwiaz, odrzuc) => {
    Firebird.attach(opcje, (blad: Error | null, baza: any) => {
      if (blad) return odrzuc(new Error(`Nie mogę połączyć się z bazą: ${blad.message}`));
      baza.query(k.zapytanie, [], (bladZapytania: Error | null, wynik: Array<Record<string, unknown>>) => {
        baza.detach();
        if (bladZapytania) return odrzuc(new Error(`Zapytanie nie powiodło się: ${bladZapytania.message}`));
        rozwiaz(wynik ?? []);
      });
    });
  });
}

function czytajZPliku(sciezka: string): Array<Record<string, unknown>> {
  const dane = JSON.parse(readFileSync(sciezka, "utf8")) as unknown;
  if (!Array.isArray(dane)) {
    throw new Error("Plik źródłowy musi zawierać tablicę wierszy.");
  }
  return dane as Array<Record<string, unknown>>;
}

export async function pobierzPaczke(k: Konfiguracja): Promise<{ paczka: Paczka; pominiete: WynikOdczytu["pominiete"] }> {
  const wiersze =
    k.zrodlo.rodzaj === "firebird"
      ? await czytajZFirebirda(k)
      : czytajZPliku(k.zrodlo.sciezka!);

  const { pozycje, pominiete } = przetlumaczWiersze(wiersze, k.kolumny);

  return {
    paczka: {
      zrodlo: k.zrodlo.rodzaj === "firebird" ? "streamsoft-pro" : "plik-probny",
      wygenerowano: new Date().toISOString(),
      partia: policzPartie(pozycje),
      pozycje,
    },
    pominiete,
  };
}
