import { describe, expect, it } from "vitest";
import {
  aktualnaWersja,
  czyOpoznienie,
  czyPrzejscieDozwolone,
  komunikatTerminu,
  koniecOknaZmian,
  pozostalyCzas,
  stanOknaZmian,
  statusy,
  terminOczekiwany,
  terminyZamowienia,
  utworzWersje,
  wartoscPozycji,
  zlozWniosekOZmiane,
  zmienStatus,
  type PozycjaZamowienia,
  type Zamowienie,
} from "@/lib/zamowienia";

const pozycje: PozycjaZamowienia[] = [
  { id: "plyty", nazwa: "Rozkrój płyt", ilosc: 18, netto: 5628.4 },
  { id: "obrzeza", nazwa: "Okleiny i obrzeża", ilosc: 5, netto: 1124.3 },
  { id: "okucia", nazwa: "Akcesoria i okucia", ilosc: 35, netto: 1710 },
];

const PRZYJETE = new Date("2026-08-28T10:31:00");

function zamowienie(nadpisz: Partial<Zamowienie> = {}): Zamowienie {
  return {
    id: "M-2026-0842",
    status: "okno-zmian",
    przyjeteO: PRZYJETE,
    terminOczekiwany: new Date("2026-09-03T16:00:00"),
    terminPotwierdzony: new Date("2026-09-03T16:00:00"),
    wersje: [
      {
        numer: 1,
        pozycje,
        wartoscNetto: wartoscPozycji(pozycje),
        prognoza: new Date("2026-09-03T16:00:00"),
        utworzona: PRZYJETE,
        autor: "stolarnia-nowak",
        powod: null,
      },
    ],
    ...nadpisz,
  };
}

describe("statusy i przejścia", () => {
  it("opisuje wszystkie dziesięć statusów ze specyfikacji", () => {
    expect(Object.keys(statusy)).toHaveLength(10);
  });

  it("tylko szkic i do potwierdzenia dają pełną edycję", () => {
    const pelne = Object.entries(statusy).filter(([, o]) => o.edycja === "pelna");
    expect(pelne.map(([id]) => id)).toEqual(["szkic", "do-potwierdzenia"]);
  });

  it("rezerwacja stanów trwa od złożenia do wydania", () => {
    expect(statusy["do-potwierdzenia"].rezerwuje).toBe(false);
    expect(statusy["okno-zmian"].rezerwuje).toBe(true);
    expect(statusy["w-produkcji"].rezerwuje).toBe(true);
    expect(statusy.zrealizowane.rezerwuje).toBe(false);
    expect(statusy.anulowane.rezerwuje).toBe(false);
  });

  it("pozwala na sensowne przejścia i blokuje skróty", () => {
    expect(czyPrzejscieDozwolone("okno-zmian", "zablokowane")).toBe(true);
    expect(czyPrzejscieDozwolone("szkic", "w-produkcji")).toBe(false);
    expect(czyPrzejscieDozwolone("zrealizowane", "w-produkcji")).toBe(false);
  });

  it("nie wypuszcza zamówienia ze statusu końcowego", () => {
    const zrealizowane = zamowienie({ status: "zrealizowane" });
    const wynik = zmienStatus(zrealizowane, "w-produkcji", "biuro", "pomyłka");
    expect(wynik.ok).toBe(false);
  });
});

describe("okno zmian", () => {
  it("liczy 48 godzin od przyjęcia, nie od rozpoczęcia szkicu", () => {
    expect(koniecOknaZmian(PRZYJETE).toISOString()).toBe(
      new Date("2026-08-30T10:31:00").toISOString(),
    );
  });

  it("pozwala na nową wersję, dopóki zegar nie minie", () => {
    const stan = stanOknaZmian("okno-zmian", PRZYJETE, new Date("2026-08-29T15:07:00"));
    expect(stan.tryb).toBe("nowa-wersja");
    expect(pozostalyCzas(stan.pozostaloMs)).toBe("19 godz. 24 min");
  });

  it("po upływie okna spada do wniosku o zmianę", () => {
    const stan = stanOknaZmian("okno-zmian", PRZYJETE, new Date("2026-08-30T10:32:00"));
    expect(stan.tryb).toBe("wniosek");
    expect(stan.pozostaloMs).toBe(0);
  });

  it("traktuje dokładny moment zamknięcia jako zamknięty", () => {
    const stan = stanOknaZmian("okno-zmian", PRZYJETE, koniecOknaZmian(PRZYJETE));
    expect(stan.tryb).toBe("wniosek");
  });

  it("nie otwiera okna w statusach produkcyjnych", () => {
    expect(stanOknaZmian("w-produkcji", PRZYJETE).tryb).toBe("brak");
    expect(stanOknaZmian("w-produkcji", PRZYJETE).doKiedy).toBeNull();
  });
});

