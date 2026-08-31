import { describe, expect, it } from "vitest";
import wektory from "../../../docs/wektory/zamowienie-csv.json";
import {
  MAKS_WIERSZY,
  parsujCsvZamowienia,
  zapiszCsvZamowienia,
  zweryfikujWobecKatalogu,
  type PozycjaKatalogu,
} from "@/lib/zamowienie-csv";

/**
 * Format CSV zamówienia.
 *
 * Te same wektory przechodzi implementacja w aplikacji Swift, dlatego
 * przypadki żyją w `docs/wektory/zamowienie-csv.json`, a nie w kodzie testu.
 * Dopisanie przypadku tutaj oznacza dopisanie go obu implementacjom.
 */

const katalog = wektory.katalog as PozycjaKatalogu[];

describe("wektory wspólne z implementacją w Swift", () => {
  for (const przypadek of wektory.przypadki) {
    it(przypadek.nazwa, () => {
      const wynik = parsujCsvZamowienia(przypadek.wejscie);
      const oczekiwane = przypadek.oczekiwane as Record<string, unknown>;

      expect(wynik.ok).toBe(oczekiwane.ok);
      expect(wynik.bledy.map((b) => b.kod)).toEqual(oczekiwane.kodyBledow);

      if (oczekiwane.pozycje) {
        expect(wynik.pozycje).toEqual(oczekiwane.pozycje);
      }
      if (oczekiwane.wierszeBledow) {
        expect(wynik.bledy.map((b) => b.wiersz)).toEqual(oczekiwane.wierszeBledow);
      }
      if (oczekiwane.scalone) {
        expect(wynik.scalone).toEqual(oczekiwane.scalone);
      }
    });
  }
});

describe("wektory sprawdzenia wobec asortymentu", () => {
  for (const przypadek of wektory.przypadkiKatalogowe) {
    it(przypadek.nazwa, () => {
      const { pozycje } = parsujCsvZamowienia(przypadek.wejscie);
      const bledy = zweryfikujWobecKatalogu(pozycje, katalog);
      expect(bledy.map((b) => b.kod)).toEqual(przypadek.oczekiwaneKodyBledow);
    });
  }
});

describe("granice pliku", () => {
  it("tysiąc wierszy przechodzi", () => {
    const wiersze = Array.from({ length: MAKS_WIERSZY }, () => "BLU-CLIP-110;1").join("\n");
    expect(parsujCsvZamowienia(`indeks;ilosc\n${wiersze}`).ok).toBe(true);
  });

  it("wiersz ponad limit odrzuca cały plik", () => {
    const wiersze = Array.from({ length: MAKS_WIERSZY + 1 }, () => "BLU-CLIP-110;1").join("\n");
    const wynik = parsujCsvZamowienia(`indeks;ilosc\n${wiersze}`);
    expect(wynik.ok).toBe(false);
    expect(wynik.bledy[0].kod).toBe("za-duzo-wierszy");
  });
});

describe("zapis jest odwrotnością odczytu", () => {
  it("plik z naszego zapisu przechodzi przez nasz odczyt", () => {
    const csv = zapiszCsvZamowienia([
      { indeks: "BLU-CLIP-110", ilosc: 12, jednostka: "szt" },
      { indeks: "OBR-ABS-1180", ilosc: 12.5, jednostka: "mb", uwagi: "dobrać do dekoru" },
    ]);
    const wynik = parsujCsvZamowienia(csv);

    expect(wynik.ok).toBe(true);
    expect(wynik.pozycje.map((p) => [p.indeks, p.ilosc, p.jednostka])).toEqual([
      ["BLU-CLIP-110", 12, "szt"],
      ["OBR-ABS-1180", 12.5, "mb"],
    ]);
    expect(zweryfikujWobecKatalogu(wynik.pozycje, katalog)).toEqual([]);
  });

  it("średnik i cudzysłów w uwagach przeżywają obieg", () => {
    const uwagi = 'pilne; pas 22" na piątek';
    const csv = zapiszCsvZamowienia([{ indeks: "BLU-CLIP-110", ilosc: 1, uwagi }]);
    expect(parsujCsvZamowienia(csv).pozycje[0].uwagi).toBe(uwagi);
  });

  it("ułamek zapisujemy z kropką, żeby plik czytał się poza polskim ustawieniem", () => {
    expect(zapiszCsvZamowienia([{ indeks: "A", ilosc: 12.5 }])).toContain("A;12.5;");
  });
});
