import { describe, expect, it } from "vitest";
import type { Czlonek } from "@/lib/organizacja";
import type { Cennik, Kontrahent } from "@/lib/warunki";
import { zlozZamowienie, type KontekstZlozenia, type PozycjaDoZlozenia } from "@/lib/zlozenie";

const TERAZ = new Date("2026-08-31T09:00:00");

const cenniki: Cennik[] = [
  {
    id: "2026",
    nazwa: "Cennik 2026",
    obowiazujeOd: "2026-01-01",
    obowiazujeDo: null,
    ceny: { "KR-5981": 210, "OB-ABS2": 4.5, "BLU-500": 89 },
  },
];

const pozycje: PozycjaDoZlozenia[] = [
  { id: "l1", sku: "KR-5981", nazwa: "Płyta 5981", ilosc: 6, jednostka: "ark.", cenaKatalogowa: 210, kategoria: "materialy" },
  { id: "l2", sku: "OB-ABS2", nazwa: "Obrzeże ABS 2 mm", ilosc: 40, jednostka: "mb", cenaKatalogowa: 4.5, kategoria: "obrzeza" },
];

const stany = { "KR-5981": 30, "OB-ABS2": 200, "BLU-500": 10 };

function kontrahent(n: Partial<Kontrahent> = {}): Kontrahent {
  return {
    id: "K-00128", nazwa: "Stolarnia Nowak", kodProgu: "B2", formaPlatnosci: "przelew-14",
    limitPrzyznany: 25000, limitWykorzystany: 0, obrotRoczny: 18420, status: "aktywny", ...n,
  };
}

const wlasciciel: Czlonek = { id: "U-1", imie: "Kazimierz Nowak", email: "k@n.pl", rola: "wlasciciel", limitAkceptacji: null, aktywny: true };
const kupujacy: Czlonek = { id: "U-2", imie: "Anna Wrona", email: "a@n.pl", rola: "kupujacy", limitAkceptacji: 1000, aktywny: true };
const podglad: Czlonek = { id: "U-3", imie: "Piotr Lis", email: "p@n.pl", rola: "podglad", limitAkceptacji: 0, aktywny: true };

function kontekst(n: Partial<KontekstZlozenia> = {}): KontekstZlozenia {
  return {
    zamowienie: "M-2026-1001",
    kontrahent: kontrahent(),
    skladajacy: wlasciciel,
    zespol: [wlasciciel, kupujacy, podglad],
    pozycje,
    stany,
    rezerwacje: [],
    cenniki,
    teraz: TERAZ,
    ...n,
  };
}

describe("udane złożenie zamówienia", () => {
  it("przechodzi przez wszystkie silniki i zwraca komplet", () => {
    const w = zlozZamowienie(kontekst());
    if (!w.ok) throw new Error(`${w.etap}: ${w.blad}`);

    expect(w.zamowienie.status).toBe("okno-zmian");
    expect(w.zamowienie.wersje).toHaveLength(1);
    expect(w.rezerwacje).toHaveLength(2);
    expect(w.potwierdzenie.rodzaj).toBe("potwierdzenie");
    expect(w.potwierdzenie.numer).toBe("PZ/M-2026-1001/1");
  });

  it("wycenia po progu kontrahenta, nie po cenie katalogowej", () => {
    const w = zlozZamowienie(kontekst());
    if (!w.ok) throw new Error(w.blad);
    /* Próg B2 to rabat 11 procent: 210 na 186,90 oraz 4,50 na 4,01. */
    expect(w.pozycje[0].cenaJednostkowa).toBe(186.9);
    expect(w.pozycje[0].zrodloCeny).toBe("prog");
    expect(w.netto).toBe(zaokraglij(186.9 * 6 + 4.01 * 40));
  });

  it("uruchamia zegar okna zmian od chwili złożenia", () => {
    const w = zlozZamowienie(kontekst());
    if (!w.ok) throw new Error(w.blad);
    expect(w.zamowienie.przyjeteO).toEqual(TERAZ);
  });

  it("liczy termin i nie obiecuje go bez pokrycia", () => {
    const w = zlozZamowienie(kontekst());
    if (!w.ok) throw new Error(w.blad);
    expect(w.termin.getTime()).toBeGreaterThan(TERAZ.getTime());
    expect(w.komunikat).toContain("zarezerwowany");
  });

  it("cena indywidualna bije próg także w tej ścieżce", () => {
    const w = zlozZamowienie(kontekst({
      indywidualne: [{ kontrahent: "K-00128", sku: "KR-5981", cena: 175, obowiazujeOd: "2026-01-01", obowiazujeDo: null }],
    }));
    if (!w.ok) throw new Error(w.blad);
    expect(w.pozycje[0].cenaJednostkowa).toBe(175);
    expect(w.pozycje[0].zrodloCeny).toBe("indywidualna");
  });
});

