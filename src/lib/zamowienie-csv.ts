/**
 * Zamówienie w pliku CSV.
 *
 * Format wymiany między aplikacją kontrahenta a portalem. Ten sam zestaw
 * reguł powstanie drugi raz w aplikacji Swift, więc wszystko, co decyduje
 * o przyjęciu albo odrzuceniu pliku, jest tutaj opisane wprost i pokryte
 * wektorami testowymi w `docs/wektory/zamowienie-csv.json`. Obie
 * implementacje mają przechodzić te same przypadki.
 *
 * Podział na dwa kroki jest celowy:
 *
 * 1. `parsujCsvZamowienia` czyta sam tekst i nie wie nic o asortymencie.
 * 2. `zweryfikujWobecKatalogu` sprawdza indeksy i jednostki.
 *
 * Aplikacja kontrahenta ma katalog z `/api/v1/cennik`, więc może zrobić
 * oba kroki lokalnie i pokazać błędy bez wysyłania czegokolwiek.
 * Serwer i tak powtarza całość, bo dane klienta bywają nieaktualne.
 */

/** Kody błędów są stałe i przeznaczone do porównywania w kodzie, nie do czytania. */
export type KodBledu =
  | "pusty-plik"
  | "brak-naglowka"
  | "brak-kolumny-indeks"
  | "brak-kolumny-ilosc"
  | "za-duzo-wierszy"
  | "pusty-indeks"
  | "ilosc-niepoprawna"
  | "ilosc-niedodatnia"
  | "nieznany-indeks"
  | "jednostka-niezgodna";

export type BladCsv = {
  /** Numer wiersza w pliku, licząc od 1 wraz z nagłówkiem. Null dla błędów całego pliku. */
  wiersz: number | null;
  kod: KodBledu;
  komunikat: string;
  indeks?: string;
};

export type PozycjaCsv = {
  wiersz: number;
  indeks: string;
  ilosc: number;
  jednostka?: string;
  uwagi?: string;
};

export type WynikCsv = {
  ok: boolean;
  pozycje: PozycjaCsv[];
  bledy: BladCsv[];
  /** Indeksy, które wystąpiły w kilku wierszach i zostały zsumowane. */
  scalone: Array<{ indeks: string; wiersze: number[]; ilosc: number }>;
};

/** Powyżej tego pliku nie przyjmujemy. Zamówienie z tysiąca pozycji to już pomyłka. */
export const MAKS_WIERSZY = 1000;

/* Nagłówki dopuszczamy w kilku wariantach, bo aplikacje piszą je różnie.
   Porównanie idzie po nazwie uproszczonej: bez ogonków, spacji i wielkości liter. */
const NAZWY_INDEKSU = ["indeks", "sku", "symbol", "kod", "index"];
const NAZWY_ILOSCI = ["ilosc", "liczba", "sztuk", "qty", "quantity"];
const NAZWY_JEDNOSTKI = ["jednostka", "jm", "unit"];
const NAZWY_UWAG = ["uwagi", "uwaga", "opis", "notes"];

