import { describe, expect, it } from "vitest";
import { parseMussiTable } from "@/lib/import-formats";

/**
 * Obrzeże z pliku klienta.
 *
 * Regresja, od której zaczęły się te testy: pojedyncza wartość była dopełniana
 * zerami z lewej, więc "2" dawało obrzeże wyłącznie na prawej krawędzi.
 * Plik wyglądał na zaimportowany, a metry oklejania i wycena były zaniżone.
 */

const NAGLOWEK = ["lp", "dekor", "grubosc", "dlugosc", "szerokosc", "sztuk", "sloje", "obrzeze"];

function obrzezeZ(zapis: string) {
  const wynik = parseMussiTable([
    NAGLOWEK,
    ["1", "5981 bs", "18", "600", "400", "1", "", zapis],
  ]);
  return { obrzeze: wynik.rows[0]?.obrzeze, bledy: wynik.errors };
}

describe("notacja hurtowni zostaje bez zmian", () => {
  it("maska czterech cyfr działa jak dotąd", () => {
    expect(obrzezeZ("1010").obrzeze).toEqual([1, 0, 1, 0]);
    expect(obrzezeZ("1000").obrzeze).toEqual([1, 0, 0, 0]);
    expect(obrzezeZ("0000").obrzeze).toEqual([0, 0, 0, 0]);
  });

  it("maska z separatorem też", () => {
    expect(obrzezeZ("1-1-1-0").obrzeze).toEqual([1, 1, 1, 0]);
    expect(obrzezeZ("1/0/1/0").obrzeze).toEqual([1, 0, 1, 0]);
  });

  it("puste pole to brak obrzeża", () => {
    expect(obrzezeZ("").obrzeze).toEqual([0, 0, 0, 0]);
  });
});

describe("pojedyncza wartość znaczy dookoła, nie jedną krawędź", () => {
  it("dwójka okleja cztery krawędzie", () => {
    expect(obrzezeZ("2").obrzeze).toEqual([2, 2, 2, 2]);
  });

  it("jednostka nie przeszkadza", () => {
    expect(obrzezeZ("2 mm").obrzeze).toEqual([2, 2, 2, 2]);
    expect(obrzezeZ("2mm").obrzeze).toEqual([2, 2, 2, 2]);
  });

  it("grubość ułamkowa przechodzi, z przecinkiem i z kropką", () => {
    expect(obrzezeZ("0,8").obrzeze).toEqual([0.8, 0.8, 0.8, 0.8]);
    expect(obrzezeZ("0.8").obrzeze).toEqual([0.8, 0.8, 0.8, 0.8]);
  });

  it("zero to nadal brak obrzeża", () => {
    expect(obrzezeZ("0").obrzeze).toEqual([0, 0, 0, 0]);
  });
});

describe("dwie wartości: wzdłuż i w poprzek", () => {
  it("pierwsza idzie na górę i dół, druga na boki", () => {
    expect(obrzezeZ("2/1").obrzeze).toEqual([2, 2, 1, 1]);
    expect(obrzezeZ("2 1").obrzeze).toEqual([2, 2, 1, 1]);
  });
});

describe("zapis słowny", () => {
  it("tak okleja dookoła domyślną grubością", () => {
    expect(obrzezeZ("tak").obrzeze).toEqual([1, 1, 1, 1]);
    expect(obrzezeZ("TAK").obrzeze).toEqual([1, 1, 1, 1]);
  });

  it("nie i brak znaczą zero", () => {
    expect(obrzezeZ("nie").obrzeze).toEqual([0, 0, 0, 0]);
    expect(obrzezeZ("brak").obrzeze).toEqual([0, 0, 0, 0]);
  });
});

describe("niejednoznaczne wejście jest zgłaszane, nie zgadywane", () => {
  it("trzy wartości kończą się błędem wiersza", () => {
    const { obrzeze, bledy } = obrzezeZ("1/1/2");
    expect(obrzeze).toBeUndefined();
    expect(bledy.length).toBeGreaterThan(0);
  });

  it("pięć wartości też", () => {
    expect(obrzezeZ("1/1/1/1/1").obrzeze).toBeUndefined();
  });

  it("tekst, którego nie rozumiemy, nie udaje zera", () => {
    expect(obrzezeZ("wg rysunku").obrzeze).toBeUndefined();
    expect(obrzezeZ("D2 G1").obrzeze).toBeUndefined();
  });
});