describe("wersjonowanie", () => {
  const nowePozycje: PozycjaZamowienia[] = [
    ...pozycje.slice(0, 2),
    { id: "okucia", nazwa: "Akcesoria i okucia", ilosc: 40, netto: 1954 },
  ];
  const teraz = new Date("2026-08-29T09:00:00");

  it("tworzy kolejną wersję i zostawia poprzednią w historii", () => {
    const wynik = utworzWersje(zamowienie(), {
      pozycje: nowePozycje, powod: "Klient dołożył pięć prowadnic",
      autor: "stolarnia-nowak", prognoza: new Date("2026-09-04T16:00:00"),
    }, teraz);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.zamowienie.wersje).toHaveLength(2);
    expect(wynik.zamowienie.wersje[0].numer).toBe(1);
    expect(aktualnaWersja(wynik.zamowienie).numer).toBe(2);
  });

  it("przelicza wartość od nowa dla każdej wersji", () => {
    const wynik = utworzWersje(zamowienie(), {
      pozycje: nowePozycje, powod: "Klient dołożył pięć prowadnic",
      autor: "stolarnia-nowak", prognoza: new Date("2026-09-04T16:00:00"),
    }, teraz);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.wersja.wartoscNetto).toBe(8706.7);
    expect(wynik.zamowienie.wersje[0].wartoscNetto).toBe(8462.7);
  });

  it("nie mutuje zamówienia wejściowego", () => {
    const zrodlo = zamowienie();
    utworzWersje(zrodlo, {
      pozycje: nowePozycje, powod: "Zmiana", autor: "stolarnia-nowak",
      prognoza: new Date("2026-09-04T16:00:00"),
    }, teraz);
    expect(zrodlo.wersje).toHaveLength(1);
  });

  it("odrzuca zmianę po zamknięciu okna", () => {
    const wynik = utworzWersje(zamowienie(), {
      pozycje: nowePozycje, powod: "Za późno", autor: "stolarnia-nowak",
      prognoza: new Date("2026-09-04T16:00:00"),
    }, new Date("2026-08-31T09:00:00"));
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("wniosek");
  });

  it("odrzuca zmianę w produkcji", () => {
    const wynik = utworzWersje(zamowienie({ status: "w-produkcji" }), {
      pozycje: nowePozycje, powod: "Zmiana", autor: "stolarnia-nowak",
      prognoza: new Date("2026-09-04T16:00:00"),
    }, teraz);
    expect(wynik.ok).toBe(false);
  });

  it("wymaga powodu, osoby i niepustego koszyka", () => {
    const baza = { pozycje: nowePozycje, powod: "Zmiana", autor: "stolarnia-nowak", prognoza: teraz };
    expect(utworzWersje(zamowienie(), { ...baza, powod: "  " }, teraz).ok).toBe(false);
    expect(utworzWersje(zamowienie(), { ...baza, autor: "" }, teraz).ok).toBe(false);
    expect(utworzWersje(zamowienie(), { ...baza, pozycje: [] }, teraz).ok).toBe(false);
  });

  it("odrzuca niecałkowitą albo zerową ilość", () => {
    const zle = [{ id: "a", nazwa: "A", ilosc: 0, netto: 10 }];
    const wynik = utworzWersje(zamowienie(), {
      pozycje: zle, powod: "Zmiana", autor: "stolarnia-nowak", prognoza: teraz,
    }, teraz);
    expect(wynik.ok).toBe(false);
  });

  it("zapisuje wersję w audycie razem z powodem", () => {
    const wynik = utworzWersje(zamowienie(), {
      pozycje: nowePozycje, powod: "Klient dołożył pięć prowadnic",
      autor: "stolarnia-nowak", prognoza: new Date("2026-09-04T16:00:00"),
    }, teraz);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.wpis.rodzaj).toBe("wersja");
    expect(wynik.wpis.powod).toBe("Klient dołożył pięć prowadnic");
    expect(wynik.wpis.opis).toContain("Wersja 2");
  });
});

