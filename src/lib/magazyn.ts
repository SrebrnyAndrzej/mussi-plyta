import type { Akcesorium } from "@/data/akcesoria";

export type StanPozycji = "zgodne" | "ponizej-minimum" | "brak";

/** Ilość, którą można obiecać klientowi: dokumenty minus rezerwacje. */
export function dostepne(a: Pick<Akcesorium, "stanSystemowy" | "rezerwacje">): number {
  return a.stanSystemowy - a.rezerwacje;
}

export function stanPozycji(a: Akcesorium): StanPozycji {
  const wolne = dostepne(a);
  if (wolne <= 0) return "brak";
  if (wolne < a.stanMinimalny) return "ponizej-minimum";
  return "zgodne";
}

export type PowodKorekty =
  | "inwentaryzacja"
  | "dostawa"
  | "zwrot"
  | "uszkodzenie"
  | "pomylka-dokumentu";

export const powodyKorekty: Array<{ id: PowodKorekty; nazwa: string }> = [
  { id: "inwentaryzacja", nazwa: "Inwentaryzacja" },
  { id: "dostawa", nazwa: "Przyjęcie dostawy" },
  { id: "zwrot", nazwa: "Zwrot od klienta" },
  { id: "uszkodzenie", nazwa: "Uszkodzenie lub ubytek" },
  { id: "pomylka-dokumentu", nazwa: "Pomyłka w dokumencie" },
];

export type Korekta = {
  sku: string;
  /** `ustaw` nadpisuje stan, `zmien` dodaje lub odejmuje. */
  tryb: "ustaw" | "zmien";
  wartosc: number;
  powod: PowodKorekty;
  notatka?: string;
  autor: string;
};

export type WpisHistorii = {
  sku: string;
  nazwa: string;
  przed: number;
  po: number;
  roznica: number;
  powod: PowodKorekty;
  notatka?: string;
  autor: string;
  kiedy: string;
};

export type WynikKorekty =
  | { ok: true; pozycja: Akcesorium; wpis: WpisHistorii }
  | { ok: false; blad: string };

/**
 * Ręczna korekta stanu magazynowego.
 *
 * Zwraca nową pozycję zamiast mutować wejście, bo ten sam stan trafia
 * do listy i do historii. Każda korekta wymaga powodu, żeby po miesiącu
 * dało się odtworzyć, skąd wzięła się różnica.
 */
export function zastosujKorekte(
  pozycja: Akcesorium,
  korekta: Korekta,
  teraz: Date = new Date(),
): WynikKorekty {
  if (!Number.isFinite(korekta.wartosc)) {
    return { ok: false, blad: "Podaj liczbę." };
  }
  if (korekta.tryb === "zmien" && korekta.wartosc === 0) {
    return { ok: false, blad: "Zmiana o zero niczego nie koryguje." };
  }

  const przed = pozycja.stanSystemowy;
  const po =
    korekta.tryb === "ustaw" ? korekta.wartosc : przed + korekta.wartosc;

  if (po < 0) {
    return { ok: false, blad: "Stan magazynowy nie może zejść poniżej zera." };
  }
  if (!Number.isInteger(po)) {
    return { ok: false, blad: "Stan magazynowy musi być liczbą całkowitą." };
  }
  if (po === przed) {
    return { ok: false, blad: "Nowy stan jest taki sam jak obecny." };
  }
  if (po < pozycja.rezerwacje) {
    return {
      ok: false,
      blad: `Na tę pozycję jest ${pozycja.rezerwacje} ${pozycja.jednostka} rezerwacji. Stan nie może być niższy.`,
    };
  }

  return {
    ok: true,
    pozycja: { ...pozycja, stanSystemowy: po },
    wpis: {
      sku: pozycja.sku,
      nazwa: pozycja.nazwa,
      przed,
      po,
      roznica: po - przed,
      powod: korekta.powod,
      notatka: korekta.notatka?.trim() || undefined,
      autor: korekta.autor,
      kiedy: teraz.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }),
    },
  };
}

export type PodsumowanieMagazynu = {
  pozycji: number;
  ponizejMinimum: number;
  brakow: number;
  wartoscNetto: number;
};

/** Skrót stanu magazynu do belki nad tabelą. */
export function podsumujMagazyn(lista: Akcesorium[]): PodsumowanieMagazynu {
  return lista.reduce<PodsumowanieMagazynu>(
    (acc, a) => {
      const stan = stanPozycji(a);
      return {
        pozycji: acc.pozycji + 1,
        ponizejMinimum: acc.ponizejMinimum + (stan === "ponizej-minimum" ? 1 : 0),
        brakow: acc.brakow + (stan === "brak" ? 1 : 0),
        wartoscNetto: Math.round((acc.wartoscNetto + a.stanSystemowy * a.cena) * 100) / 100,
      };
    },
    { pozycji: 0, ponizejMinimum: 0, brakow: 0, wartoscNetto: 0 },
  );
}

/** Ile trzeba domówić, żeby wrócić nad stan minimalny. */
export function doZamowienia(a: Akcesorium): number {
  const brakuje = a.stanMinimalny - dostepne(a);
  return brakuje > 0 ? brakuje : 0;
}
