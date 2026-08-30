import { describe, expect, it } from "vitest";
import {
  dostepneDoSprzedazy,
  podsumujRezerwacje,
  utwardz,
  wydaj,
  wygasPrzeterminowane,
  zarezerwowane,
  zarezerwuj,
  zwolnij,
  type Rezerwacja,
} from "@/lib/rezerwacje";

const TERAZ = new Date("2026-08-30T10:00:00");
const stany = { "BLU-500": 12, "GTV-LED-3": 40, "HAF-Z110": 6 };

function zarezerwujKoszyk(
  lista: Rezerwacja[],
  zamowienie: string,
  pozycje: Array<{ sku: string; nazwa: string; ilosc: number }>,
  teraz = TERAZ,
  twarda = false,
) {
  return zarezerwuj(lista, { zamowienie, pozycje, stany, twarda }, teraz);
}

describe("liczenie dostępności", () => {
  it("bez rezerwacji dostępne jest całe zamówienie", () => {
    expect(dostepneDoSprzedazy("BLU-500", 12, [], TERAZ)).toBe(12);
  });

  it("aktywna rezerwacja zdejmuje towar ze sprzedaży", () => {
    const wynik = zarezerwujKoszyk([], "M-1", [{ sku: "BLU-500", nazwa: "Prowadnica", ilosc: 5 }]);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(zarezerwowane("BLU-500", wynik.rezerwacje, TERAZ)).toBe(5);
    expect(dostepneDoSprzedazy("BLU-500", 12, wynik.rezerwacje, TERAZ)).toBe(7);
  });

  it("rezerwacja po terminie przestaje blokować towar", () => {
    const wynik = zarezerwujKoszyk([], "M-1", [{ sku: "BLU-500", nazwa: "Prowadnica", ilosc: 5 }]);
    if (!wynik.ok) throw new Error(wynik.blad);
    const pozniej = new Date("2026-09-01T10:00:00");
    expect(zarezerwowane("BLU-500", wynik.rezerwacje, pozniej)).toBe(0);
    expect(dostepneDoSprzedazy("BLU-500", 12, wynik.rezerwacje, pozniej)).toBe(12);
  });
});

