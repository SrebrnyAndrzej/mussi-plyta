import { describe, expect, it } from "vitest";
import {
  czyMoznaZlozycZamowienie,
  czyObowiazuje,
  doWyzszegoProgu,
  dostepnyLimit,
  naKredyt,
  obowiazujacyCennik,
  ustalCene,
  zmienWarunki,
  type Cennik,
  type CenaIndywidualna,
  type Kontrahent,
} from "@/lib/warunki";

const cenniki: Cennik[] = [
  { id: "2025", nazwa: "Cennik 2025", obowiazujeOd: "2025-01-01", obowiazujeDo: "2026-08-31", ceny: { "KR-5981": 210, "OB-ABS2": 4.5 } },
  { id: "2026-09", nazwa: "Cennik od września", obowiazujeOd: "2026-09-01", obowiazujeDo: null, ceny: { "KR-5981": 232, "OB-ABS2": 4.9 } },
];

function kontrahent(n: Partial<Kontrahent> = {}): Kontrahent {
  return {
    id: "K-00128",
    nazwa: "Stolarnia Nowak",
    kodProgu: "B2",
    formaPlatnosci: "przelew-14",
    limitPrzyznany: 25000,
    limitWykorzystany: 6580,
    obrotRoczny: 18420,
    status: "aktywny",
    ...n,
  };
}

describe("cenniki z datami obowiązywania", () => {
  it("stary cennik obowiązuje do końca sierpnia", () => {
    expect(czyObowiazuje(cenniki[0], new Date("2026-08-31T12:00:00Z"))).toBe(true);
    expect(czyObowiazuje(cenniki[0], new Date("2026-09-01T12:00:00Z"))).toBe(false);
  });

  it("cennik bezterminowy nie wygasa", () => {
    expect(czyObowiazuje(cenniki[1], new Date("2027-05-05T12:00:00Z"))).toBe(true);
  });

  it("wybiera cennik właściwy dla dnia zamówienia", () => {
    expect(obowiazujacyCennik(cenniki, new Date("2026-08-30T12:00:00Z"))?.id).toBe("2025");
    expect(obowiazujacyCennik(cenniki, new Date("2026-09-02T12:00:00Z"))?.id).toBe("2026-09");
  });

  it("gdy pasuje kilka, wygrywa nowsza decyzja hurtowni", () => {
    const nakladajace: Cennik[] = [
      { ...cenniki[0], obowiazujeDo: null },
      cenniki[1],
    ];
    expect(obowiazujacyCennik(nakladajace, new Date("2026-09-10T12:00:00Z"))?.id).toBe("2026-09");
  });

  it("zwraca null, gdy żaden cennik nie obowiązuje", () => {
    expect(obowiazujacyCennik(cenniki, new Date("2024-01-01T12:00:00Z"))).toBeNull();
  });
});

describe("ustalanie ceny", () => {
  const dzien = new Date("2026-08-30T12:00:00Z");

  it("stosuje próg rabatowy kontrahenta", () => {
    const c = ustalCene("KR-5981", kontrahent(), { cenniki }, dzien);
    expect(c.zrodlo).toBe("prog");
    expect(c.rabat).toBe(0.11);
    expect(c.cena).toBe(186.9);
    expect(c.cenaKatalogowa).toBe(210);
  });

  it("cena indywidualna bije próg rabatowy", () => {
    const indywidualne: CenaIndywidualna[] = [
      { kontrahent: "K-00128", sku: "KR-5981", cena: 175, obowiazujeOd: "2026-01-01", obowiazujeDo: null },
    ];
    const c = ustalCene("KR-5981", kontrahent(), { cenniki, indywidualne }, dzien);
    expect(c.zrodlo).toBe("indywidualna");
    expect(c.cena).toBe(175);
    expect(c.rabat).toBe(0);
  });

  it("cena indywidualna po terminie przestaje obowiązywać", () => {
    const indywidualne: CenaIndywidualna[] = [
      { kontrahent: "K-00128", sku: "KR-5981", cena: 175, obowiazujeOd: "2026-01-01", obowiazujeDo: "2026-06-30" },
    ];
    expect(ustalCene("KR-5981", kontrahent(), { cenniki, indywidualne }, dzien).zrodlo).toBe("prog");
  });

  it("nie stosuje ceny indywidualnej innego kontrahenta", () => {
    const indywidualne: CenaIndywidualna[] = [
      { kontrahent: "K-00074", sku: "KR-5981", cena: 150, obowiazujeOd: "2026-01-01", obowiazujeDo: null },
    ];
    expect(ustalCene("KR-5981", kontrahent(), { cenniki, indywidualne }, dzien).cena).toBe(186.9);
  });

  it("kontrahent bez umowy płaci cenę katalogową", () => {
    const c = ustalCene("KR-5981", kontrahent({ kodProgu: "B0" }), { cenniki }, dzien);
    expect(c.zrodlo).toBe("katalogowa");
    expect(c.cena).toBe(210);
  });

  it("zmiana cennika zmienia cenę tego samego indeksu", () => {
    const wrzesien = new Date("2026-09-02T12:00:00Z");
    expect(ustalCene("KR-5981", kontrahent(), { cenniki }, wrzesien).cena).toBe(206.48);
  });

  it("nie zgaduje ceny indeksu spoza cennika", () => {
    const c = ustalCene("NIE-MA", kontrahent(), { cenniki }, dzien);
    expect(c.zrodlo).toBe("brak");
    expect(c.cena).toBe(0);
  });
});

