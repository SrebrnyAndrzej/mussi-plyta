import { describe, expect, it } from "vitest";
import {
  czyBlokujeMagazyn,
  czyMoznaWystawic,
  kompletDlaZamowienia,
  oznaczKsef,
  podmiotyKompletu,
  rodzaje,
  sciezkaAwaryjna,
  wartoscKompletu,
  wystawFaktury,
  wystawKorekte,
  wystawPotwierdzenie,
  wystawWz,
  type DokumentWystawiony,
} from "@/lib/dokumenty";
import { sugerowanyPodzial, type PozycjaDokumentu } from "@/lib/fakturowanie";
import { wartoscPozycji, type Zamowienie } from "@/lib/zamowienia";

const TERAZ = new Date("2026-08-30T12:00:00");

const pozycje: PozycjaDokumentu[] = [
  { id: "materialy", nazwa: "Płyty, blaty i fronty", kategoria: "materialy", netto: 6000 },
  { id: "obrzeza", nazwa: "Obrzeża", kategoria: "obrzeza", netto: 750 },
  { id: "akcesoria", nazwa: "Okucia i akcesoria", kategoria: "akcesoria", netto: 1900 },
  { id: "uslugi", nazwa: "Usługi stolarskie", kategoria: "uslugi", netto: 1350 },
];

function zamowienie(status: Zamowienie["status"] = "zablokowane", wersja = 1): Zamowienie {
  const pozycjeZ = [{ id: "calosc", nazwa: "Zamówienie", ilosc: 1, netto: 10000 }];
  return {
    id: "M-2026-0842",
    status,
    przyjeteO: new Date("2026-08-28T10:31:00"),
    terminOczekiwany: null,
    terminPotwierdzony: null,
    wersje: Array.from({ length: wersja }, (_, i) => ({
      numer: i + 1,
      pozycje: pozycjeZ,
      wartoscNetto: wartoscPozycji(pozycjeZ),
      prognoza: new Date("2026-09-03T16:00:00"),
      utworzona: new Date("2026-08-28T10:31:00"),
      autor: "stolarnia-nowak",
      powod: i === 0 ? null : "zmiana",
    })),
  };
}

describe("kiedy wolno wystawić dokument", () => {
  it("potwierdzenie tylko przed produkcją, WZ dopiero przy wydaniu", () => {
    expect(czyMoznaWystawic("potwierdzenie", "okno-zmian")).toBe(true);
    expect(czyMoznaWystawic("potwierdzenie", "w-produkcji")).toBe(false);
    expect(czyMoznaWystawic("wz", "w-produkcji")).toBe(false);
    expect(czyMoznaWystawic("wz", "gotowe-do-odbioru")).toBe(true);
  });

  it("nie fakturuje szkicu ani zamówienia do potwierdzenia", () => {
    expect(czyMoznaWystawic("faktura", "szkic")).toBe(false);
    expect(czyMoznaWystawic("faktura", "do-potwierdzenia")).toBe(false);
    expect(czyMoznaWystawic("faktura", "zablokowane")).toBe(true);
  });

  it("rozróżnia dokumenty fiskalne od wewnętrznych", () => {
    expect(rodzaje.potwierdzenie.fiskalny).toBe(false);
    expect(rodzaje.wz.fiskalny).toBe(false);
    expect(rodzaje.faktura.fiskalny).toBe(true);
    expect(rodzaje.korekta.fiskalny).toBe(true);
  });
});

describe("potwierdzenie zamówienia", () => {
  it("zamraża wersję i cenę", () => {
    const wynik = wystawPotwierdzenie(zamowienie("okno-zmian", 2), pozycje, "biuro", TERAZ);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.dokument.wersja).toBe(2);
    expect(wynik.dokument.netto).toBe(10000);
    expect(wynik.dokument.numer).toBe("PZ/M-2026-0842/2");
  });

  it("nie wymaga danych rejestrowych, bo nie jest fiskalne", () => {
    const wynik = wystawPotwierdzenie(zamowienie(), pozycje, "biuro", TERAZ);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.dokument.podmiot).toBeNull();
    expect(wynik.dokument.ksef).toBe("nie-dotyczy");
  });

  it("nie potwierdza zamówienia w produkcji", () => {
    expect(wystawPotwierdzenie(zamowienie("w-produkcji"), pozycje, "biuro", TERAZ).ok).toBe(false);
  });

  it("wymaga operatora i pozycji", () => {
    expect(wystawPotwierdzenie(zamowienie(), pozycje, "  ", TERAZ).ok).toBe(false);
    expect(wystawPotwierdzenie(zamowienie(), [], "biuro", TERAZ).ok).toBe(false);
  });

  it("kopiuje pozycje, więc późniejsza zmiana koszyka go nie rusza", () => {
    /* Własne obiekty, żeby mutacja nie wyciekła do pozostałych testów. */
    const zrodlo: PozycjaDokumentu[] = [
      { id: "materialy", nazwa: "Płyty, blaty i fronty", kategoria: "materialy", netto: 6000 },
    ];
    const wynik = wystawPotwierdzenie(zamowienie(), zrodlo, "biuro", TERAZ);
    if (!wynik.ok) throw new Error(wynik.blad);
    zrodlo[0].netto = 1;
    expect(wynik.dokument.pozycje[0].netto).toBe(6000);
  });
});

