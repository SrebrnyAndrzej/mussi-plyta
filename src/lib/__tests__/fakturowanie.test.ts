import { describe, expect, it } from "vitest";
import { podmiotyFakturujace, type PodmiotFakturujacy } from "@/config/brief";
import {
  bledneDaneFormalne,
  brakujaceDaneFormalne,
  czyPodmiotGotowy,
  liczbaDokumentow,
  migawkaPodmiotu,
  numerDokumentu,
  odmienDokumenty,
  podzielNaDokumenty,
  poprawnyNip,
  poprawnyRachunek,
  sugerowanyPodzial,
  sugerujPodmiot,
  walidujWystawienie,
  zmienPodmiotPozycji,
  type PozycjaDokumentu,
  type Przypisania,
} from "@/lib/fakturowanie";

const pozycje: PozycjaDokumentu[] = [
  { id: "materialy", nazwa: "Płyty, blaty i fronty", kategoria: "materialy", netto: 6000 },
  { id: "obrzeza", nazwa: "Obrzeża", kategoria: "obrzeza", netto: 750 },
  { id: "akcesoria", nazwa: "Okucia i akcesoria", kategoria: "akcesoria", netto: 1900 },
  { id: "uslugi", nazwa: "Usługi stolarskie", kategoria: "uslugi", netto: 1350 },
];

/** Podmiot z kompletem danych, którego kartoteka jeszcze nie ma. */
function gotowyPodmiot(id: string): PodmiotFakturujacy {
  const bazowy = podmiotyFakturujace.find((p) => p.id === id)!;
  return {
    ...bazowy,
    nazwaPrawna: bazowy.nazwaPrawna ?? "Podmiot testowy Sp. z o.o.",
    nip: "9290000006",
    adres: bazowy.adres ?? "ul. Testowa 1, 65-001 Zielona Góra",
    rachunek: "PL61109010140000071219812874",
    seriaFaktury: "FV-T",
  };
}

describe("dane formalne podmiotu", () => {
  it("żaden podmiot w kartotece nie jest dziś gotowy do wystawienia dokumentu", () => {
    for (const p of podmiotyFakturujace) {
      expect(czyPodmiotGotowy(p)).toBe(false);
    }
  });

  it("wskazuje konkretne brakujące pola, a nie tylko fakt braku", () => {
    const plyty = podmiotyFakturujace.find((p) => p.id === "plyty")!;
    expect(brakujaceDaneFormalne(plyty)).toEqual(["NIP", "Rachunek bankowy", "Seria faktur"]);

    const akcesoria = podmiotyFakturujace.find((p) => p.id === "akcesoria")!;
    expect(brakujaceDaneFormalne(akcesoria)).toContain("Nazwa prawna");
    expect(brakujaceDaneFormalne(akcesoria)).toContain("Adres");
  });

  it("uznaje podmiot za gotowy dopiero po uzupełnieniu kompletu pól", () => {
    expect(czyPodmiotGotowy(gotowyPodmiot("plyty"))).toBe(true);
  });

  it("nie uznaje pustego ciągu za uzupełnione pole", () => {
    const pusty = { ...gotowyPodmiot("plyty"), nip: "   " };
    expect(czyPodmiotGotowy(pusty)).toBe(false);
    expect(brakujaceDaneFormalne(pusty)).toEqual(["NIP"]);
  });
});

describe("sugerowany podział", () => {
  it("kieruje materiały i obrzeża do podmiotu płytowego", () => {
    expect(sugerujPodmiot("materialy")).toBe("plyty");
    expect(sugerujPodmiot("obrzeza")).toBe("plyty");
  });

  it("kieruje akcesoria i usługi do właściwych podmiotów", () => {
    expect(sugerujPodmiot("akcesoria")).toBe("akcesoria");
    expect(sugerujPodmiot("uslugi")).toBe("stolarnia");
  });

  it("buduje komplet przypisań dla wszystkich pozycji", () => {
    expect(sugerowanyPodzial(pozycje)).toEqual({
      materialy: "plyty",
      obrzeza: "plyty",
      akcesoria: "akcesoria",
      uslugi: "stolarnia",
    });
  });
});

