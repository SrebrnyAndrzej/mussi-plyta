import type { Akcesorium, KategoriaAkcesorium } from "@/data/akcesoria";
import type { Dostepnosc } from "@/data/dekory";
import { dostepne } from "@/lib/magazyn";

/**
 * Sklep akcesoriów.
 *
 * Katalog płyt sprzedaje dekor, który klient dobiera wzrokiem i przelicza
 * na metry. Akcesorium kupuje się inaczej: po indeksie, po producencie,
 * w sztukach i kompletach. Dlatego sklep ma własną warstwę wyszukiwania
 * zamiast doklejać się do filtrów katalogu.
 *
 * Ten moduł nie wie nic o Reakcie. Wszystko, co decyduje o tym, czy klient
 * zobaczy pozycję i w jakiej kolejności, siedzi tutaj i jest testowane.
 */

/**
 * Poniżej jakiej części stanu minimalnego mówimy „ostatnie sztuki”.
 *
 * Stan minimalny to próg zamówienia u dostawcy, a nie granica sprzedaży:
 * 460 metrów obrzeża przy minimum 400 to nadal pełna dostępność. Alarmujemy
 * dopiero, gdy zapas schodzi wyraźnie poniżej progu. Ułamek zamiast liczby
 * sztuk, bo asortyment idzie w sztukach, metrach i metrach kwadratowych,
 * a jedna wspólna liczba nie miałaby sensu dla wszystkich jednostek.
 */
export const PROG_OSTATNICH_SZTUK = 0.25;

/** Dostępność liczona ze stanu wolnego, czyli po odjęciu rezerwacji. */
export function dostepnoscAkcesorium(a: Akcesorium): Dostepnosc {
  const wolne = dostepne(a);
  if (wolne <= 0) return "na-zamowienie";
  if (a.stanMinimalny > 0 && wolne < a.stanMinimalny * PROG_OSTATNICH_SZTUK) {
    return "ostatnie-sztuki";
  }
  return "na-stanie";
}

/**
 * Porównanie odporne na ogonki i wielkość liter.
 *
 * Stolarz wpisuje „hafele” szukając Häfele i „zlaczki” szukając złączek.
 * Bez tego sklep odpowiadałby pustką na poprawne zapytanie.
 */
export function uprosc(tekst: string): string {
  return tekst
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase();
}

export type FiltrSklepu = {
  fraza?: string;
  kategoria?: KategoriaAkcesorium | null;
  producent?: string | null;
  /** Ukrywa pozycje, których nie ma na stanie. */
  tylkoDostepne?: boolean;
};

export function filtrujAkcesoria(lista: Akcesorium[], filtr: FiltrSklepu = {}): Akcesorium[] {
  const fraza = uprosc(filtr.fraza?.trim() ?? "");
  /* Fraza rozbita na słowa, żeby „blum 500” znalazło prowadnicę,
     której nazwa ma te słowa w odwrotnej kolejności. */
  const slowa = fraza ? fraza.split(/\s+/) : [];

  return lista.filter((a) => {
    if (filtr.kategoria && a.kategoria !== filtr.kategoria) return false;
    if (filtr.producent && a.producent !== filtr.producent) return false;
    if (filtr.tylkoDostepne && dostepnoscAkcesorium(a) === "na-zamowienie") return false;
    if (!slowa.length) return true;

    const stog = uprosc([a.sku, a.nazwa, a.producent].join(" "));
    return slowa.every((slowo) => stog.includes(slowo));
  });
}

export type Sortowanie = "nazwa" | "cena-rosnaco" | "cena-malejaco" | "dostepnosc";

const KOLEJNOSC_DOSTEPNOSCI: Record<Dostepnosc, number> = {
  "na-stanie": 0,
  "ostatnie-sztuki": 1,
  "na-zamowienie": 2,
};

export function sortujAkcesoria(lista: Akcesorium[], sposob: Sortowanie): Akcesorium[] {
  const kopia = [...lista];
  switch (sposob) {
    case "cena-rosnaco":
      return kopia.sort((a, b) => a.cena - b.cena);
    case "cena-malejaco":
      return kopia.sort((a, b) => b.cena - a.cena);
    case "dostepnosc":
      /* Przy równej dostępności alfabetycznie, żeby kolejność była
         powtarzalna, a nie zależna od kolejności w pliku. */
      return kopia.sort(
        (a, b) =>
          KOLEJNOSC_DOSTEPNOSCI[dostepnoscAkcesorium(a)] -
            KOLEJNOSC_DOSTEPNOSCI[dostepnoscAkcesorium(b)] ||
          a.nazwa.localeCompare(b.nazwa, "pl"),
      );
    default:
      return kopia.sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));
  }
}

/** Producenci obecni w asortymencie, alfabetycznie po polsku. */
export function producenci(lista: Akcesorium[]): string[] {
  return [...new Set(lista.map((a) => a.producent))].sort((a, b) => a.localeCompare(b, "pl"));
}

/** Liczba pozycji w każdej kategorii, do kafelków na wejściu do sklepu. */
export function policzWKategoriach(lista: Akcesorium[]): Record<string, number> {
  const licznik: Record<string, number> = {};
  for (const a of lista) licznik[a.kategoria] = (licznik[a.kategoria] ?? 0) + 1;
  return licznik;
}

/**
 * Kształt, którego oczekuje koszyk.
 *
 * Koszyk powstał dla płyty i opisuje pozycję polami dekoru. Zamiast przerabiać
 * go pod akcesoria, tłumaczymy akcesorium na jego język w jednym miejscu.
 * Indeksem jest SKU, więc `/koszyk?dodaj=BLU-CLIP-110` trafia w tę samą
 * pozycję, którą klient widział w sklepie.
 */
export type ProduktKoszyka = {
  id: string;
  kod: string;
  nazwa: string;
  producent: string;
  kategoria: "akcesorium";
  cenaKatalogowa: number;
  dostepnosc: Dostepnosc;
  jednostka: string;
};

export function jakoProduktKoszyka(a: Akcesorium): ProduktKoszyka {
  return {
    id: a.sku,
    kod: a.sku,
    nazwa: a.nazwa,
    producent: a.producent,
    kategoria: "akcesorium",
    cenaKatalogowa: a.cena,
    dostepnosc: dostepnoscAkcesorium(a),
    jednostka: a.jednostka,
  };
}