export function uprosc(tekst: string): string {
  return tekst
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[łŁ]/g, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Podział pliku na wiersze i pola.
 *
 * Separator wykrywamy z pierwszego niepustego wiersza, bo aplikacje
 * eksportują średnikami, przecinkami albo tabulatorami, zależnie od tego,
 * co uznał za dobre arkusz kalkulacyjny użytkownika. Cudzysłowy według
 * RFC 4180: podwojony cudzysłów w środku pola znaczy jeden znak.
 */
export function podzielCsv(tekst: string): string[][] {
  /* Znacznik BOM na początku pliku zostaje po eksporcie z Excela
     i bez usunięcia skleiłby się z pierwszym nagłówkiem. */
  const czysty = tekst.replace(/^﻿/, "");
  const probka = czysty.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const kandydaci = [";", "\t", ","] as const;
  const separator = kandydaci.reduce((najlepszy, kandydat) =>
    probka.split(kandydat).length > probka.split(najlepszy).length ? kandydat : najlepszy,
  );

  const wiersze: string[][] = [];
  let wiersz: string[] = [];
  let pole = "";
  let wCudzyslowie = false;

  const zamknijPole = () => {
    wiersz.push(pole);
    pole = "";
  };
  const zamknijWiersz = () => {
    zamknijPole();
    wiersze.push(wiersz);
    wiersz = [];
  };

  for (let i = 0; i < czysty.length; i += 1) {
    const znak = czysty[i];
    const nastepny = czysty[i + 1];

    if (znak === '"' && wCudzyslowie && nastepny === '"') {
      pole += '"';
      i += 1;
    } else if (znak === '"') {
      wCudzyslowie = !wCudzyslowie;
    } else if (znak === separator && !wCudzyslowie) {
      zamknijPole();
    } else if ((znak === "\n" || znak === "\r") && !wCudzyslowie) {
      if (znak === "\r" && nastepny === "\n") i += 1;
      zamknijWiersz();
    } else {
      pole += znak;
    }
  }
  if (pole !== "" || wiersz.length) zamknijWiersz();

  return wiersze;
}

/**
 * Liczba z pliku.
 *
 * Przecinek jest znakiem dziesiętnym, spacje bywają separatorem tysięcy.
 * Zwracamy null zamiast zera przy tekście, którego nie rozumiemy: zero
 * wyglądałoby jak poprawna wartość i po cichu wypaczyło zamówienie.
 */
export function liczbaZ(tekst: string): number | null {
  const czysty = tekst.trim().replace(/\s/g, "").replace(",", ".");
  if (!czysty) return null;
  if (!/^-?\d+(\.\d+)?$/.test(czysty)) return null;
  const liczba = Number(czysty);
  return Number.isFinite(liczba) ? liczba : null;
}

function znajdzKolumne(naglowki: string[], nazwy: readonly string[]): number {
  return naglowki.findIndex((n) => nazwy.includes(uprosc(n)));
}

export function parsujCsvZamowienia(tekst: string): WynikCsv {
  const pusty: WynikCsv = { ok: false, pozycje: [], bledy: [], scalone: [] };

  const wiersze = podzielCsv(tekst).filter((w) => w.some((p) => p.trim() !== ""));
  if (wiersze.length === 0) {
    return {
      ...pusty,
      bledy: [{ wiersz: null, kod: "pusty-plik", komunikat: "Plik jest pusty." }],
    };
  }

  const naglowki = wiersze[0];
  const kolIndeks = znajdzKolumne(naglowki, NAZWY_INDEKSU);
  const kolIlosc = znajdzKolumne(naglowki, NAZWY_ILOSCI);
  const kolJednostka = znajdzKolumne(naglowki, NAZWY_JEDNOSTKI);
  const kolUwagi = znajdzKolumne(naglowki, NAZWY_UWAG);

  const bledy: BladCsv[] = [];
  if (kolIndeks === -1) {
    bledy.push({
      wiersz: 1,
      kod: "brak-kolumny-indeks",
      komunikat: "Nagłówek nie ma kolumny z indeksem.",
    });
  }
  if (kolIlosc === -1) {
    bledy.push({
      wiersz: 1,
      kod: "brak-kolumny-ilosc",
      komunikat: "Nagłówek nie ma kolumny z ilością.",
    });
  }
  if (bledy.length) return { ...pusty, bledy };

  const dane = wiersze.slice(1);
  if (dane.length === 0) {
    return {
      ...pusty,
      bledy: [{ wiersz: null, kod: "brak-naglowka", komunikat: "Plik ma tylko nagłówek." }],
    };
  }
  if (dane.length > MAKS_WIERSZY) {
    return {
      ...pusty,
      bledy: [
        {
          wiersz: null,
          kod: "za-duzo-wierszy",
          komunikat: `Plik ma ${dane.length} wierszy, a przyjmujemy najwyżej ${MAKS_WIERSZY}.`,
        },
      ],
    };
  }

  const pozycje: PozycjaCsv[] = [];

  dane.forEach((wiersz, i) => {
    /* Numer wiersza liczymy tak, jak widzi go człowiek w arkuszu:
       od jedynki, wliczając nagłówek. */
    const numer = i + 2;
    const indeks = (wiersz[kolIndeks] ?? "").trim();
    const surowaIlosc = (wiersz[kolIlosc] ?? "").trim();

    if (!indeks) {
      bledy.push({ wiersz: numer, kod: "pusty-indeks", komunikat: "Wiersz nie ma indeksu." });
      return;
    }

    const ilosc = liczbaZ(surowaIlosc);
    if (ilosc === null) {
      bledy.push({
        wiersz: numer,
        indeks,
        kod: "ilosc-niepoprawna",
        komunikat: `Ilość „${surowaIlosc}” nie jest liczbą.`,
      });
      return;
    }
    if (ilosc <= 0) {
      bledy.push({
        wiersz: numer,
        indeks,
        kod: "ilosc-niedodatnia",
        komunikat: "Ilość musi być większa od zera.",
      });
      return;
    }

    const jednostka = kolJednostka === -1 ? undefined : (wiersz[kolJednostka] ?? "").trim();
    const uwagi = kolUwagi === -1 ? undefined : (wiersz[kolUwagi] ?? "").trim();

    pozycje.push({
      wiersz: numer,
      indeks,
      ilosc,
      ...(jednostka ? { jednostka } : {}),
      ...(uwagi ? { uwagi } : {}),
    });
  });

  /* Ten sam indeks w kilku wierszach sumujemy, ale mówimy o tym wprost.
     Odrzucenie byłoby dokuczliwe, a ciche zsumowanie ukrywałoby błąd
     w aplikacji, która wygenerowała plik. */
  const wgIndeksu = new Map<string, PozycjaCsv[]>();
  for (const p of pozycje) {
    const lista = wgIndeksu.get(p.indeks) ?? [];
    lista.push(p);
    wgIndeksu.set(p.indeks, lista);
  }

  const scalone: WynikCsv["scalone"] = [];
  const wynikowe: PozycjaCsv[] = [];
  for (const [indeks, lista] of wgIndeksu) {
    if (lista.length === 1) {
      wynikowe.push(lista[0]);
      continue;
    }
    const ilosc = lista.reduce((suma, p) => suma + p.ilosc, 0);
    scalone.push({ indeks, wiersze: lista.map((p) => p.wiersz), ilosc });
    wynikowe.push({ ...lista[0], ilosc });
  }

  return { ok: bledy.length === 0, pozycje: wynikowe, bledy, scalone };
}

export type PozycjaKatalogu = { indeks: string; jednostka: string };

/**
 * Sprawdzenie wobec asortymentu.
 *
 * Nieznany indeks i niezgodna jednostka to błędy wiersza, nie ostrzeżenia.
 * Zamówienie pięciu kompletów tam, gdzie sprzedajemy na sztuki, jest błędem
 * aplikacji, a nie życzeniem klienta.
 */
export function zweryfikujWobecKatalogu(
  pozycje: readonly PozycjaCsv[],
  katalog: readonly PozycjaKatalogu[],
): BladCsv[] {
  const wgIndeksu = new Map(katalog.map((p) => [p.indeks, p]));
  const bledy: BladCsv[] = [];

  for (const p of pozycje) {
    const znaleziona = wgIndeksu.get(p.indeks);
    if (!znaleziona) {
      bledy.push({
        wiersz: p.wiersz,
        indeks: p.indeks,
        kod: "nieznany-indeks",
        komunikat: `Indeksu ${p.indeks} nie ma w asortymencie.`,
      });
      continue;
    }
    if (p.jednostka && uprosc(p.jednostka) !== uprosc(znaleziona.jednostka)) {
      bledy.push({
        wiersz: p.wiersz,
        indeks: p.indeks,
        kod: "jednostka-niezgodna",
        komunikat: `Indeks ${p.indeks} sprzedajemy w jednostce ${znaleziona.jednostka}, a plik podaje ${p.jednostka}.`,
      });
    }
  }

  return bledy;
}

const DO_CYTOWANIA = /[";\r\n]/;

/**
 * Zapis zamówienia do CSV.
 *
 * Wzorzec dla aplikacji kontrahenta: plik wygenerowany tą funkcją musi
 * przejść przez `parsujCsvZamowienia` bez błędu. Separatorem jest średnik,
 * bo tego oczekuje polski Excel, a przecinek zderzałby się z ułamkami.
 */
export function zapiszCsvZamowienia(
  pozycje: ReadonlyArray<{ indeks: string; ilosc: number; jednostka?: string; uwagi?: string }>,
): string {
  const cytuj = (wartosc: string) =>
    DO_CYTOWANIA.test(wartosc) ? `"${wartosc.replace(/"/g, '""')}"` : wartosc;

  const naglowek = ["indeks", "ilosc", "jednostka", "uwagi"];
  const wiersze = pozycje.map((p) =>
    [
      cytuj(p.indeks),
      /* Kropka dziesiętna, nie przecinek: przecinek bywa separatorem pól
         i plik przestałby się czytać poza polskim ustawieniem regionalnym. */
      String(p.ilosc),
      cytuj(p.jednostka ?? ""),
      cytuj(p.uwagi ?? ""),
    ].join(";"),
  );

  return [naglowek.join(";"), ...wiersze].join("\r\n") + "\r\n";
}