describe("podział na dokumenty", () => {
  const przypisania = sugerowanyPodzial(pozycje);

  it("tworzy jeden dokument na podmiot, który ma pozycje", () => {
    const dokumenty = podzielNaDokumenty(pozycje, przypisania);
    expect(dokumenty.map((d) => d.podmiot.id)).toEqual(["plyty", "akcesoria", "stolarnia"]);
  });

  it("nie tworzy dokumentu dla podmiotu bez pozycji", () => {
    const wszystkoNaPlyty: Przypisania = {
      materialy: "plyty", obrzeza: "plyty", akcesoria: "plyty", uslugi: "plyty",
    };
    const dokumenty = podzielNaDokumenty(pozycje, wszystkoNaPlyty);
    expect(dokumenty).toHaveLength(1);
    expect(dokumenty[0].netto).toBe(10000);
  });

  it("sumy dokumentów odtwarzają wartość zamówienia", () => {
    const dokumenty = podzielNaDokumenty(pozycje, przypisania);
    const suma = dokumenty.reduce((s, d) => s + d.netto, 0);
    expect(suma).toBe(10000);
  });

  it("liczy VAT i brutto osobno dla każdego podmiotu", () => {
    const plyty = podzielNaDokumenty(pozycje, przypisania)[0];
    expect(plyty.netto).toBe(6750);
    expect(plyty.vat).toBe(1552.5);
    expect(plyty.brutto).toBe(8302.5);
  });

  it("pomija pozycje bez przypisania zamiast zgadywać podmiot", () => {
    const niepelne: Przypisania = { materialy: "plyty" };
    const dokumenty = podzielNaDokumenty(pozycje, niepelne);
    expect(dokumenty).toHaveLength(1);
    expect(dokumenty[0].netto).toBe(6000);
  });

  it("zaokrągla groszowo, bez narastania błędu", () => {
    const drobne: PozycjaDokumentu[] = [
      { id: "a", nazwa: "A", kategoria: "materialy", netto: 0.015 },
      { id: "b", nazwa: "B", kategoria: "materialy", netto: 0.015 },
    ];
    const dokumenty = podzielNaDokumenty(drobne, { a: "plyty", b: "plyty" });
    expect(dokumenty[0].netto).toBe(0.03);
  });
});

describe("migawka i numeracja", () => {
  it("zapisuje na dokumencie dane rejestrowe z chwili wystawienia", () => {
    const migawka = migawkaPodmiotu(gotowyPodmiot("plyty"), "2026-08-30T10:00:00.000Z");
    expect(migawka.nip).toBe("9290000006");
    expect(migawka.kiedy).toBe("2026-08-30T10:00:00.000Z");
  });

  it("późniejsza zmiana kartoteki nie rusza wystawionej migawki", () => {
    const podmiot = gotowyPodmiot("plyty");
    const migawka = migawkaPodmiotu(podmiot);
    const poZmianie = { ...podmiot, nip: "0000000000" };
    expect(migawka.nip).toBe("9290000006");
    expect(poZmianie.nip).toBe("0000000000");
  });

  it("buduje numer w serii podmiotu", () => {
    expect(numerDokumentu("FV-P", 7, 2026)).toBe("FV-P/0007/2026");
  });

  it("nie wymyśla numeru, gdy podmiot nie ma serii", () => {
    expect(numerDokumentu(null, 7, 2026)).toBeNull();
  });

  it("odrzuca niepoprawny licznik", () => {
    expect(numerDokumentu("FV-P", 0, 2026)).toBeNull();
    expect(numerDokumentu("FV-P", 1.5, 2026)).toBeNull();
  });
});

describe("bramka wystawienia", () => {
  const przypisania = sugerowanyPodzial(pozycje);

  it("blokuje wystawienie, bo żaden podmiot nie ma kompletu danych", () => {
    const wynik = walidujWystawienie(pozycje, przypisania);
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blokady).toHaveLength(3);
    expect(wynik.blokady[0]).toContain("NIP");
  });

  it("blokuje pozycję bez przypisanego podmiotu", () => {
    const wynik = walidujWystawienie(pozycje, { materialy: "plyty" });
    if (wynik.ok) throw new Error("Powinno zablokować");
    expect(wynik.blokady.some((b) => b.includes("Obrzeża"))).toBe(true);
  });

  it("zwraca policzone dokumenty także wtedy, gdy blokuje", () => {
    const wynik = walidujWystawienie(pozycje, przypisania);
    expect(wynik.dokumenty).toHaveLength(3);
  });

  it("nie blokuje pustego zamówienia komunikatem o braku dokumentu", () => {
    const wynik = walidujWystawienie([], {});
    expect(wynik.ok).toBe(true);
  });
});

