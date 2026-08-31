import { describe, expect, it } from "vitest";
import {
  aktywnePromocje,
  czyTrwa,
  dniDoKonca,
  dodajPromocje,
  podsumujPromocje,
  przelaczPromocje,
  usunPromocje,
  walidujPromocje,
  type Promocja,
} from "@/lib/promocje";

const DZIS = new Date("2026-09-10T10:00:00");

/** Kandydat na promocję, czyli wszystko poza nadawanym identyfikatorem. */
function bezId(p: Promocja): Omit<Promocja, "id"> {
  const kopia: Partial<Promocja> = { ...p };
  delete kopia.id;
  return kopia as Omit<Promocja, "id">;
}

function promocja(n: Partial<Promocja> = {}): Promocja {
  return {
    id: "blum", tytul: "Zawiasy Blum taniej o 25%",
    opis: "CLIP top BLUMOTION przy zamówieniu od 50 sztuk.",
    etykieta: "-25%", producent: "Blum", odnosnik: "/katalog",
    obowiazujeOd: "2026-09-01", obowiazujeDo: "2026-09-30",
    aktywna: true, kolejnosc: 1, ...n,
  };
}

describe("kiedy promocja jest widoczna", () => {
  it("trwa w swoim okresie", () => {
    expect(czyTrwa(promocja(), DZIS)).toBe(true);
  });

  it("nie trwa przed początkiem ani po końcu", () => {
    expect(czyTrwa(promocja({ obowiazujeOd: "2026-10-01" }), DZIS)).toBe(false);
    expect(czyTrwa(promocja({ obowiazujeDo: "2026-09-09" }), DZIS)).toBe(false);
  });

  it("wyłączona ręcznie nie trwa mimo dat", () => {
    expect(czyTrwa(promocja({ aktywna: false }), DZIS)).toBe(false);
  });

  it("bezterminowa trwa dopóki jest włączona", () => {
    expect(czyTrwa(promocja({ obowiazujeDo: null }), DZIS)).toBe(true);
  });

  it("ostatni dzień jeszcze się liczy", () => {
    expect(czyTrwa(promocja({ obowiazujeDo: "2026-09-10" }), DZIS)).toBe(true);
  });
});

describe("kolejność na stronie", () => {
  it("niższa kolejność wyświetla się wcześniej", () => {
    const lista = [
      promocja({ id: "c", kolejnosc: 3 }),
      promocja({ id: "a", kolejnosc: 1 }),
      promocja({ id: "b", kolejnosc: 2 }),
    ];
    expect(aktywnePromocje(lista, DZIS).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("pomija te, które nie trwają", () => {
    const lista = [
      promocja({ id: "trwa" }),
      promocja({ id: "wygasla", obowiazujeDo: "2026-09-01" }),
      promocja({ id: "wylaczona", aktywna: false }),
    ];
    expect(aktywnePromocje(lista, DZIS).map((p) => p.id)).toEqual(["trwa"]);
  });
});

describe("odliczanie", () => {
  it("liczy dni do końca", () => {
    expect(dniDoKonca(promocja({ obowiazujeDo: "2026-09-12" }), DZIS)).toBe(2);
  });

  it("bezterminowa nie odlicza", () => {
    expect(dniDoKonca(promocja({ obowiazujeDo: null }), DZIS)).toBeNull();
  });

  it("nie schodzi poniżej zera", () => {
    expect(dniDoKonca(promocja({ obowiazujeDo: "2026-09-01" }), DZIS)).toBe(0);
  });
});

describe("walidacja przed publikacją", () => {
  const bez = bezId;

  it("poprawny baner przechodzi", () => {
    expect(walidujPromocje(bez(promocja()))).toEqual([]);
  });

  it("odrzuca pusty albo za krótki tytuł", () => {
    expect(walidujPromocje(bez(promocja({ tytul: "Tan" })))).toContain("Hasło musi mieć co najmniej 5 znaków.");
  });

  it("odrzuca za krótki opis, bo klient nie pozna warunku", () => {
    expect(walidujPromocje(bez(promocja({ opis: "taniej" })))).toContain("Opis musi wyjaśniać warunek, minimum 10 znaków.");
  });

  it("odrzuca odwrócone daty", () => {
    const bledy = walidujPromocje(bez(promocja({ obowiazujeOd: "2026-09-30", obowiazujeDo: "2026-09-01" })));
    expect(bledy).toContain("Data końca wypada przed początkiem.");
  });

  it("odrzuca odnośnik spoza portalu", () => {
    const bledy = walidujPromocje(bez(promocja({ odnosnik: "https://obcy.pl" })));
    expect(bledy).toContain("Odnośnik musi być ścieżką w portalu, zaczynającą się od ukośnika.");
  });

  it("odrzuca za długą etykietę", () => {
    expect(walidujPromocje(bez(promocja({ etykieta: "bardzo długa etykieta" })))).toContain("Etykieta jest za długa, maksimum 12 znaków.");
  });

  it("dopuszcza baner bez producenta i bez odnośnika", () => {
    expect(walidujPromocje(bez(promocja({ producent: null, odnosnik: null })))).toEqual([]);
  });
});

describe("zarządzanie listą", () => {
  it("dodaje poprawny baner", () => {
    const nowa = bezId(promocja({ id: "x", kolejnosc: 9 }));
    const wynik = dodajPromocje([], nowa, "nowa");
    if (!wynik.ok) throw new Error(wynik.bledy.join(", "));
    expect(wynik.promocje).toHaveLength(1);
    expect(wynik.promocja.id).toBe("nowa");
  });

  it("odmawia zapisu błędnego baneru", () => {
    const zla = bezId(promocja({ tytul: "" }));
    const wynik = dodajPromocje([], zla, "zla");
    expect(wynik.ok).toBe(false);
  });

  it("odmawia powtórzonego identyfikatora", () => {
    const nowa = bezId(promocja());
    const wynik = dodajPromocje([promocja({ id: "blum" })], nowa, "blum");
    if (wynik.ok) throw new Error("powinno odmówić");
    expect(wynik.bledy).toContain("Promocja o tym identyfikatorze już istnieje.");
  });

  it("przełącza i usuwa bez mutowania wejścia", () => {
    const lista = [promocja({ id: "a" })];
    expect(przelaczPromocje(lista, "a")[0].aktywna).toBe(false);
    expect(lista[0].aktywna).toBe(true);
    expect(usunPromocje(lista, "a")).toHaveLength(0);
    expect(lista).toHaveLength(1);
  });
});

describe("podsumowanie dla operatora", () => {
  it("rozdziela trwające, zaplanowane i zakończone", () => {
    const lista = [
      promocja({ id: "trwa" }),
      promocja({ id: "plan", obowiazujeOd: "2026-10-01", obowiazujeDo: "2026-10-20" }),
      promocja({ id: "koniec", obowiazujeOd: "2026-08-01", obowiazujeDo: "2026-08-20" }),
    ];
    expect(podsumujPromocje(lista, DZIS)).toEqual({
      wszystkie: 3, trwajace: 1, zaplanowane: 1, zakonczone: 1,
    });
  });
});
