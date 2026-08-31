import { describe, expect, it } from "vitest";
import type { Akcesorium } from "@/data/akcesoria";
import { akcesoria } from "@/data/akcesoria";
import {
  dostepnoscAkcesorium,
  filtrujAkcesoria,
  jakoProduktKoszyka,
  policzWKategoriach,
  producenci,
  sortujAkcesoria,
  uprosc,
} from "@/lib/sklep-akcesoriow";

/**
 * Sklep akcesoriów.
 *
 * Sprzedaż idzie po indeksie, więc najwięcej pułapek siedzi w wyszukiwaniu
 * i w tym, co uznajemy za dostępne. Rezerwacje bywają większe niż stan,
 * a stan minimalny to próg zamówienia u dostawcy, nie granica sprzedaży.
 */

function pozycja(nadpisz: Partial<Akcesorium> = {}): Akcesorium {
  return {
    sku: "TST-1",
    nazwa: "Zawias testowy",
    producent: "Amix",
    kategoria: "okucia",
    jednostka: "szt",
    cena: 10,
    stanSystemowy: 100,
    rezerwacje: 0,
    stanMinimalny: 40,
    ...nadpisz,
  };
}

describe("dostępność liczy się ze stanu wolnego", () => {
  it("pełny zapas to dostępność na stanie", () => {
    expect(dostepnoscAkcesorium(pozycja())).toBe("na-stanie");
  });

  it("rezerwacje zjadają stan", () => {
    expect(dostepnoscAkcesorium(pozycja({ stanSystemowy: 100, rezerwacje: 100 }))).toBe(
      "na-zamowienie",
    );
  });

  it("rezerwacje większe niż stan nie robią z ujemnej liczby dostępności", () => {
    /* Tak wygląda BLU-TAND-500 w danych: stan 0, rezerwacje 4. */
    expect(dostepnoscAkcesorium(pozycja({ stanSystemowy: 0, rezerwacje: 4 }))).toBe(
      "na-zamowienie",
    );
  });

  it("resztka zapasu to ostatnie sztuki", () => {
    expect(dostepnoscAkcesorium(pozycja({ stanSystemowy: 9, stanMinimalny: 40 }))).toBe(
      "ostatnie-sztuki",
    );
  });

  it("stan poniżej progu zamówienia to nadal pełna sprzedaż", () => {
    /* Próg dostawcy pilnuje zakupów, nie sprzedaży. 460 mb obrzeża
       przy minimum 400 musi się klientowi pokazać jako dostępne. */
    expect(
      dostepnoscAkcesorium(pozycja({ stanSystemowy: 640, rezerwacje: 180, stanMinimalny: 400 })),
    ).toBe("na-stanie");
  });
});

describe("wyszukiwanie wybacza ogonki", () => {
  it("upraszcza polskie znaki", () => {
    expect(uprosc("Złączki Häfele")).toBe("zlaczki hafele");
  });

  it("hafele bez ogonków znajduje Häfele", () => {
    const lista = [pozycja({ sku: "HAF-1", producent: "Häfele" }), pozycja({ sku: "AMX-1" })];
    expect(filtrujAkcesoria(lista, { fraza: "hafele" }).map((a) => a.sku)).toEqual(["HAF-1"]);
  });

  it("słowa mogą być w dowolnej kolejności", () => {
    const lista = [
      pozycja({ sku: "BLU-500", nazwa: "Prowadnica Blum Tandem 500 mm", producent: "Blum" }),
      pozycja({ sku: "BLU-450", nazwa: "Prowadnica Blum Tandem 450 mm", producent: "Blum" }),
    ];
    expect(filtrujAkcesoria(lista, { fraza: "500 blum" }).map((a) => a.sku)).toEqual(["BLU-500"]);
  });

  it("szuka też po indeksie", () => {
    const lista = [pozycja({ sku: "AMX-SB11-HD-450" }), pozycja({ sku: "GTV-LED-ZAS-60" })];
    expect(filtrujAkcesoria(lista, { fraza: "sb11" }).map((a) => a.sku)).toEqual([
      "AMX-SB11-HD-450",
    ]);
  });

  it("pusta fraza nie zawęża niczego", () => {
    const lista = [pozycja({ sku: "A" }), pozycja({ sku: "B" })];
    expect(filtrujAkcesoria(lista, { fraza: "   " })).toHaveLength(2);
  });
});