describe("ochrona przed podwójną sprzedażą", () => {
  it("drugie zamówienie nie dostaje towaru zabranego przez pierwsze", () => {
    const pierwsze = zarezerwujKoszyk([], "M-1", [{ sku: "HAF-Z110", nazwa: "Zawias", ilosc: 4 }]);
    if (!pierwsze.ok) throw new Error(pierwsze.blad);

    const drugie = zarezerwujKoszyk(pierwsze.rezerwacje, "M-2", [
      { sku: "HAF-Z110", nazwa: "Zawias", ilosc: 4 },
    ]);
    expect(drugie.ok).toBe(false);
    if (drugie.ok) return;
    expect(drugie.braki).toEqual([
      { sku: "HAF-Z110", nazwa: "Zawias", potrzeba: 4, dostepne: 2, brakuje: 2 },
    ]);
  });

  it("rezerwuje cały koszyk albo nic", () => {
    const wynik = zarezerwujKoszyk([], "M-1", [
      { sku: "BLU-500", nazwa: "Prowadnica", ilosc: 2 },
      { sku: "HAF-Z110", nazwa: "Zawias", ilosc: 99 },
    ]);
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    /* Prowadnica ma pokrycie, ale i tak nic nie zostaje zarezerwowane. */
    expect(wynik.braki.map((b) => b.sku)).toEqual(["HAF-Z110"]);
  });

  it("sumuje ten sam indeks występujący w koszyku dwa razy", () => {
    const wynik = zarezerwujKoszyk([], "M-1", [
      { sku: "HAF-Z110", nazwa: "Zawias", ilosc: 4 },
      { sku: "HAF-Z110", nazwa: "Zawias", ilosc: 4 },
    ]);
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.braki[0].potrzeba).toBe(8);
  });

  it("łączy powtórzony indeks w jedną rezerwację, gdy jest pokrycie", () => {
    const wynik = zarezerwujKoszyk([], "M-1", [
      { sku: "BLU-500", nazwa: "Prowadnica", ilosc: 3 },
      { sku: "BLU-500", nazwa: "Prowadnica", ilosc: 4 },
    ]);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.nowe).toHaveLength(1);
    expect(wynik.nowe[0].ilosc).toBe(7);
  });

  it("odrzuca ponowną rezerwację tego samego zamówienia", () => {
    const pierwsza = zarezerwujKoszyk([], "M-1", [{ sku: "BLU-500", nazwa: "Prowadnica", ilosc: 2 }]);
    if (!pierwsza.ok) throw new Error(pierwsza.blad);
    const druga = zarezerwujKoszyk(pierwsza.rezerwacje, "M-1", [
      { sku: "BLU-500", nazwa: "Prowadnica", ilosc: 1 },
    ]);
    expect(druga.ok).toBe(false);
  });

  it("odrzuca nieznany indeks zamiast rezerwować w ciemno", () => {
    const wynik = zarezerwujKoszyk([], "M-1", [{ sku: "NIE-MA", nazwa: "Widmo", ilosc: 1 }]);
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("NIE-MA");
  });

  it("odrzuca pusty koszyk i niepoprawne ilości", () => {
    expect(zarezerwujKoszyk([], "M-1", []).ok).toBe(false);
    expect(zarezerwujKoszyk([], "M-1", [{ sku: "BLU-500", nazwa: "P", ilosc: 0 }]).ok).toBe(false);
    expect(zarezerwujKoszyk([], "M-1", [{ sku: "BLU-500", nazwa: "P", ilosc: 1.5 }]).ok).toBe(false);
  });

  it("nie mutuje listy wejściowej", () => {
    const lista: Rezerwacja[] = [];
    zarezerwujKoszyk(lista, "M-1", [{ sku: "BLU-500", nazwa: "Prowadnica", ilosc: 2 }]);
    expect(lista).toHaveLength(0);
  });
});