describe("zmiana statusu", () => {
  it("uruchamia zegar okna zmian przy przyjęciu do systemu", () => {
    const szkic = zamowienie({ status: "do-potwierdzenia", przyjeteO: null });
    const teraz = new Date("2026-08-30T08:00:00");
    const wynik = zmienStatus(szkic, "okno-zmian", "biuro", "Potwierdzone przez klienta", teraz);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.zamowienie.przyjeteO).toEqual(teraz);
  });

  it("nie przestawia zegara przy kolejnych zmianach statusu", () => {
    const wynik = zmienStatus(zamowienie(), "zablokowane", "biuro", "Przekazane na produkcję");
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.zamowienie.przyjeteO).toEqual(PRZYJETE);
  });

  it("wymaga operatora i powodu", () => {
    expect(zmienStatus(zamowienie(), "zablokowane", "", "powód").ok).toBe(false);
    expect(zmienStatus(zamowienie(), "zablokowane", "biuro", "  ").ok).toBe(false);
  });

  it("odrzuca zmianę na ten sam status", () => {
    expect(zmienStatus(zamowienie(), "okno-zmian", "biuro", "powód").ok).toBe(false);
  });
});

describe("wniosek o zmianę", () => {
  const poOknie = new Date("2026-08-31T09:00:00");

  it("przyjmuje wniosek dopiero po zamknięciu okna", () => {
    const wynik = zlozWniosekOZmiane(zamowienie(), "Proszę o zmianę koloru obrzeża na biały", "stolarnia-nowak", poOknie);
    expect(wynik.ok).toBe(true);
  });

  it("nie przyjmuje wniosku, gdy można jeszcze edytować", () => {
    const wynik = zlozWniosekOZmiane(zamowienie(), "Proszę o zmianę koloru obrzeża", "stolarnia-nowak", new Date("2026-08-29T09:00:00"));
    expect(wynik.ok).toBe(false);
  });

  it("nie modyfikuje zamówienia, tylko zapisuje wniosek", () => {
    const zrodlo = zamowienie();
    const wynik = zlozWniosekOZmiane(zrodlo, "Proszę o zmianę koloru obrzeża na biały", "stolarnia-nowak", poOknie);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.wniosek.stan).toBe("zlozony");
    expect(zrodlo.wersje).toHaveLength(1);
  });

  it("odrzuca wniosek bez treści", () => {
    expect(zlozWniosekOZmiane(zamowienie(), "krótko", "stolarnia-nowak", poOknie).ok).toBe(false);
  });

  it("nie przyjmuje wniosku w produkcji", () => {
    const wynik = zlozWniosekOZmiane(zamowienie({ status: "w-produkcji" }), "Proszę o zmianę terminu odbioru", "stolarnia-nowak", poOknie);
    expect(wynik.ok).toBe(false);
  });
});

describe("terminy", () => {
  it("liczy pięć dni roboczych i pomija weekend", () => {
    /* Poniedziałek 31 sierpnia 2026, przed godziną graniczną. */
    const termin = terminOczekiwany(new Date("2026-08-31T09:00:00"));
    expect(termin.getDay()).not.toBe(0);
    expect(termin.getDay()).not.toBe(6);
    expect(termin.toISOString().slice(0, 10)).toBe("2026-09-07");
  });

  it("zamówienie po godzinie granicznej liczy się od następnego dnia", () => {
    const przed = terminOczekiwany(new Date("2026-08-31T09:00:00"));
    const po = terminOczekiwany(new Date("2026-08-31T15:00:00"));
    expect(po.getTime()).toBeGreaterThan(przed.getTime());
  });

  it("trzyma trzy terminy osobno", () => {
    const t = terminyZamowienia(zamowienie());
    expect(t.oczekiwany).not.toBeNull();
    expect(t.potwierdzony).not.toBeNull();
    expect(t.prognoza).not.toBeNull();
  });

  it("wykrywa opóźnienie, gdy prognoza minie termin potwierdzony", () => {
    expect(czyOpoznienie(zamowienie())).toBe(false);
    const opozniona = zamowienie();
    opozniona.wersje[0].prognoza = new Date("2026-09-08T16:00:00");
    expect(czyOpoznienie(opozniona)).toBe(true);
  });

  it("nie obiecuje terminu, gdy koszyk nie jest w całości dostępny", () => {
    const termin = new Date("2026-09-03T16:00:00");
    expect(komunikatTerminu("cala", termin)).toContain("zarezerwowany");
    expect(komunikatTerminu("czesciowa", termin, new Date("2026-09-05T00:00:00"))).toContain("oczekuje na dostawę");
    expect(komunikatTerminu("czesciowa", termin)).toContain("nie jest jeszcze znany");
    expect(komunikatTerminu("do-potwierdzenia", null)).toContain("wymaga potwierdzenia");
  });
});
