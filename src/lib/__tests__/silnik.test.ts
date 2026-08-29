import { describe, expect, it } from "vitest";
import { policzObrzeze, policzRozkroj, type Formatka } from "@/lib/nesting";
import { doNastepnegoProgu, podsumujKoszyk, wycenUslugi } from "@/lib/pricing";
import { rozkroj } from "@/config/brief";

const korpus: Formatka = {
  dlugosc: 720, szerokosc: 560, obrzeze: [1, 1, 1, 0], sztuk: 8, sloje: true,
};
const polka: Formatka = {
  dlugosc: 564, szerokosc: 500, obrzeze: [1, 0, 0, 0], sztuk: 6, sloje: false,
};

describe("rozkrój", () => {
  it("mieści typową kuchnię na dwóch arkuszach", () => {
    const w = policzRozkroj([korpus, polka]);
    expect(w.arkuszy).toBeGreaterThanOrEqual(1);
    expect(w.arkuszy).toBeLessThanOrEqual(2);
    expect(w.odrzucone).toHaveLength(0);
  });

  it("nie nakłada sztuk na siebie w obrębie arkusza", () => {
    const w = policzRozkroj([korpus, polka, { ...korpus, sztuk: 12 }]);
    for (const ark of w.arkusze) {
      for (let i = 0; i < ark.sztuki.length; i++) {
        for (let j = i + 1; j < ark.sztuki.length; j++) {
          const a = ark.sztuki[i], b = ark.sztuki[j];
          const rozlaczne =
            a.x + a.dlugosc <= b.x || b.x + b.dlugosc <= a.x ||
            a.y + a.szerokosc <= b.y || b.y + b.szerokosc <= a.y;
          expect(rozlaczne).toBe(true);
        }
      }
    }
  });

  it("trzyma każdą sztukę w obrysie arkusza", () => {
    const w = policzRozkroj([korpus, polka]);
    for (const ark of w.arkusze) {
      for (const s of ark.sztuki) {
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.x + s.dlugosc).toBeLessThanOrEqual(rozkroj.plyta.szerokosc);
        expect(s.y + s.szerokosc).toBeLessThanOrEqual(rozkroj.plyta.wysokosc);
      }
    }
  });

  it("nie obraca formatki z wymuszonymi słojami", () => {
    const w = policzRozkroj([{ ...korpus, dlugosc: 500, szerokosc: 900, sloje: true }]);
    expect(w.arkusze[0].sztuki.every((s) => !s.obrocona)).toBe(true);
  });

  it("odrzuca formatkę większą niż arkusz", () => {
    const w = policzRozkroj([{ ...korpus, dlugosc: 3200, sztuk: 1 }]);
    expect(w.odrzucone).toHaveLength(1);
    expect(w.arkuszy).toBe(0);
  });

  it("pusta lista daje zero arkuszy i zero kosztu", () => {
    const w = policzRozkroj([]);
    expect(w.arkuszy).toBe(0);
    expect(w.powierzchniaM2).toBe(0);
    expect(w.wykorzystanie).toBe(0);
  });
});

describe("obrzeże", () => {
  it("liczy tylko oklejone krawędzie", () => {
    // 8 sztuk, oklejone: góra 720, dół 720, lewa 560 => 2000 mm na sztukę
    expect(policzObrzeze([korpus])).toBeCloseTo(16, 3);
  });

  it("brak obrzeża daje zero metrów", () => {
    expect(policzObrzeze([{ ...korpus, obrzeze: [0, 0, 0, 0] }])).toBe(0);
  });
});

describe("wycena usług", () => {
  it("liczy cięcie od arkusza i oklejanie od metra", () => {
    const w = wycenUslugi([korpus, polka], 18);
    expect(w.kosztCiecia).toBe(w.arkuszy * 75);
    expect(w.kosztOklejania).toBeCloseTo(w.obrzezeMb * 4.5, 2);
    expect(w.razemNetto).toBeCloseTo(w.kosztCiecia + w.kosztOklejania, 2);
  });

  it("dla płyty 3 mm stosuje tańszą stawkę cięcia", () => {
    const gruba = wycenUslugi([korpus], 18);
    const cienka = wycenUslugi([korpus], 3);
    expect(cienka.kosztCiecia).toBeLessThan(gruba.kosztCiecia);
  });
});