describe("cykl życia rezerwacji", () => {
  const koszyk = [{ sku: "BLU-500", nazwa: "Prowadnica", ilosc: 5 }];

  it("miękka rezerwacja dostaje termin wygaśnięcia, twarda nie", () => {
    const miekka = zarezerwujKoszyk([], "M-1", koszyk);
    const twarda = zarezerwujKoszyk([], "M-2", koszyk, TERAZ, true);
    if (!miekka.ok || !twarda.ok) throw new Error("rezerwacja nieudana");
    expect(miekka.nowe[0].wygasa).toBe("2026-08-31T08:00:00.000Z");
    expect(twarda.nowe[0].wygasa).toBeNull();
  });

  it("potwierdzenie zamówienia utwardza rezerwację", () => {
    const wynik = zarezerwujKoszyk([], "M-1", koszyk);
    if (!wynik.ok) throw new Error(wynik.blad);
    const { rezerwacje, zmienione } = utwardz(wynik.rezerwacje, "M-1", TERAZ);
    expect(zmienione).toBe(1);
    expect(rezerwacje[0].wygasa).toBeNull();
    const dawno = new Date("2027-01-01T00:00:00");
    expect(zarezerwowane("BLU-500", rezerwacje, dawno)).toBe(5);
  });

  it("przeterminowane rezerwacje zamykają się i zostawiają wpis", () => {
    const wynik = zarezerwujKoszyk([], "M-1", koszyk);
    if (!wynik.ok) throw new Error(wynik.blad);
    const po = wygasPrzeterminowane(wynik.rezerwacje, new Date("2026-09-01T10:00:00"));
    expect(po.rezerwacje[0].stan).toBe("wygasla");
    expect(po.wpisy[0].zdarzenie).toBe("wygasla");
    expect(po.wpisy[0].powod).toContain("potwierdzenia");
  });

  it("nie rusza rezerwacji, którym czas jeszcze nie minął", () => {
    const wynik = zarezerwujKoszyk([], "M-1", koszyk);
    if (!wynik.ok) throw new Error(wynik.blad);
    const po = wygasPrzeterminowane(wynik.rezerwacje, new Date("2026-08-30T18:00:00"));
    expect(po.wpisy).toHaveLength(0);
    expect(po.rezerwacje[0].stan).toBe("aktywna");
  });

  it("zwolnienie oddaje towar do sprzedaży i zapisuje powód", () => {
    const wynik = zarezerwujKoszyk([], "M-1", koszyk);
    if (!wynik.ok) throw new Error(wynik.blad);
    const po = zwolnij(wynik.rezerwacje, "M-1", "Zamówienie anulowane przez klienta", TERAZ);
    expect(po.rezerwacje[0].stan).toBe("zwolniona");
    expect(po.wpisy[0].powod).toContain("anulowane");
    expect(dostepneDoSprzedazy("BLU-500", 12, po.rezerwacje, TERAZ)).toBe(12);
  });

  it("wydanie zamyka rezerwację", () => {
    const wynik = zarezerwujKoszyk([], "M-1", koszyk);
    if (!wynik.ok) throw new Error(wynik.blad);
    const po = wydaj(wynik.rezerwacje, "M-1", TERAZ);
    expect(po.rezerwacje[0].stan).toBe("wydana");
    expect(zarezerwowane("BLU-500", po.rezerwacje, TERAZ)).toBe(0);
  });

  it("po zwolnieniu towar wraca dla kolejnego zamówienia", () => {
    const pierwsze = zarezerwujKoszyk([], "M-1", [{ sku: "HAF-Z110", nazwa: "Zawias", ilosc: 6 }]);
    if (!pierwsze.ok) throw new Error(pierwsze.blad);
    const zwolnione = zwolnij(pierwsze.rezerwacje, "M-1", "Anulowane", TERAZ);
    const drugie = zarezerwujKoszyk(zwolnione.rezerwacje, "M-2", [
      { sku: "HAF-Z110", nazwa: "Zawias", ilosc: 6 },
    ]);
    expect(drugie.ok).toBe(true);
  });
});

describe("podsumowanie dla operatora", () => {
  it("liczy żywe rezerwacje i najbliższe wygaśnięcie", () => {
    const pierwsze = zarezerwujKoszyk([], "M-1", [{ sku: "BLU-500", nazwa: "Prowadnica", ilosc: 3 }]);
    if (!pierwsze.ok) throw new Error(pierwsze.blad);
    const drugie = zarezerwuj(pierwsze.rezerwacje, {
      zamowienie: "M-2",
      pozycje: [{ sku: "GTV-LED-3", nazwa: "Taśma LED", ilosc: 10 }],
      stany,
    }, new Date("2026-08-30T14:00:00"));
    if (!drugie.ok) throw new Error(drugie.blad);

    const p = podsumujRezerwacje(drugie.rezerwacje, new Date("2026-08-30T15:00:00"));
    expect(p.aktywne).toBe(2);
    expect(p.sztuk).toBe(13);
    expect(p.najblizszeWygasniecie).toBe("2026-08-31T08:00:00.000Z");
  });

  it("pomija rezerwacje zamknięte", () => {
    const wynik = zarezerwujKoszyk([], "M-1", [{ sku: "BLU-500", nazwa: "Prowadnica", ilosc: 3 }]);
    if (!wynik.ok) throw new Error(wynik.blad);
    const po = zwolnij(wynik.rezerwacje, "M-1", "Anulowane", TERAZ);
    expect(podsumujRezerwacje(po.rezerwacje, TERAZ).aktywne).toBe(0);
  });
});
