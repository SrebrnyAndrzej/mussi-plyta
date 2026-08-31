import { describe, expect, it } from "vitest";
import {
  PROG_KOMPLETNOSCI,
  podsumujPrzyjecie,
  przyjmijStany,
  walidujPozycje,
  type PaczkaStanow,
} from "@/lib/stany-przyjecie";

const obecne = [
  { sku: "A", stanSystemowy: 10, rezerwacje: 2 },
  { sku: "B", stanSystemowy: 5, rezerwacje: 0 },
  { sku: "C", stanSystemowy: 100, rezerwacje: 40 },
  { sku: "D", stanSystemowy: 7, rezerwacje: 1 },
];

function paczka(n: Partial<PaczkaStanow> = {}): PaczkaStanow {
  return {
    zrodlo: "streamsoft-pro",
    wygenerowano: "2026-08-31T09:00:00.000Z",
    partia: "p-001",
    pozycje: [
      { sku: "A", stan: 12, rezerwacje: 2 },
      { sku: "B", stan: 5, rezerwacje: 0 },
      { sku: "C", stan: 90, rezerwacje: 40 },
      { sku: "D", stan: 7, rezerwacje: 1 },
    ],
    ...n,
  };
}

describe("walidacja pojedynczej pozycji", () => {
  it("przepuszcza poprawną", () => {
    expect(walidujPozycje({ sku: "A", stan: 3, rezerwacje: 0 })).toBeNull();
  });

  it("dopuszcza ułamki, bo obrzeża idą na metry", () => {
    expect(walidujPozycje({ sku: "OB", stan: 12.5, rezerwacje: 0.5 })).toBeNull();
  });

  it("odrzuca brak indeksu, wartości nieliczbowe i ujemne", () => {
    expect(walidujPozycje({ sku: "", stan: 1, rezerwacje: 0 })?.powod).toContain("Brak indeksu");
    expect(walidujPozycje({ sku: "A", stan: "12", rezerwacje: 0 })?.powod).toContain("nie jest liczbą");
    expect(walidujPozycje({ sku: "A", stan: -1, rezerwacje: 0 })?.powod).toContain("ujemne");
    expect(walidujPozycje({ sku: "A", stan: Number.NaN, rezerwacje: 0 })?.powod).toContain("nie jest liczbą");
  });
});

describe("przyjęcie poprawnej paczki", () => {
  it("wykrywa tylko realne zmiany", () => {
    const w = przyjmijStany(paczka(), obecne);
    if (!w.ok) throw new Error(w.blad);
    expect(w.zmiany.map((z) => z.sku)).toEqual(["A", "C"]);
    expect(w.bezZmian).toBe(2);
  });

  it("nie mutuje stanu wejściowego", () => {
    przyjmijStany(paczka(), obecne);
    expect(obecne[0].stanSystemowy).toBe(10);
  });

  it("zgłasza indeksy, których nie znamy, zamiast je dodawać po cichu", () => {
    const w = przyjmijStany(
      paczka({ pozycje: [...paczka().pozycje, { sku: "NOWY", stan: 4, rezerwacje: 0 }] }),
      obecne,
    );
    if (!w.ok) throw new Error(w.blad);
    expect(w.nieznane).toEqual(["NOWY"]);
  });

  it("odrzuca powtórzony indeks w jednej paczce", () => {
    const w = przyjmijStany(
      paczka({ pozycje: [...paczka().pozycje, { sku: "A", stan: 999, rezerwacje: 0 }] }),
      obecne,
    );
    if (!w.ok) throw new Error(w.blad);
    expect(w.odrzucone[0]).toMatchObject({ sku: "A", powod: "Indeks powtórzony w paczce." });
    /* Pierwsze wystąpienie zostaje, więc zmiana jest z pierwotnej wartości. */
    expect(w.zmiany.find((z) => z.sku === "A")?.stanPo).toBe(12);
  });

  it("zła pozycja nie psuje całej paczki", () => {
    const w = przyjmijStany(
      paczka({ pozycje: [...paczka().pozycje, { sku: "ZLY", stan: -5, rezerwacje: 0 }] }),
      obecne,
    );
    if (!w.ok) throw new Error(w.blad);
    expect(w.zmiany).toHaveLength(2);
    expect(w.odrzucone).toHaveLength(1);
  });
});

describe("awaria ma być głośna", () => {
  it("pusta paczka jest odrzucana jako zepsuty odczyt", () => {
    const w = przyjmijStany(paczka({ pozycje: [] }), obecne);
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.blad).toContain("zepsute zapytanie");
  });

  it("obcięty odczyt nie zeruje magazynu", () => {
    /* Jedna pozycja z czterech znanych to 25 procent, poniżej progu. */
    const w = przyjmijStany(paczka({ pozycje: [{ sku: "A", stan: 0, rezerwacje: 0 }] }), obecne);
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.blad).toContain("obcięty odczyt");
    expect(w.blad).toContain(`${Math.round(PROG_KOMPLETNOSCI * 100)}%`);
  });

  it("paczka na progu przechodzi", () => {
    const w = przyjmijStany(
      paczka({ pozycje: [{ sku: "A", stan: 1, rezerwacje: 0 }, { sku: "B", stan: 1, rezerwacje: 0 }] }),
      obecne,
    );
    expect(w.ok).toBe(true);
  });

  it("paczka bez identyfikatora partii jest odrzucana", () => {
    expect(przyjmijStany(paczka({ partia: "" }), obecne).ok).toBe(false);
  });

  it("ta sama partia nie jest stosowana dwa razy", () => {
    const w = przyjmijStany(paczka(), obecne, { ostatniaPartia: "p-001" });
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.blad).toContain("już przyjęta");
  });

  it("paczka z samymi błędnymi pozycjami jest odrzucana", () => {
    const w = przyjmijStany(
      paczka({ pozycje: [{ sku: "A", stan: -1, rezerwacje: 0 }, { sku: "", stan: 1, rezerwacje: 0 }] }),
      obecne,
    );
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.odrzucone).toHaveLength(2);
  });

  it("pierwsze uruchomienie bez znanych indeksów nie wpada w bramkę kompletności", () => {
    const w = przyjmijStany(paczka(), []);
    expect(w.ok).toBe(true);
  });
});

describe("podsumowanie dla operatora", () => {
  it("wskazuje największy skok stanu", () => {
    const p = podsumujPrzyjecie(przyjmijStany(paczka(), obecne));
    expect(p).not.toBeNull();
    expect(p!.zmienione).toBe(2);
    expect(p!.najwiekszySkok?.sku).toBe("C");
  });

  it("dla odmowy nie ma czego podsumowywać", () => {
    expect(podsumujPrzyjecie(przyjmijStany(paczka({ pozycje: [] }), obecne))).toBeNull();
  });
});
