import { operatorHurtowni } from "@/config/brief";
import { wystawPotwierdzenie, type DokumentWystawiony } from "@/lib/dokumenty";
import type { KategoriaPozycji, PozycjaDokumentu } from "@/lib/fakturowanie";
import { czyMozeZlozyc, type Czlonek } from "@/lib/organizacja";
import { STAWKA_VAT } from "@/lib/pricing";
import { zarezerwuj, type Brak, type Rezerwacja } from "@/lib/rezerwacje";
import {
  czyMoznaZlozycZamowienie,
  ustalCene,
  type CenaIndywidualna,
  type Cennik,
  type Kontrahent,
} from "@/lib/warunki";
import {
  komunikatTerminu,
  terminOczekiwany,
  wartoscPozycji,
  type DostepnoscKoszyka,
  type PozycjaZamowienia,
  type Zamowienie,
} from "@/lib/zamowienia";

/**
 * Złożenie zamówienia: jedna ścieżka przez wszystkie silniki.
 *
 * Do tej pory każdy silnik działał osobno, a koszyk kończył się na ustawieniu
 * flagi. Ten moduł jest kręgosłupem: prowadzi koszyk przez uprawnienia, wycenę,
 * warunki handlowe, rezerwację, utworzenie zamówienia i potwierdzenie,
 * i zatrzymuje się na pierwszym etapie, który odmawia.
 *
 * Kolejność nie jest dowolna. Uprawnienia idą przed wyceną, bo nie ma po co
 * liczyć zamówienia, którego ta osoba nie może złożyć. Wycena idzie przed
 * warunkami handlowymi, bo limit kupiecki sprawdza się wobec kwoty. Rezerwacja
 * idzie po warunkach, żeby nie blokować towaru pod zamówienie, które i tak
 * odpadnie na blokadzie.
 */

export type EtapZlozenia =
  | "uprawnienia"
  | "wycena"
  | "warunki-handlowe"
  | "rezerwacja"
  | "potwierdzenie";

export type PozycjaDoZlozenia = {
  id: string;
  sku: string;
  nazwa: string;
  ilosc: number;
  jednostka: string;
  cenaKatalogowa: number;
  kategoria: KategoriaPozycji;
};

export type KontekstZlozenia = {
  zamowienie: string;
  kontrahent: Kontrahent;
  skladajacy: Czlonek;
  zespol: readonly Czlonek[];
  pozycje: readonly PozycjaDoZlozenia[];
  /** Stan systemowy dla każdego indeksu z koszyka. */
  stany: Readonly<Record<string, number>>;
  rezerwacje: readonly Rezerwacja[];
  cenniki: readonly Cennik[];
  indywidualne?: readonly CenaIndywidualna[];
  teraz?: Date;
};

export type WycenionaPozycja = PozycjaDoZlozenia & {
  cenaJednostkowa: number;
  netto: number;
  zrodloCeny: string;
};

export type UdaneZlozenie = {
  ok: true;
  zamowienie: Zamowienie;
  rezerwacje: Rezerwacja[];
  potwierdzenie: DokumentWystawiony;
  pozycje: WycenionaPozycja[];
  netto: number;
  vat: number;
  brutto: number;
  termin: Date;
  komunikat: string;
  /** Zamówienie ponad limit osoby składającej czeka na akceptację. */
  wymagaAkceptacji: boolean;
  akceptujacy: Czlonek[];
};

export type OdmowaZlozenia = {
  ok: false;
  etap: EtapZlozenia;
  blad: string;
  /** Wypełnione tylko wtedy, gdy odmowa wynika z braku pokrycia. */
  braki: Brak[];
};

export type WynikZlozenia = UdaneZlozenie | OdmowaZlozenia;

const zaokr = (n: number) => Math.round(n * 100) / 100;

function odmowa(etap: EtapZlozenia, blad: string, braki: Brak[] = []): OdmowaZlozenia {
  return { ok: false, etap, blad, braki };
}

