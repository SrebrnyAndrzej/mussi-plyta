import { cennik, progiRabatowe, type ProgRabatowy } from "@/config/brief";
import { policzRozkroj, type Formatka, type WynikRozkroju } from "@/lib/nesting";

export type GrubosciCiecia = 3 | 18 | 36;

export type WycenaUslug = {
  rozkroj: WynikRozkroju;
  arkuszy: number;
  kosztCiecia: number;
  obrzezeMb: number;
  kosztOklejania: number;
  razemNetto: number;
};

/** Wycena usług stolarni dla listy formatek. */
export function wycenUslugi(
  formatki: Formatka[],
  grubosc: GrubosciCiecia = 18,
): WycenaUslug {
  const wynik = policzRozkroj(formatki);

  const stawkaCiecia =
    grubosc === 3 ? cennik.cieciePlyty3.cena : cennik.cieciePlyty18.cena;
  const stawkaOklejania =
    grubosc === 36 ? cennik.oklejanie36.cena : cennik.oklejanie18.cena;

  const kosztCiecia = wynik.arkuszy * stawkaCiecia;
  const kosztOklejania = wynik.obrzezeMb * stawkaOklejania;

  return {
    rozkroj: wynik,
    arkuszy: wynik.arkuszy,
    kosztCiecia: zaokr(kosztCiecia),
    obrzezeMb: wynik.obrzezeMb,
    kosztOklejania: zaokr(kosztOklejania),
    razemNetto: zaokr(kosztCiecia + kosztOklejania),
  };
}

export type PozycjaKoszyka = {
  nazwa: string;
  ilosc: number;
  jednostka: string;
  cenaKatalogowa: number;
};

export type Podsumowanie = {
  wartoscKatalogowa: number;
  rabatKwota: number;
  wartoscNetto: number;
  vat: number;
  brutto: number;
  prog: ProgRabatowy;
};

const STAWKA_VAT = 0.23;

/** Podsumowanie koszyka z rabatem kontrahenta. */
export function podsumujKoszyk(
  pozycje: PozycjaKoszyka[],
  kodProgu: string,
  transport = 0,
): Podsumowanie {
  const prog =
    progiRabatowe.find((p) => p.kod === kodProgu) ?? progiRabatowe[0];

  const wartoscKatalogowa = pozycje.reduce(
    (s, p) => s + p.ilosc * p.cenaKatalogowa,
    0,
  );
  const rabatKwota = wartoscKatalogowa * prog.rabat;
  const netto = wartoscKatalogowa - rabatKwota + transport;
  const vat = netto * STAWKA_VAT;

  return {
    wartoscKatalogowa: zaokr(wartoscKatalogowa),
    rabatKwota: zaokr(rabatKwota),
    wartoscNetto: zaokr(netto),
    vat: zaokr(vat),
    brutto: zaokr(netto + vat),
    prog,
  };
}

/** Cena po rabacie dla pojedynczej pozycji. */
export function cenaDlaKontrahenta(cenaKatalogowa: number, kodProgu: string): number {
  const prog = progiRabatowe.find((p) => p.kod === kodProgu) ?? progiRabatowe[0];
  return zaokr(cenaKatalogowa * (1 - prog.rabat));
}

/** Ile brakuje do następnego progu rabatowego. */
export function doNastepnegoProgu(obrotRoczny: number): {
  nastepny: ProgRabatowy | null;
  brakuje: number;
} {
  const wyzsze = progiRabatowe.filter((p) => p.odObrotu > obrotRoczny);
  if (wyzsze.length === 0) return { nastepny: null, brakuje: 0 };
  const nastepny = wyzsze.reduce((a, b) => (a.odObrotu < b.odObrotu ? a : b));
  return { nastepny, brakuje: zaokr(nastepny.odObrotu - obrotRoczny) };
}

function zaokr(n: number): number {
  return Math.round(n * 100) / 100;
}

export const zloty = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

export const liczba = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});
