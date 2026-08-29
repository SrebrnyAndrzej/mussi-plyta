import { describe, expect, it } from "vitest";

import { parseDelimited, parseMussiTable } from "@/lib/import-formats";

describe("parseMussiTable", () => {
  it("odczytuje rzeczywisty klucz Mussi i dziedziczy oznaczenie płyty", () => {
    const result = parseMussiTable([
      ["Lp.", "Oznaczenie(np. frez)", "", "Długość", "Szerokość ", "Ilość", "słoje", "Okleina"],
      ["", "", "x", "", "", "", "", ""],
      ["1", "5981 bs", "", "2500", "505", "2", "", "1010"],
      ["2", "", "", "628", "505", "10", "X", "1000"],
      ["3", "", "", "400", "505", "2", "", "0"],
      ["4", "", "", "", "", "", "", ""],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toMatchObject({
      sourceRow: 3,
      dekor: "5981 bs",
      dlugosc: 2500,
      szerokosc: 505,
      sztuk: 2,
      obrzeze: [1, 0, 1, 0],
      sloje: false,
    });
    expect(result.rows[1]).toMatchObject({ dekor: "5981 bs", sloje: true, obrzeze: [1, 0, 0, 0] });
    expect(result.rows[2]).toMatchObject({ dekor: "5981 bs", obrzeze: [0, 0, 0, 0] });
  });

  it("znajduje nagłówek po pustych wierszach i raportuje tylko niepełne formatki", () => {
    const result = parseMussiTable([
      [],
      ["notatka"],
      ["DEKOR", "DŁUGOŚĆ", "SZEROKOŚĆ", "SZTUK", "OBRZEŻE", "SŁOJE"],
      ["K003 PW", "720", "560", "8", "1110", "T"],
      ["", "720", "", "2", "0000", ""],
      [],
    ]);

    expect(result.rows).toHaveLength(1);
    expect(result.errors).toEqual(["Wiersz 5: długość, szerokość i liczba sztuk muszą być większe od zera."]);
  });
});

describe("parseDelimited", () => {
  it("obsługuje średniki oraz pola w cudzysłowach", () => {
    expect(parseDelimited('Oznaczenie;Długość;Szerokość;Ilość\n"K003; PW";720;560;2')).toEqual([
      ["Oznaczenie", "Długość", "Szerokość", "Ilość"],
      ["K003; PW", "720", "560", "2"],
    ]);
  });
});