describe("zmiana podmiotu i audyt", () => {
  const przypisania = sugerowanyPodzial(pozycje);

  it("zwraca nowe przypisania, nie mutuje wejścia", () => {
    const wynik = zmienPodmiotPozycji(pozycje, przypisania, {
      zamowienie: "M-2026-0848", pozycja: "obrzeza", naPodmiot: "stolarnia",
      powod: "zrodlo-towaru", autor: "Biuro",
    });
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.przypisania.obrzeza).toBe("stolarnia");
    expect(przypisania.obrzeza).toBe("plyty");
  });

  it("zapisuje w audycie pozycję, kierunek zmiany, powód, autora i datę", () => {
    const wynik = zmienPodmiotPozycji(pozycje, przypisania, {
      zamowienie: "M-2026-0848", pozycja: "obrzeza", naPodmiot: "stolarnia",
      powod: "zrodlo-towaru", autor: "Biuro",
    }, "2026-08-30T11:00:00.000Z");
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.wpis).toEqual({
      zamowienie: "M-2026-0848",
      pozycja: "obrzeza",
      nazwaPozycji: "Obrzeża",
      zPodmiotu: "plyty",
      naPodmiot: "stolarnia",
      powod: "zrodlo-towaru",
      autor: "Biuro",
      kiedy: "2026-08-30T11:00:00.000Z",
    });
  });

  it("odrzuca zmianę na ten sam podmiot", () => {
    const wynik = zmienPodmiotPozycji(pozycje, przypisania, {
      zamowienie: "M-2026-0848", pozycja: "obrzeza", naPodmiot: "plyty",
      powod: "korekta-sugestii", autor: "Biuro",
    });
    expect(wynik.ok).toBe(false);
  });

  it("odrzuca zmianę bez operatora", () => {
    const wynik = zmienPodmiotPozycji(pozycje, przypisania, {
      zamowienie: "M-2026-0848", pozycja: "obrzeza", naPodmiot: "stolarnia",
      powod: "korekta-sugestii", autor: "  ",
    });
    expect(wynik.ok).toBe(false);
  });

  it("odrzuca nieznaną pozycję", () => {
    const wynik = zmienPodmiotPozycji(pozycje, przypisania, {
      zamowienie: "M-2026-0848", pozycja: "nieistnieje", naPodmiot: "stolarnia",
      powod: "korekta-sugestii", autor: "Biuro",
    });
    expect(wynik.ok).toBe(false);
  });
});

describe("liczba dokumentów", () => {
  it("zmienia się wraz z przypisaniami", () => {
    expect(liczbaDokumentow(pozycje, sugerowanyPodzial(pozycje))).toBe(3);
    expect(liczbaDokumentow(pozycje, {
      materialy: "plyty", obrzeza: "plyty", akcesoria: "plyty", uslugi: "stolarnia",
    })).toBe(2);
  });

  it("odmienia rzeczownik po polsku", () => {
    expect(odmienDokumenty(1)).toBe("dokument");
    expect(odmienDokumenty(2)).toBe("dokumenty");
    expect(odmienDokumenty(3)).toBe("dokumenty");
    expect(odmienDokumenty(0)).toBe("dokumentów");
    expect(odmienDokumenty(5)).toBe("dokumentów");
    expect(odmienDokumenty(12)).toBe("dokumentów");
    expect(odmienDokumenty(22)).toBe("dokumenty");
  });
});

describe("walidacja formatu danych rejestrowych", () => {
  it("przyjmuje poprawny NIP i odrzuca literówkę", () => {
    expect(poprawnyNip("9290000006")).toBe(true);
    expect(poprawnyNip("9290000007")).toBe(false);
  });

  it("ignoruje myślniki i spacje w NIP", () => {
    expect(poprawnyNip("929-000-00-06")).toBe(true);
    expect(poprawnyNip("929 000 00 06")).toBe(true);
  });

  it("odrzuca NIP o złej długości", () => {
    expect(poprawnyNip("92900000")).toBe(false);
    expect(poprawnyNip("92900000060")).toBe(false);
  });

  it("sprawdza rachunek sumą mod 97", () => {
    expect(poprawnyRachunek("PL61109010140000071219812874")).toBe(true);
    expect(poprawnyRachunek("PL61109010140000071219812875")).toBe(false);
  });

  it("blokuje wystawienie przy niepoprawnym NIP mimo wypełnionego pola", () => {
    const zlyNip = { ...gotowyPodmiot("plyty"), nip: "9290000007" };
    expect(brakujaceDaneFormalne(zlyNip)).toEqual([]);
    expect(bledneDaneFormalne(zlyNip)).toHaveLength(1);
    expect(czyPodmiotGotowy(zlyNip)).toBe(false);
  });
});