describe("filtry", () => {
  const lista = [
    pozycja({ sku: "A", kategoria: "okucia", producent: "Blum" }),
    pozycja({ sku: "B", kategoria: "szuflady", producent: "Amix" }),
    pozycja({ sku: "C", kategoria: "okucia", producent: "Amix", stanSystemowy: 0 }),
  ];

  it("kategoria zawęża listę", () => {
    expect(filtrujAkcesoria(lista, { kategoria: "okucia" }).map((a) => a.sku)).toEqual(["A", "C"]);
  });

  it("producent zawęża listę", () => {
    expect(filtrujAkcesoria(lista, { producent: "Amix" }).map((a) => a.sku)).toEqual(["B", "C"]);
  });

  it("filtry się składają", () => {
    expect(
      filtrujAkcesoria(lista, { kategoria: "okucia", producent: "Amix" }).map((a) => a.sku),
    ).toEqual(["C"]);
  });

  it("tylko dostępne ukrywa pozycje bez stanu", () => {
    expect(filtrujAkcesoria(lista, { tylkoDostepne: true }).map((a) => a.sku)).toEqual(["A", "B"]);
  });
});

describe("sortowanie", () => {
  const lista = [
    pozycja({ sku: "A", nazwa: "Zawias", cena: 30 }),
    pozycja({ sku: "B", nazwa: "Ćwiek", cena: 10, stanSystemowy: 0 }),
    pozycja({ sku: "C", nazwa: "Aluminium", cena: 20 }),
  ];

  it("po cenie rosnąco", () => {
    expect(sortujAkcesoria(lista, "cena-rosnaco").map((a) => a.cena)).toEqual([10, 20, 30]);
  });

  it("po cenie malejąco", () => {
    expect(sortujAkcesoria(lista, "cena-malejaco").map((a) => a.cena)).toEqual([30, 20, 10]);
  });

  it("po nazwie z polskim alfabetem", () => {
    expect(sortujAkcesoria(lista, "nazwa").map((a) => a.nazwa)).toEqual([
      "Aluminium",
      "Ćwiek",
      "Zawias",
    ]);
  });

  it("dostępne przed brakami", () => {
    expect(sortujAkcesoria(lista, "dostepnosc").map((a) => a.sku)).toEqual(["C", "A", "B"]);
  });

  it("nie rusza listy wejściowej", () => {
    const wejscie = [...lista];
    sortujAkcesoria(wejscie, "cena-rosnaco");
    expect(wejscie.map((a) => a.sku)).toEqual(["A", "B", "C"]);
  });
});

describe("tłumaczenie na język koszyka", () => {
  it("indeksem pozycji jest SKU, żeby link ze sklepu trafił w koszyk", () => {
    const produkt = jakoProduktKoszyka(pozycja({ sku: "BLU-CLIP-110", cena: 14.9 }));
    expect(produkt.id).toBe("BLU-CLIP-110");
    expect(produkt.kod).toBe("BLU-CLIP-110");
    expect(produkt.kategoria).toBe("akcesorium");
    expect(produkt.cenaKatalogowa).toBe(14.9);
  });

  it("dostępność jest przeliczona, a nie przepisana ze stanu", () => {
    expect(jakoProduktKoszyka(pozycja({ stanSystemowy: 5, rezerwacje: 5 })).dostepnosc).toBe(
      "na-zamowienie",
    );
  });
});

describe("prawdziwy asortyment", () => {
  it("każdy indeks występuje tylko raz", () => {
    const skuki = akcesoria.map((a) => a.sku);
    expect(new Set(skuki).size).toBe(skuki.length);
  });

  it("liczby w kategoriach sumują się do całego asortymentu", () => {
    const licznik = policzWKategoriach(akcesoria);
    const suma = Object.values(licznik).reduce((a, b) => a + b, 0);
    expect(suma).toBe(akcesoria.length);
  });

  it("lista producentów nie ma powtórzeń", () => {
    const lista = producenci(akcesoria);
    expect(new Set(lista).size).toBe(lista.length);
  });

  it("sklep ma realny asortyment, nie garść przykładów", () => {
    expect(akcesoria.length).toBeGreaterThan(50);
  });
});