describe("faktury", () => {
  const przypisania = sugerowanyPodzial(pozycje);

  it("nie wychodzą, dopóki podmioty nie mają danych rejestrowych", () => {
    const wynik = wystawFaktury(zamowienie(), pozycje, przypisania, "biuro", { teraz: TERAZ });
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blokady).toHaveLength(3);
    expect(wynik.blokady[0]).toContain("NIP");
  });

  it("blokuje pozycję bez przypisanego podmiotu", () => {
    const wynik = wystawFaktury(zamowienie(), pozycje, { materialy: "plyty" }, "biuro", { teraz: TERAZ });
    if (wynik.ok) throw new Error("powinno zablokować");
    expect(wynik.blokady.some((b) => b.includes("Obrzeża"))).toBe(true);
  });

  it("nie fakturuje zamówienia, które nie weszło do realizacji", () => {
    const wynik = wystawFaktury(zamowienie("okno-zmian"), pozycje, przypisania, "biuro", { teraz: TERAZ });
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blokady).toHaveLength(0);
    expect(wynik.blad).toContain("gotowe do fakturowania");
  });

  it("wymaga operatora", () => {
    expect(wystawFaktury(zamowienie(), pozycje, przypisania, "", { teraz: TERAZ }).ok).toBe(false);
  });
});

describe("WZ", () => {
  it("powstaje przy wydaniu i niesie migawkę podmiotu", () => {
    const wynik = wystawWz(zamowienie("gotowe-do-odbioru"), {
      podmiot: "plyty", pozycje: pozycje.slice(0, 2), autor: "magazyn",
    }, TERAZ);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.dokument.rodzaj).toBe("wz");
    expect(wynik.dokument.netto).toBe(6750);
    expect(wynik.dokument.migawka?.id).toBe("plyty");
  });

  it("nie ma numeru, dopóki podmiot nie ma serii WZ", () => {
    const wynik = wystawWz(zamowienie("gotowe-do-odbioru"), {
      podmiot: "plyty", pozycje, autor: "magazyn",
    }, TERAZ);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.dokument.numer).toBeNull();
  });

  it("nie powstaje przed skompletowaniem zamówienia", () => {
    const wynik = wystawWz(zamowienie("w-produkcji"), {
      podmiot: "plyty", pozycje, autor: "magazyn",
    }, TERAZ);
    expect(wynik.ok).toBe(false);
  });
});

describe("korekta", () => {
  function fakturaDemo(): DokumentWystawiony {
    return {
      id: "FV-M-2026-0842-plyty",
      rodzaj: "faktura",
      numer: "FV-P/0007/2026",
      zamowienie: "M-2026-0842",
      wersja: 1,
      podmiot: "plyty",
      migawka: null,
      pozycje: pozycje.slice(0, 2),
      netto: 6750,
      vat: 1552.5,
      brutto: 8302.5,
      wystawiony: TERAZ.toISOString(),
      autor: "biuro",
      koryguje: null,
      ksef: "wyslany",
    };
  }

  it("niesie różnicę wobec faktury, nie wartość docelową", () => {
    const poprawione: PozycjaDokumentu[] = [
      { id: "materialy", nazwa: "Płyty, blaty i fronty", kategoria: "materialy", netto: 6000 },
      { id: "obrzeza", nazwa: "Obrzeża", kategoria: "obrzeza", netto: 500 },
    ];
    const wynik = wystawKorekte(fakturaDemo(), poprawione, "Pomyłka w metrażu obrzeża", "biuro", { teraz: TERAZ });
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.dokument.netto).toBe(-250);
    expect(wynik.dokument.vat).toBe(-57.5);
    expect(wynik.dokument.brutto).toBe(-307.5);
    expect(wynik.dokument.koryguje).toBe("FV-P/0007/2026");
  });

  it("odrzuca korektę, która niczego nie zmienia", () => {
    const wynik = wystawKorekte(fakturaDemo(), pozycje.slice(0, 2), "Bez zmian", "biuro", { teraz: TERAZ });
    expect(wynik.ok).toBe(false);
  });

  it("wymaga powodu", () => {
    const poprawione = [{ id: "materialy", nazwa: "Płyty", kategoria: "materialy" as const, netto: 5000 }];
    expect(wystawKorekte(fakturaDemo(), poprawione, "  ", "biuro", { teraz: TERAZ }).ok).toBe(false);
  });

  it("nie koryguje dokumentu, który nie jest fakturą", () => {
    const wz = { ...fakturaDemo(), rodzaj: "wz" as const };
    const poprawione = [{ id: "materialy", nazwa: "Płyty", kategoria: "materialy" as const, netto: 5000 }];
    expect(wystawKorekte(wz, poprawione, "Powód", "biuro", { teraz: TERAZ }).ok).toBe(false);
  });

  it("nie koryguje faktury bez numeru", () => {
    const bezNumeru = { ...fakturaDemo(), numer: null };
    const poprawione = [{ id: "materialy", nazwa: "Płyty", kategoria: "materialy" as const, netto: 5000 }];
    expect(wystawKorekte(bezNumeru, poprawione, "Powód", "biuro", { teraz: TERAZ }).ok).toBe(false);
  });
});

