import { readFileSync } from "node:fs";

/**
 * Konfiguracja integratora.
 *
 * Wszystko, co zależy od schematu bazy hurtowni, siedzi tutaj i wchodzi
 * z pliku, nie z kodu. Dzięki temu w dniu, w którym dostaniemy dostęp
 * do serwera, uzupełniamy nazwy tabel i kolumn, a nie przepisujemy agenta.
 *
 * Zapytanie jest podawane wprost, bo każda instalacja Streamsofta bywa
 * inaczej skonfigurowana. Warunek: musi zwracać kolumny o nazwach
 * zadeklarowanych w `kolumny`, i **musi być wyłącznie odczytem**.
 */

export type Kolumny = {
  sku: string;
  stan: string;
  rezerwacje: string;
};

export type Konfiguracja = {
  zrodlo: {
    /** `firebird` w hurtowni, `plik` do prób bez dostępu do serwera. */
    rodzaj: "firebird" | "plik";
    host?: string;
    port?: number;
    /** Ścieżka do pliku bazy na serwerze hurtowni. */
    baza?: string;
    uzytkownik?: string;
    haslo?: string;
    /** Dla rodzaju `plik`: skąd wziąć przykładowe dane. */
    sciezka?: string;
  };
  /** Zapytanie odczytujące stany. Tylko SELECT. */
  zapytanie: string;
  kolumny: Kolumny;
  cel: {
    /** Pełny adres punktu odbioru, na przykład https://mussi-plyta.vercel.app/api/stany */
    url: string;
    token: string;
  };
  /** Co ile minut synchronizować. */
  coMinut: number;
};

const WYMAGANE_POLA: Array<keyof Kolumny> = ["sku", "stan", "rezerwacje"];

/** Zapytanie musi być odczytem. Agent nigdy nie pisze do bazy hurtowni. */
export function czyTylkoOdczyt(zapytanie: string): boolean {
  const bezKomentarzy = zapytanie
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
  const znormalizowane = bezKomentarzy.trim().toLowerCase();
  if (!znormalizowane.startsWith("select")) return false;
  return !/\b(insert|update|delete|drop|alter|create|truncate|execute|merge)\b/.test(znormalizowane);
}

export function sprawdzKonfiguracje(k: Konfiguracja): string[] {
  const bledy: string[] = [];

  if (!k.zapytanie?.trim()) bledy.push("Brak zapytania odczytującego stany.");
  else if (!czyTylkoOdczyt(k.zapytanie)) {
    bledy.push("Zapytanie musi być samym SELECT-em. Agent nie zapisuje do bazy hurtowni.");
  }

  for (const pole of WYMAGANE_POLA) {
    if (!k.kolumny?.[pole]?.trim()) bledy.push(`Brak nazwy kolumny dla pola ${pole}.`);
  }

  if (!k.cel?.url?.startsWith("https://")) {
    bledy.push("Adres celu musi być pełnym adresem https.");
  }
  if (!k.cel?.token?.trim()) bledy.push("Brak tokenu integratora.");

  if (k.zrodlo?.rodzaj === "firebird") {
    for (const pole of ["host", "baza", "uzytkownik", "haslo"] as const) {
      if (!k.zrodlo[pole]) bledy.push(`Brak parametru połączenia: ${pole}.`);
    }
  }
  if (k.zrodlo?.rodzaj === "plik" && !k.zrodlo.sciezka) {
    bledy.push("Dla źródła plikowego trzeba podać ścieżkę.");
  }

  if (!Number.isFinite(k.coMinut) || k.coMinut < 1) {
    bledy.push("Częstotliwość musi być liczbą minut nie mniejszą niż 1.");
  }

  return bledy;
}

export function wczytajKonfiguracje(sciezka: string): Konfiguracja {
  const surowa = JSON.parse(readFileSync(sciezka, "utf8")) as Konfiguracja;

  /* Sekrety wolno podać przez środowisko, żeby nie leżały w pliku na serwerze. */
  if (process.env.SF_HASLO) surowa.zrodlo.haslo = process.env.SF_HASLO;
  if (process.env.INTEGRATOR_TOKEN) surowa.cel.token = process.env.INTEGRATOR_TOKEN;

  const bledy = sprawdzKonfiguracje(surowa);
  if (bledy.length > 0) {
    throw new Error(`Konfiguracja jest niepoprawna:\n  ${bledy.join("\n  ")}`);
  }
  return surowa;
}
