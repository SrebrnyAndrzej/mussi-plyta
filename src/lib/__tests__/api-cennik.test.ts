import { describe, expect, it } from "vitest";
import type { Akcesorium } from "@/data/akcesoria";
import type { Dekor } from "@/data/dekory";
import { cennikDlaKontrahenta } from "@/lib/api-cennik";
import type { CenaIndywidualna, Cennik } from "@/lib/warunki";

/**
 * Cennik wystawiany przez API.
 *
 * Dwie rzeczy, których nie wolno tu zepsuć: kolejność źródeł ceny
 * i to, żeby przez API nie wyciekły liczby ze stanu magazynu.
 */

const DZIEN = new Date("2026-09-15T09:00:00Z");

const plyta: Dekor = {
  id: "p1",
  kod: "H1180 ST37",
  nazwa: "Dąb Halifax",
  producent: "Egger",
  kategoria: "plyta",
  opis: "Struktura drewna",
  grubosciMm: [18],
  cenaKatalogowa: 200,
  jednostka: "arkusz",
  dostepnosc: "na-stanie",
  probka: "",
};

const akcesorium: Akcesorium = {
  sku: "BLU-CLIP-110",
  nazwa: "Zawias Blum Clip Top",
  producent: "Blum",
  kategoria: "okucia",
  jednostka: "szt",
  cena: 100,
  stanSystemowy: 500,
  rezerwacje: 100,
  stanMinimalny: 120,
};

const cennikWrzesien: Cennik = {
  id: "2026-wrzesien",
  nazwa: "Cennik od września",
  obowiazujeOd: "2026-09-01",
  obowiazujeDo: null,
  ceny: {},
};

function wywolaj(opcje: {
  kodProgu?: string;
  cenniki?: Cennik[];
  indywidualne?: CenaIndywidualna[];
  akcesoria?: Akcesorium[];
}) {
  return cennikDlaKontrahenta(
    { id: "K-00128", kodProgu: opcje.kodProgu ?? "B2" },
    {
      plyty: [plyta],
      akcesoria: opcje.akcesoria ?? [akcesorium],
      cenniki: opcje.cenniki ?? [cennikWrzesien],
      indywidualne: opcje.indywidualne ?? [],
    },
    DZIEN,
  );
}

describe("kolejność źródeł ceny", () => {
  it("cena uzgodniona indywidualnie bije próg rabatowy", () => {
    const { pozycje } = wywolaj({
      indywidualne: [
        {
          kontrahent: "K-00128",
          sku: "BLU-CLIP-110",
          cena: 74.5,
          obowiazujeOd: "2026-06-01",
          obowiazujeDo: null,
        },
      ],
    });
    const p = pozycje.find((x) => x.indeks === "BLU-CLIP-110")!;
    expect(p.cenaNetto).toBe(74.5);
    expect(p.zrodloCeny).toBe("indywidualna");
    expect(p.rabat).toBe(0);
  });

  it("cena indywidualna innej firmy nas nie dotyczy", () => {
    const { pozycje } = wywolaj({
      indywidualne: [
        {
          kontrahent: "K-00074",
          sku: "BLU-CLIP-110",
          cena: 1,
          obowiazujeOd: "2026-06-01",
          obowiazujeDo: null,
        },
      ],
    });
    expect(pozycje.find((x) => x.indeks === "BLU-CLIP-110")!.zrodloCeny).toBe("prog");
  });

  it("cena indywidualna po terminie przestaje obowiązywać", () => {
    const { pozycje } = wywolaj({
      indywidualne: [
        {
          kontrahent: "K-00128",
          sku: "BLU-CLIP-110",
          cena: 1,
          obowiazujeOd: "2026-01-01",
          obowiazujeDo: "2026-08-31",
        },
      ],
    });
    expect(pozycje.find((x) => x.indeks === "BLU-CLIP-110")!.zrodloCeny).toBe("prog");
  });

  it("cennik handlowy nadpisuje cenę z karty produktu", () => {
    const { pozycje } = wywolaj({
      cenniki: [{ ...cennikWrzesien, ceny: { "BLU-CLIP-110": 50 } }],
      kodProgu: "B1",
    });
    expect(pozycje.find((x) => x.indeks === "BLU-CLIP-110")!.cenaKatalogowaNetto).toBe(50);
  });
});

describe("wygaśnięcie cennika handlowego nie zostawia API bez cen", () => {
  it("bez obowiązującego cennika ceny pochodzą z kart produktów", () => {
    const { cennikHandlowy, pozycje } = wywolaj({
      cenniki: [{ ...cennikWrzesien, obowiazujeOd: "2027-01-01" }],
      kodProgu: "B1",
    });
    expect(cennikHandlowy).toBeNull();
    /* Klient ma widzieć, że żaden cennik handlowy nie obowiązuje,
       ale ceny dostaje mimo to: podstawą jest wtedy karta produktu,
       od której nadal schodzi rabat progowy. */
    const p = pozycje.find((x) => x.indeks === "BLU-CLIP-110")!;
    expect(p.cenaKatalogowaNetto).toBe(100);
    expect(p.zrodloCeny).toBe("prog");
  });

  it("obowiązujący cennik jest nazwany wprost", () => {
    expect(wywolaj({}).cennikHandlowy).toMatchObject({ id: "2026-wrzesien" });
  });
});

describe("stan magazynu nie wychodzi przez API", () => {
  it("pozycja niesie etykietę, a nie liczby", () => {
    const p = wywolaj({}).pozycje.find((x) => x.indeks === "BLU-CLIP-110")!;
    expect(p.dostepnosc).toBe("na-stanie");
    expect(p).not.toHaveProperty("stanSystemowy");
    expect(p).not.toHaveProperty("rezerwacje");
    expect(p).not.toHaveProperty("stanMinimalny");
  });

  it("żadna pozycja nie przemyca pól ze stanu", () => {
    const zakazane = ["stanSystemowy", "rezerwacje", "stanMinimalny", "cena"];
    for (const p of wywolaj({}).pozycje) {
      for (const pole of zakazane) expect(p).not.toHaveProperty(pole);
    }
  });

  it("brak pokrycia to etykieta na zamówienie", () => {
    const { pozycje } = wywolaj({
      akcesoria: [{ ...akcesorium, stanSystemowy: 10, rezerwacje: 10 }],
    });
    expect(pozycje.find((x) => x.indeks === "BLU-CLIP-110")!.dostepnosc).toBe("na-zamowienie");
  });
});

describe("asortyment", () => {
  it("płyty i akcesoria trafiają do jednej listy, każde ze swoim indeksem", () => {
    const { pozycje } = wywolaj({});
    expect(pozycje.map((p) => [p.rodzaj, p.indeks])).toEqual([
      ["plyta", "H1180 ST37"],
      ["akcesorium", "BLU-CLIP-110"],
    ]);
  });

  it("próg rabatowy schodzi z ceny katalogowej", () => {
    const p = wywolaj({}).pozycje.find((x) => x.indeks === "H1180 ST37")!;
    expect(p.cenaKatalogowaNetto).toBe(200);
    expect(p.cenaNetto).toBeLessThan(200);
    expect(p.rabat).toBeGreaterThan(0);
  });
});