describe("koszyk i rabaty", () => {
  const pozycje = [
    { nazwa: "K003 PW", ilosc: 4, jednostka: "arkusz", cenaKatalogowa: 248 },
    { nazwa: "Obrzeże ABS", ilosc: 50, jednostka: "mb", cenaKatalogowa: 2.4 },
  ];

  it("nalicza rabat progu i VAT", () => {
    const p = podsumujKoszyk(pozycje, "B2");
    expect(p.wartoscKatalogowa).toBeCloseTo(1112, 2);
    expect(p.rabatKwota).toBeCloseTo(1112 * 0.11, 2);
    expect(p.brutto).toBeCloseTo(p.wartoscNetto * 1.23, 2);
  });

  it("bez progu nie daje rabatu", () => {
    expect(podsumujKoszyk(pozycje, "B0").rabatKwota).toBe(0);
  });

  it("nieznany próg traktuje jak brak umowy", () => {
    expect(podsumujKoszyk(pozycje, "NIE-MA").rabatKwota).toBe(0);
  });

  it("dolicza transport przed podatkiem", () => {
    const bez = podsumujKoszyk(pozycje, "B1", 0);
    const zTransportem = podsumujKoszyk(pozycje, "B1", 90);
    expect(zTransportem.wartoscNetto - bez.wartoscNetto).toBeCloseTo(90, 2);
  });

  it("wskazuje najbliższy wyższy próg", () => {
    const { nastepny, brakuje } = doNastepnegoProgu(5000);
    expect(nastepny?.kod).toBe("B2");
    expect(brakuje).toBe(3000);
  });

  it("na najwyższym progu nie ma następnego", () => {
    expect(doNastepnegoProgu(999_999).nastepny).toBeNull();
  });
});

describe("odrzucanie formatek, przypadki brzegowe", () => {
  const baza = { obrzeze: [1, 1, 1, 1] as [number, number, number, number], sztuk: 1, sloje: false };

  it("odrzuca formatkę, która nie wchodzi w arkusz w żadnej orientacji", () => {
    // 2500 x 2500: dłuższy bok mieści się w 2800, ale krótszy nie mieści się w 2070
    const w = policzRozkroj([{ ...baza, dlugosc: 2500, szerokosc: 2500 }]);
    expect(w.odrzucone).toHaveLength(1);
    expect(w.arkuszy).toBe(0);
  });

  it("przyjmuje formatkę, która wchodzi dopiero po obróceniu", () => {
    // 2000 x 2700 nie wchodzi wprost, ale po obrocie tak
    const w = policzRozkroj([{ ...baza, dlugosc: 2000, szerokosc: 2700 }]);
    expect(w.odrzucone).toHaveLength(0);
    expect(w.arkuszy).toBe(1);
  });

  it("odrzuca tę samą formatkę, gdy słoje blokują obrót", () => {
    const w = policzRozkroj([{ ...baza, dlugosc: 2000, szerokosc: 2700, sloje: true }]);
    expect(w.odrzucone).toHaveLength(1);
  });

  it("odrzuca formatkę krótszą niż minimum okleiniarki na dłuższym boku", () => {
    // 100 x 100: krótszy bok ponad 70, ale dłuższy poniżej 150
    const w = policzRozkroj([{ ...baza, dlugosc: 100, szerokosc: 100 }]);
    expect(w.odrzucone).toHaveLength(1);
  });

  it("przyjmuje formatkę dokładnie na granicy minimum", () => {
    const w = policzRozkroj([{ ...baza, dlugosc: 150, szerokosc: 70 }]);
    expect(w.odrzucone).toHaveLength(0);
  });

  it("nie gubi pozycji: co nie zostało odrzucone, trafia na arkusz", () => {
    const lista = [
      { ...baza, dlugosc: 720, szerokosc: 560, sztuk: 5 },
      { ...baza, dlugosc: 3000, szerokosc: 400 },
      { ...baza, dlugosc: 100, szerokosc: 100 },
    ];
    const w = policzRozkroj(lista);
    const ulozonych = w.arkusze.reduce((s, a) => s + a.sztuki.length, 0);
    const odrzuconychSztuk = w.odrzucone.reduce((s, f) => s + f.sztuk, 0);
    expect(ulozonych + odrzuconychSztuk).toBe(7);
  });

  it("każda ułożona sztuka mieści się w obrysie także przy wielu arkuszach", () => {
    const w = policzRozkroj([{ ...baza, dlugosc: 1200, szerokosc: 900, sztuk: 20 }]);
    expect(w.arkuszy).toBeGreaterThan(1);
    for (const ark of w.arkusze) {
      for (const s of ark.sztuki) {
        expect(s.x + s.dlugosc).toBeLessThanOrEqual(rozkroj.plyta.szerokosc);
        expect(s.y + s.szerokosc).toBeLessThanOrEqual(rozkroj.plyta.wysokosc);
      }
    }
  });
});
