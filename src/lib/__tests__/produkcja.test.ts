import { describe, expect, it } from "vitest";
import {
  czyZakonczone,
  doWydania,
  kolejka,
  naEtapie,
  nastepnyEtap,
  obciazenie,
  odwolajOdbior,
  pilnosc,
  postep,
  stanRealizacji,
  ustawEtap,
  wolneMiejsca,
  zarezerwujOdbior,
  type PozycjaWydania,
  type SlotOdbioru,
  type ZlecenieProdukcyjne,
} from "@/lib/produkcja";

const DZIS = new Date("2026-08-30T08:00:00Z");

function zlecenie(n: Partial<ZlecenieProdukcyjne> = {}): ZlecenieProdukcyjne {
  return {
    zamowienie: "M-2026-0842",
    klient: "Stolarnia Nowak",
    termin: "2026-09-05",
    etapy: { ciecie: "oczekuje", oklejanie: "oczekuje", kompletacja: "oczekuje" },
    pracochlonnosc: 6,
    ...n,
  };
}

describe("etapy zlecenia", () => {
  it("wskazuje pierwszy niezamknięty etap", () => {
    expect(nastepnyEtap(zlecenie())).toBe("ciecie");
    expect(nastepnyEtap(zlecenie({ etapy: { ciecie: "gotowy", oklejanie: "oczekuje", kompletacja: "oczekuje" } }))).toBe("oklejanie");
  });

  it("uznaje zlecenie za zamknięte dopiero po wszystkich etapach", () => {
    const gotowe = zlecenie({ etapy: { ciecie: "gotowy", oklejanie: "gotowy", kompletacja: "gotowy" } });
    expect(czyZakonczone(gotowe)).toBe(true);
    expect(nastepnyEtap(gotowe)).toBeNull();
    expect(postep(gotowe)).toBe(1);
  });

  it("liczy postęp po zamkniętych etapach", () => {
    expect(postep(zlecenie({ etapy: { ciecie: "gotowy", oklejanie: "w-toku", kompletacja: "oczekuje" } }))).toBe(0.33);
  });

  it("nie pozwala okleić tego, czego nie wycięto", () => {
    const wynik = ustawEtap(zlecenie(), "oklejanie", "w-toku", "operator");
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("Cięcie");
  });

  it("pozwala ruszyć etap, gdy poprzedni jest zamknięty", () => {
    const z = zlecenie({ etapy: { ciecie: "gotowy", oklejanie: "oczekuje", kompletacja: "oczekuje" } });
    const wynik = ustawEtap(z, "oklejanie", "w-toku", "operator");
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.zlecenie.etapy.oklejanie).toBe("w-toku");
    expect(z.etapy.oklejanie).toBe("oczekuje");
  });

  it("pozwala wstrzymać etap bez patrzenia na poprzedni", () => {
    expect(ustawEtap(zlecenie(), "kompletacja", "wstrzymany", "operator").ok).toBe(true);
  });

  it("wymaga operatora i odrzuca zmianę na ten sam stan", () => {
    expect(ustawEtap(zlecenie(), "ciecie", "w-toku", "").ok).toBe(false);
    expect(ustawEtap(zlecenie(), "ciecie", "oczekuje", "operator").ok).toBe(false);
  });
});

describe("pilność i kolejka", () => {
  it("po terminie bije wszystko inne", () => {
    expect(pilnosc(zlecenie({ termin: "2026-08-28" }), DZIS)).toBe("po-terminie");
  });

  it("wstrzymany etap czyni zlecenie zagrożonym niezależnie od kalendarza", () => {
    const z = zlecenie({ termin: "2026-09-30", etapy: { ciecie: "wstrzymany", oklejanie: "oczekuje", kompletacja: "oczekuje" } });
    expect(pilnosc(z, DZIS)).toBe("zagrozone");
  });

  it("stopniuje pilność po dniach do terminu", () => {
    expect(pilnosc(zlecenie({ termin: "2026-08-31" }), DZIS)).toBe("zagrozone");
    expect(pilnosc(zlecenie({ termin: "2026-09-02" }), DZIS)).toBe("pilne");
    expect(pilnosc(zlecenie({ termin: "2026-09-20" }), DZIS)).toBe("spokojnie");
  });

  it("zlecenie zamknięte nie jest już pilne", () => {
    const z = zlecenie({ termin: "2026-08-01", etapy: { ciecie: "gotowy", oklejanie: "gotowy", kompletacja: "gotowy" } });
    expect(pilnosc(z, DZIS)).toBe("spokojnie");
  });

  it("układa kolejkę od najbardziej palących", () => {
    const lista = [
      zlecenie({ zamowienie: "spokojne", termin: "2026-09-20" }),
      zlecenie({ zamowienie: "po-terminie", termin: "2026-08-20" }),
      zlecenie({ zamowienie: "pilne", termin: "2026-09-02" }),
      zlecenie({ zamowienie: "zagrozone", termin: "2026-08-31" }),
    ];
    expect(kolejka(lista, DZIS).map((z) => z.zamowienie)).toEqual([
      "po-terminie", "zagrozone", "pilne", "spokojne",
    ]);
  });

  it("spycha zamknięte zlecenia na koniec", () => {
    const lista = [
      zlecenie({ zamowienie: "gotowe", termin: "2026-08-01", etapy: { ciecie: "gotowy", oklejanie: "gotowy", kompletacja: "gotowy" } }),
      zlecenie({ zamowienie: "otwarte", termin: "2026-09-20" }),
    ];
    expect(kolejka(lista, DZIS)[0].zamowienie).toBe("otwarte");
  });

  it("filtruje zlecenia stojące na danym etapie", () => {
    const lista = [
      zlecenie({ zamowienie: "a", etapy: { ciecie: "gotowy", oklejanie: "w-toku", kompletacja: "oczekuje" } }),
      zlecenie({ zamowienie: "b" }),
    ];
    expect(naEtapie(lista, "oklejanie").map((z) => z.zamowienie)).toEqual(["a", "b"]);
    expect(naEtapie(lista, "ciecie").map((z) => z.zamowienie)).toEqual(["b"]);
  });
});