describe("KSeF nie zatrzymuje magazynu", () => {
  const faktura: DokumentWystawiony = {
    id: "FV-1", rodzaj: "faktura", numer: "FV-P/0001/2026", zamowienie: "M-2026-0842",
    wersja: 1, podmiot: "plyty", migawka: null, pozycje, netto: 10000, vat: 2300,
    brutto: 12300, wystawiony: TERAZ.toISOString(), autor: "biuro", koryguje: null, ksef: "oczekuje",
  };

  it("błąd wysyłki nigdy nie blokuje wydania towaru", () => {
    expect(czyBlokujeMagazyn()).toBe(false);
  });

  it("zapisuje stan wysyłki bez mutowania dokumentu", () => {
    const po = oznaczKsef(faktura, "blad");
    expect(po.ksef).toBe("blad");
    expect(faktura.ksef).toBe("oczekuje");
  });

  it("nie wysyła dokumentów niefiskalnych", () => {
    const wz = { ...faktura, rodzaj: "wz" as const, ksef: "nie-dotyczy" as const };
    expect(oznaczKsef(wz, "wyslany").ksef).toBe("nie-dotyczy");
  });

  it("podpowiada ścieżkę awaryjną i wprost dopuszcza wydanie", () => {
    const s = sciezkaAwaryjna([oznaczKsef(faktura, "blad"), oznaczKsef({ ...faktura, id: "FV-2" }, "wyslany")]);
    expect(s.potrzebna).toBe(true);
    expect(s.komunikat).toContain("Wydanie towaru jest możliwe");
    expect(s.komunikat).toContain("1 z 2");
  });

  it("milczy, gdy wszystko poszło", () => {
    expect(sciezkaAwaryjna([oznaczKsef(faktura, "wyslany")]).potrzebna).toBe(false);
  });
});

describe("komplet dokumentów zamówienia", () => {
  const baza: DokumentWystawiony = {
    id: "x", rodzaj: "potwierdzenie", numer: "PZ/M-2026-0842/1", zamowienie: "M-2026-0842",
    wersja: 1, podmiot: null, migawka: null, pozycje: [], netto: 100, vat: 23, brutto: 123,
    wystawiony: TERAZ.toISOString(), autor: "biuro", koryguje: null, ksef: "nie-dotyczy",
  };
  const komplet: DokumentWystawiony[] = [
    baza,
    { ...baza, id: "f1", rodzaj: "faktura", podmiot: "plyty", brutto: 8302.5, ksef: "wyslany" },
    { ...baza, id: "f2", rodzaj: "faktura", podmiot: "akcesoria", brutto: 2626.97, ksef: "wyslany" },
    { ...baza, id: "obcy", zamowienie: "M-2026-0999", rodzaj: "faktura", podmiot: "plyty", brutto: 999 },
  ];

  it("zbiera dokumenty jednego zamówienia i pomija cudze", () => {
    const k = kompletDlaZamowienia("M-2026-0842", komplet);
    expect(k.dokumenty).toHaveLength(3);
    expect(k.dokumenty.every((d) => d.zamowienie === "M-2026-0842")).toBe(true);
  });

  it("mówi, czego jeszcze brakuje", () => {
    expect(kompletDlaZamowienia("M-2026-0842", komplet).brakuje).toEqual(["wz"]);
  });

  it("liczy tylko dokumenty fiskalne", () => {
    expect(wartoscKompletu(kompletDlaZamowienia("M-2026-0842", komplet).dokumenty)).toBe(10929.47);
  });

  it("wymienia podmioty w kolejności z kartoteki", () => {
    const k = kompletDlaZamowienia("M-2026-0842", komplet);
    expect(podmiotyKompletu(k.dokumenty)).toEqual(["plyty", "akcesoria"]);
  });
});