export function zlozZamowienie(kontekst: KontekstZlozenia): WynikZlozenia {
  const teraz = kontekst.teraz ?? new Date();

  if (kontekst.pozycje.length === 0) {
    return odmowa("wycena", "Koszyk jest pusty.");
  }

  /* 1. Wycena idzie pierwsza, bo dwa kolejne sprawdzenia potrzebują kwoty. */
  const wycenione: WycenionaPozycja[] = [];
  for (const p of kontekst.pozycje) {
    const cena = ustalCene(
      p.sku,
      { id: kontekst.kontrahent.id, kodProgu: kontekst.kontrahent.kodProgu },
      { cenniki: kontekst.cenniki, indywidualne: kontekst.indywidualne },
      teraz,
    );
    if (cena.zrodlo === "brak") {
      return odmowa("wycena", `Indeks ${p.sku} nie ma ceny w obowiązującym cenniku.`);
    }
    wycenione.push({
      ...p,
      cenaJednostkowa: cena.cena,
      netto: zaokr(cena.cena * p.ilosc),
      zrodloCeny: cena.zrodlo,
    });
  }

  const netto = zaokr(wycenione.reduce((s, p) => s + p.netto, 0));
  const vat = zaokr(netto * STAWKA_VAT);
  const brutto = zaokr(netto + vat);

  /* 2. Kto składa i do jakiej kwoty. */
  const uprawnienia = czyMozeZlozyc(kontekst.skladajacy, brutto, kontekst.zespol);
  if (!uprawnienia.ok) return odmowa("uprawnienia", uprawnienia.blad);

  /* 3. Warunki handlowe firmy: blokada, weryfikacja, limit kupiecki. */
  const warunki = czyMoznaZlozycZamowienie(kontekst.kontrahent, brutto);
  if (!warunki.ok) return odmowa("warunki-handlowe", warunki.blad);

  /* 4. Rezerwacja całego koszyka albo nic. Miękka, bo hurtownia jeszcze nie potwierdziła. */
  const rezerwacja = zarezerwuj(
    kontekst.rezerwacje,
    {
      zamowienie: kontekst.zamowienie,
      pozycje: wycenione.map((p) => ({ sku: p.sku, nazwa: p.nazwa, ilosc: p.ilosc })),
      stany: kontekst.stany,
    },
    teraz,
  );
  if (!rezerwacja.ok) {
    return odmowa("rezerwacja", rezerwacja.blad, rezerwacja.braki);
  }

  /* 5. Zamówienie w wersji pierwszej. Zegar okna zmian rusza od tej chwili. */
  const pozycjeZamowienia: PozycjaZamowienia[] = wycenione.map((p) => ({
    id: p.id,
    nazwa: p.nazwa,
    ilosc: p.ilosc,
    netto: p.netto,
  }));
  const termin = terminOczekiwany(teraz);

  const zamowienie: Zamowienie = {
    id: kontekst.zamowienie,
    status: "okno-zmian",
    przyjeteO: teraz,
    terminOczekiwany: termin,
    terminPotwierdzony: null,
    wersje: [
      {
        numer: 1,
        pozycje: pozycjeZamowienia,
        wartoscNetto: wartoscPozycji(pozycjeZamowienia),
        prognoza: termin,
        utworzona: teraz,
        autor: kontekst.skladajacy.id,
        powod: null,
      },
    ],
  };

  /* 6. Potwierdzenie zamraża wersję i cenę. Nie jest fiskalne, więc nie czeka
        na dane rejestrowe podmiotów. */
  const pozycjeDokumentu: PozycjaDokumentu[] = wycenione.map((p) => ({
    id: p.id,
    nazwa: p.nazwa,
    kategoria: p.kategoria,
    netto: p.netto,
  }));
  const dokument = wystawPotwierdzenie(zamowienie, pozycjeDokumentu, operatorHurtowni.login, teraz);
  if (!dokument.ok) return odmowa("potwierdzenie", dokument.blad);

  /* Cały koszyk ma pokrycie, bo rezerwacja przeszła w całości. */
  const dostepnosc: DostepnoscKoszyka = "cala";

  return {
    ok: true,
    zamowienie,
    rezerwacje: rezerwacja.rezerwacje,
    potwierdzenie: dokument.dokument,
    pozycje: wycenione,
    netto,
    vat,
    brutto,
    termin,
    komunikat: komunikatTerminu(dostepnosc, termin),
    wymagaAkceptacji: uprawnienia.wymagaAkceptacji,
    akceptujacy: uprawnienia.wymagaAkceptacji ? uprawnienia.akceptujacy : [],
  };
}