describe("plan odbiorów", () => {
  function sloty(): SlotOdbioru[] {
    return [
      { id: "s1", dzien: "2026-09-03", od: "08:00", do: "10:00", pojemnosc: 2, zajete: [] },
      { id: "s2", dzien: "2026-09-03", od: "10:00", do: "12:00", pojemnosc: 1, zajete: ["M-2026-0839"] },
    ];
  }

  it("liczy wolne miejsca", () => {
    expect(wolneMiejsca(sloty()[0])).toBe(2);
    expect(wolneMiejsca(sloty()[1])).toBe(0);
  });

  it("zapisuje zamówienie na wolne okno", () => {
    const wynik = zarezerwujOdbior(sloty(), "s1", "M-2026-0842");
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.sloty[0].zajete).toEqual(["M-2026-0842"]);
  });

  it("nie wpuszcza do pełnego okna", () => {
    const wynik = zarezerwujOdbior(sloty(), "s2", "M-2026-0842");
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("pełne");
  });

  it("nie pozwala zapisać jednego zamówienia na dwa odbiory", () => {
    const wynik = zarezerwujOdbior(sloty(), "s1", "M-2026-0839");
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("inny odbiór");
  });

  it("odrzuca nieznane okno", () => {
    expect(zarezerwujOdbior(sloty(), "nie-ma", "M-2026-0842").ok).toBe(false);
  });

  it("odwołanie zwalnia miejsce", () => {
    const po = odwolajOdbior(sloty(), "M-2026-0839");
    expect(wolneMiejsca(po[1])).toBe(1);
  });

  it("nie mutuje wejścia", () => {
    const zrodlo = sloty();
    zarezerwujOdbior(zrodlo, "s1", "M-2026-0842");
    expect(zrodlo[0].zajete).toEqual([]);
  });
});

describe("realizacja częściowa", () => {
  const pozycje: PozycjaWydania[] = [
    { sku: "KR-5981", nazwa: "Płyta", zamowiono: 6, wydano: 6 },
    { sku: "BLU-500", nazwa: "Prowadnica", zamowiono: 4, wydano: 0 },
  ];

  it("rozpoznaje wydanie częściowe", () => {
    expect(stanRealizacji(pozycje)).toBe("czesciowa");
  });

  it("rozpoznaje komplet i pustkę", () => {
    expect(stanRealizacji(pozycje.map((p) => ({ ...p, wydano: p.zamowiono })))).toBe("pelna");
    expect(stanRealizacji(pozycje.map((p) => ({ ...p, wydano: 0 })))).toBe("brak");
    expect(stanRealizacji([])).toBe("brak");
  });

  it("mówi, co zostaje do wydania", () => {
    expect(doWydania(pozycje).map((p) => p.sku)).toEqual(["BLU-500"]);
  });
});

describe("obciążenie terminów", () => {
  it("sumuje pracochłonność na dzień i pomija zamknięte", () => {
    const lista = [
      zlecenie({ zamowienie: "a", termin: "2026-09-03", pracochlonnosc: 6 }),
      zlecenie({ zamowienie: "b", termin: "2026-09-03", pracochlonnosc: 4.5 }),
      zlecenie({ zamowienie: "c", termin: "2026-09-05", pracochlonnosc: 3 }),
      zlecenie({ zamowienie: "d", termin: "2026-09-03", pracochlonnosc: 9, etapy: { ciecie: "gotowy", oklejanie: "gotowy", kompletacja: "gotowy" } }),
    ];
    expect(obciazenie(lista)).toEqual([
      { dzien: "2026-09-03", godziny: 10.5, zlecenia: 2 },
      { dzien: "2026-09-05", godziny: 3, zlecenia: 1 },
    ]);
  });
});