describe("odmowy, każda z własnym etapem", () => {
  it("podgląd nie złoży zamówienia", () => {
    const w = zlozZamowienie(kontekst({ skladajacy: podglad }));
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.etap).toBe("uprawnienia");
  });

  it("blokada handlowa zatrzymuje przed rezerwacją", () => {
    const w = zlozZamowienie(kontekst({ kontrahent: kontrahent({ status: "blokada" }) }));
    if (w.ok) throw new Error("powinno odmówić");
    expect(w.etap).toBe("warunki-handlowe");
    expect(w.blad).toContain("blokadę handlową");
  });

  it("przekroczony limit kupiecki zatrzymuje przed rezerwacją", () => {
    const w = zlozZamowienie(kontekst({
      kontrahent: kontrahent({ limitPrzyznany: 100, limitWykorzystany: 0 }),
    }));
    if (w.ok) throw new Error("powinno odmówić");
    expect(w.etap).toBe("warunki-handlowe");
  });

  it("brak pokrycia odmawia i zwraca listę braków", () => {
    const w = zlozZamowienie(kontekst({ stany: { "KR-5981": 2, "OB-ABS2": 200 } }));
    if (w.ok) throw new Error("powinno odmówić");
    expect(w.etap).toBe("rezerwacja");
    expect(w.braki).toHaveLength(1);
    expect(w.braki[0]).toMatchObject({ sku: "KR-5981", potrzeba: 6, dostepne: 2, brakuje: 4 });
  });

  it("indeks spoza cennika odmawia zamiast liczyć zero", () => {
    const w = zlozZamowienie(kontekst({
      pozycje: [{ ...pozycje[0], sku: "NIE-MA" }],
      stany: { "NIE-MA": 10 },
    }));
    if (w.ok) throw new Error("powinno odmówić");
    expect(w.etap).toBe("wycena");
  });

  it("pusty koszyk odmawia", () => {
    expect(zlozZamowienie(kontekst({ pozycje: [] })).ok).toBe(false);
  });
});

describe("kolejność etapów ma znaczenie", () => {
  it("blokada handlowa nie rezerwuje towaru", () => {
    const w = zlozZamowienie(kontekst({ kontrahent: kontrahent({ status: "blokada" }) }));
    expect(w.ok).toBe(false);
    /* Rezerwacja nie powstała, więc kolejne zamówienie ma pełny stan. */
    const kolejne = zlozZamowienie(kontekst({ zamowienie: "M-2026-1002" }));
    expect(kolejne.ok).toBe(true);
  });

  it("dwa zamówienia nie sprzedadzą tego samego arkusza", () => {
    const pierwsze = zlozZamowienie(kontekst({ stany: { "KR-5981": 6, "OB-ABS2": 200 } }));
    if (!pierwsze.ok) throw new Error(pierwsze.blad);

    const drugie = zlozZamowienie(kontekst({
      zamowienie: "M-2026-1002",
      stany: { "KR-5981": 6, "OB-ABS2": 200 },
      rezerwacje: pierwsze.rezerwacje,
    }));
    if (drugie.ok) throw new Error("drugie zamówienie nie powinno przejść");
    expect(drugie.etap).toBe("rezerwacja");
    expect(drugie.braki[0].brakuje).toBe(6);
  });
});

describe("akceptacja ponad limit", () => {
  it("kupujący ponad limit przechodzi, ale z akceptacją", () => {
    const w = zlozZamowienie(kontekst({ skladajacy: kupujacy }));
    if (!w.ok) throw new Error(w.blad);
    expect(w.wymagaAkceptacji).toBe(true);
    expect(w.akceptujacy.map((c) => c.id)).toEqual(["U-1"]);
  });

  it("właściciel składa bez akceptacji", () => {
    const w = zlozZamowienie(kontekst());
    if (!w.ok) throw new Error(w.blad);
    expect(w.wymagaAkceptacji).toBe(false);
  });
});

function zaokraglij(n: number) {
  return Math.round(n * 100) / 100;
}
