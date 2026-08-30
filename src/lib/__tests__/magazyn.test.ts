import { describe, expect, it } from "vitest";
import type { Akcesorium } from "@/data/akcesoria";
import { akcesoria } from "@/data/akcesoria";
import {
  doZamowienia, dostepne, podsumujMagazyn, stanPozycji, zastosujKorekte,
} from "@/lib/magazyn";

const poz: Akcesorium = {
  sku: "TEST-1", nazwa: "Zawias testowy", producent: "Blum", kategoria: "okucia",
  jednostka: "szt", cena: 10, stanSystemowy: 100, rezerwacje: 30, stanMinimalny: 50,
};
const korekta = { sku: "TEST-1", powod: "inwentaryzacja" as const, autor: "biuro" };

describe("stan pozycji", () => {
  it("dostępne to dokumenty minus rezerwacje", () => {
    expect(dostepne(poz)).toBe(70);
  });
  it("zgodne, gdy dostępne pokrywa minimum", () => {
    expect(stanPozycji(poz)).toBe("zgodne");
  });
  it("poniżej minimum, gdy dostępne spada pod próg", () => {
    expect(stanPozycji({ ...poz, stanSystemowy: 60 })).toBe("ponizej-minimum");
  });
  it("brak, gdy rezerwacje zjadają cały stan", () => {
    expect(stanPozycji({ ...poz, stanSystemowy: 30 })).toBe("brak");
  });
  it("liczy, ile domówić do minimum", () => {
    expect(doZamowienia({ ...poz, stanSystemowy: 60 })).toBe(20);
    expect(doZamowienia(poz)).toBe(0);
  });
});

describe("ręczna korekta stanu", () => {
  it("tryb ustaw nadpisuje stan i zapisuje różnicę", () => {
    const w = zastosujKorekte(poz, { ...korekta, tryb: "ustaw", wartosc: 120 });
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    expect(w.pozycja.stanSystemowy).toBe(120);
    expect(w.wpis.przed).toBe(100);
    expect(w.wpis.roznica).toBe(20);
  });

  it("tryb zmien dodaje i odejmuje", () => {
    const plus = zastosujKorekte(poz, { ...korekta, tryb: "zmien", wartosc: 25 });
    const minus = zastosujKorekte(poz, { ...korekta, tryb: "zmien", wartosc: -25 });
    expect(plus.ok && plus.pozycja.stanSystemowy).toBe(125);
    expect(minus.ok && minus.pozycja.stanSystemowy).toBe(75);
  });

  it("nie pozwala zejść poniżej rezerwacji", () => {
    const w = zastosujKorekte(poz, { ...korekta, tryb: "ustaw", wartosc: 20 });
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.blad).toContain("rezerwacji");
  });

  it("nie pozwala na stan ujemny", () => {
    const w = zastosujKorekte(poz, { ...korekta, tryb: "zmien", wartosc: -500 });
    expect(w.ok).toBe(false);
  });

  it("odrzuca zmianę o zero i brak zmiany", () => {
    expect(zastosujKorekte(poz, { ...korekta, tryb: "zmien", wartosc: 0 }).ok).toBe(false);
    expect(zastosujKorekte(poz, { ...korekta, tryb: "ustaw", wartosc: 100 }).ok).toBe(false);
  });

  it("odrzuca wartości niecałkowite i nieliczbowe", () => {
    expect(zastosujKorekte(poz, { ...korekta, tryb: "ustaw", wartosc: 12.5 }).ok).toBe(false);
    expect(zastosujKorekte(poz, { ...korekta, tryb: "ustaw", wartosc: NaN }).ok).toBe(false);
  });

  it("nie mutuje pozycji wejściowej", () => {
    const kopia = { ...poz };
    zastosujKorekte(poz, { ...korekta, tryb: "ustaw", wartosc: 200 });
    expect(poz).toEqual(kopia);
  });

  it("wpis historii niesie powód, autora i notatkę", () => {
    const w = zastosujKorekte(poz, {
      ...korekta, tryb: "zmien", wartosc: 10, powod: "dostawa", notatka: "  WZ 4471  ",
    });
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    expect(w.wpis.powod).toBe("dostawa");
    expect(w.wpis.autor).toBe("biuro");
    expect(w.wpis.notatka).toBe("WZ 4471");
  });
});

describe("podsumowanie magazynu", () => {
  it("liczy pozycje, braki i wartość na prawdziwym asortymencie", () => {
    const p = podsumujMagazyn(akcesoria);
    expect(p.pozycji).toBe(akcesoria.length);
    expect(p.brakow).toBeGreaterThan(0);
    expect(p.wartoscNetto).toBeGreaterThan(0);
  });

  it("pusty magazyn daje zera zamiast NaN", () => {
    const p = podsumujMagazyn([]);
    expect(p).toEqual({ pozycji: 0, ponizejMinimum: 0, brakow: 0, wartoscNetto: 0 });
  });
});