describe("limit kupiecki i blokady", () => {
  it("liczy wolny limit", () => {
    expect(dostepnyLimit(kontrahent())).toBe(18420);
  });

  it("blokada handlowa zatrzymuje każde zamówienie", () => {
    const wynik = czyMoznaZlozycZamowienie(kontrahent({ status: "blokada" }), 100);
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("blokadę handlową");
  });

  it("kontrahent w weryfikacji kupuje tylko z góry", () => {
    const naKredytWynik = czyMoznaZlozycZamowienie(kontrahent({ status: "weryfikacja" }), 1000);
    expect(naKredytWynik.ok).toBe(false);
    const zGory = czyMoznaZlozycZamowienie(
      kontrahent({ status: "weryfikacja", formaPlatnosci: "przedplata" }), 1000);
    expect(zGory.ok).toBe(true);
  });

  it("odmawia zamówienia ponad limit i podaje kwotę przekroczenia", () => {
    const wynik = czyMoznaZlozycZamowienie(kontrahent(), 20000);
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("1580.00");
  });

  it("przy przedpłacie limit nie ma znaczenia", () => {
    const k = kontrahent({ formaPlatnosci: "przedplata", limitPrzyznany: 0, limitWykorzystany: 0 });
    expect(czyMoznaZlozycZamowienie(k, 50000).ok).toBe(true);
  });

  it("ostrzega, gdy limit schodzi poniżej piątej części", () => {
    const wynik = czyMoznaZlozycZamowienie(kontrahent(), 16000);
    expect(wynik.ok).toBe(true);
    expect(wynik.ostrzezenie).toContain("2420.00");
  });

  it("nie ostrzega przy spokojnym zamówieniu", () => {
    expect(czyMoznaZlozycZamowienie(kontrahent(), 2000).ostrzezenie).toBeNull();
  });

  it("odrzuca zamówienie o wartości zero", () => {
    expect(czyMoznaZlozycZamowienie(kontrahent(), 0).ok).toBe(false);
  });

  it("rozpoznaje formy płatności odroczonej", () => {
    expect(naKredyt("przedplata")).toBe(false);
    expect(naKredyt("pobranie")).toBe(false);
    expect(naKredyt("przelew-21")).toBe(true);
    expect(naKredyt("limit-kupiecki")).toBe(true);
  });
});

describe("zmiana warunków handlowych", () => {
  const teraz = new Date("2026-08-30T12:00:00Z");

  it("zapisuje osobny wpis audytu dla każdego zmienionego pola", () => {
    const wynik = zmienWarunki(kontrahent(), { kodProgu: "B3", limitPrzyznany: 40000 },
      "biuro", "Przekroczony próg obrotu", teraz);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.wpisy).toHaveLength(2);
    expect(wynik.wpisy[0]).toMatchObject({ pole: "Próg rabatowy", przed: "B2", po: "B3", autor: "biuro" });
    expect(wynik.kontrahent.limitPrzyznany).toBe(40000);
  });

  it("nie mutuje kontrahenta wejściowego", () => {
    const k = kontrahent();
    zmienWarunki(k, { kodProgu: "B3" }, "biuro", "powód", teraz);
    expect(k.kodProgu).toBe("B2");
  });

  it("wymaga operatora i powodu", () => {
    expect(zmienWarunki(kontrahent(), { kodProgu: "B3" }, "", "powód", teraz).ok).toBe(false);
    expect(zmienWarunki(kontrahent(), { kodProgu: "B3" }, "biuro", " ", teraz).ok).toBe(false);
  });

  it("odrzuca nieznany próg", () => {
    expect(zmienWarunki(kontrahent(), { kodProgu: "B9" }, "biuro", "powód", teraz).ok).toBe(false);
  });

  it("nie pozwala zejść z limitem poniżej już wykorzystanego", () => {
    const wynik = zmienWarunki(kontrahent(), { limitPrzyznany: 1000 }, "biuro", "powód", teraz);
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("6580.00");
  });

  it("odrzuca zmianę, która niczego nie zmienia", () => {
    expect(zmienWarunki(kontrahent(), { kodProgu: "B2" }, "biuro", "powód", teraz).ok).toBe(false);
  });
});

describe("droga do wyższego progu", () => {
  it("mówi, ile brakuje", () => {
    expect(doWyzszegoProgu(18420)).toEqual({ kod: "B3", brakuje: 1580 });
  });

  it("milczy na najwyższym progu", () => {
    expect(doWyzszegoProgu(90000)).toBeNull();
  });
});
