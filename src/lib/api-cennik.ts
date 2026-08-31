import type { Akcesorium } from "@/data/akcesoria";
import type { Dekor, Dostepnosc } from "@/data/dekory";
import { dostepnoscAkcesorium } from "@/lib/sklep-akcesoriow";
import {
  obowiazujacyCennik,
  ustalCene,
  type CenaIndywidualna,
  type Cennik,
  type Kontrahent,
  type ZrodloCeny,
} from "@/lib/warunki";

/**
 * Cennik kontrahenta dla API.
 *
 * Aplikacja stolarza pyta o ceny swojej firmy, nie o nasz cennik katalogowy.
 * Hierarchia jest ta sama, co w portalu, i liczy ją `ustalCene`: cena
 * uzgodniona indywidualnie bije próg rabatowy, próg bije cenę katalogową.
 * Nie powielamy tu tej logiki, żeby API i ekran nie mogły się rozjechać.
 *
 * Stan magazynu wychodzi wyłącznie jako etykieta dostępności. Liczby zostają
 * u nas: klucz da się przekazać dalej, a dokładny stan i tak jest nieprawdziwy
 * za minutę, bo rezerwacje zmieniają się w ciągu dnia.
 */

export type PozycjaCennika = {
  /** Indeks, po którym zamawia klient: symbol producenta. */
  indeks: string;
  nazwa: string;
  producent: string;
  rodzaj: "plyta" | "akcesorium";
  kategoria: string;
  jednostka: string;
  /** Cena netto dla tego kontrahenta. */
  cenaNetto: number;
  /** Cena netto przed rabatem, dla porównania. */
  cenaKatalogowaNetto: number | null;
  /** Użyty rabat jako ułamek. Zero przy cenie uzgodnionej indywidualnie. */
  rabat: number;
  zrodloCeny: ZrodloCeny;
  dostepnosc: Dostepnosc;
};

/**
 * Cennik obejmujący cały asortyment.
 *
 * Cennik handlowy w danych wymienia kilka indeksów, a asortyment liczy setki,
 * więc podstawą jest cena z karty produktu, a cennik handlowy ją nadpisuje
 * tam, gdzie coś mówi. Dzięki temu wygaśnięcie cennika handlowego nie zostawia
 * API bez cen, tylko cofa je do cen katalogowych.
 */
export function cennikAsortymentu(
  plyty: readonly Dekor[],
  akcesoria: readonly Akcesorium[],
  handlowy: Cennik | null,
): Cennik {
  const ceny: Record<string, number> = {};
  for (const p of plyty) ceny[p.kod] = p.cenaKatalogowa;
  for (const a of akcesoria) ceny[a.sku] = a.cena;
  Object.assign(ceny, handlowy?.ceny ?? {});

  return {
    id: handlowy?.id ?? "katalogowy",
    nazwa: handlowy?.nazwa ?? "Ceny katalogowe",
    /* Ceny z kart produktów obowiązują zawsze: to one są podstawą,
       gdy żaden cennik handlowy nie jest w mocy. */
    obowiazujeOd: "1970-01-01",
    obowiazujeDo: null,
    ceny,
  };
}

export type WynikCennika = {
  /** Cennik handlowy użyty do wyceny albo null, gdy żaden nie obowiązuje. */
  cennikHandlowy: { id: string; nazwa: string; obowiazujeDo: string | null } | null;
  pozycje: PozycjaCennika[];
};

export function cennikDlaKontrahenta(
  kontrahent: Pick<Kontrahent, "id" | "kodProgu">,
  zrodla: {
    plyty: readonly Dekor[];
    akcesoria: readonly Akcesorium[];
    cenniki: readonly Cennik[];
    indywidualne: readonly CenaIndywidualna[];
  },
  dzien: Date = new Date(),
): WynikCennika {
  const handlowy = obowiazujacyCennik(zrodla.cenniki, dzien);
  const pelny = cennikAsortymentu(zrodla.plyty, zrodla.akcesoria, handlowy);
  const wycen = (indeks: string) =>
    ustalCene(indeks, kontrahent, { cenniki: [pelny], indywidualne: zrodla.indywidualne }, dzien);

  const pozycje: PozycjaCennika[] = [
    ...zrodla.plyty.map((p) => {
      const cena = wycen(p.kod);
      return {
        indeks: p.kod,
        nazwa: p.nazwa,
        producent: p.producent,
        rodzaj: "plyta" as const,
        kategoria: p.kategoria,
        jednostka: p.jednostka,
        cenaNetto: cena.cena,
        cenaKatalogowaNetto: cena.cenaKatalogowa,
        rabat: cena.rabat,
        zrodloCeny: cena.zrodlo,
        dostepnosc: p.dostepnosc,
      };
    }),
    ...zrodla.akcesoria.map((a) => {
      const cena = wycen(a.sku);
      return {
        indeks: a.sku,
        nazwa: a.nazwa,
        producent: a.producent,
        rodzaj: "akcesorium" as const,
        kategoria: a.kategoria,
        jednostka: a.jednostka,
        cenaNetto: cena.cena,
        cenaKatalogowaNetto: cena.cenaKatalogowa,
        rabat: cena.rabat,
        zrodloCeny: cena.zrodlo,
        dostepnosc: dostepnoscAkcesorium(a),
      };
    }),
  ];

  return {
    cennikHandlowy: handlowy
      ? { id: handlowy.id, nazwa: handlowy.nazwa, obowiazujeDo: handlowy.obowiazujeDo }
      : null,
    pozycje,
  };
}
