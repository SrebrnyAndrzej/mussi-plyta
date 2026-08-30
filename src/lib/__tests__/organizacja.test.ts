import { describe, expect, it } from "vitest";
import {
  czyMozeZlozyc,
  podsumujZespol,
  role,
  ustawLimit,
  wylaczKonto,
  zmienRole,
  type Czlonek,
} from "@/lib/organizacja";

function czlonek(n: Partial<Czlonek> = {}): Czlonek {
  return {
    id: "U-1",
    imie: "Kazimierz Nowak",
    email: "kazimierz@stolarnia-nowak.pl",
    rola: "wlasciciel",
    limitAkceptacji: null,
    aktywny: true,
    ...n,
  };
}

const wlasciciel = czlonek();
const kupujacy = czlonek({ id: "U-2", imie: "Anna Wrona", rola: "kupujacy", limitAkceptacji: 5000 });
const podglad = czlonek({ id: "U-3", imie: "Piotr Lis", rola: "podglad", limitAkceptacji: 0 });
const zespol = [wlasciciel, kupujacy, podglad];

describe("role w zawężonym zakresie", () => {
  it("są trzy, bez kosztorysanta", () => {
    expect(Object.keys(role)).toEqual(["wlasciciel", "kupujacy", "podglad"]);
  });

  it("tylko właściciel zarządza zespołem", () => {
    expect(role.wlasciciel.zarzadzaZespolem).toBe(true);
    expect(role.kupujacy.zarzadzaZespolem).toBe(false);
    expect(role.podglad.zarzadzaZespolem).toBe(false);
  });

  it("podgląd nie zamawia i nie widzi cen", () => {
    expect(role.podglad.skladaZamowienia).toBe(false);
    expect(role.podglad.widziCeny).toBe(false);
  });
});

describe("kto może złożyć zamówienie", () => {
  it("właściciel zamawia bez akceptacji", () => {
    const wynik = czyMozeZlozyc(wlasciciel, 90000, zespol);
    expect(wynik).toEqual({ ok: true, wymagaAkceptacji: false });
  });

  it("kupujący w limicie zamawia od ręki", () => {
    expect(czyMozeZlozyc(kupujacy, 4200, zespol)).toEqual({ ok: true, wymagaAkceptacji: false });
  });

  it("powyżej limitu zamówienie idzie do akceptacji, a nie do kosza", () => {
    const wynik = czyMozeZlozyc(kupujacy, 12000, zespol);
    expect(wynik.ok).toBe(true);
    if (!wynik.ok || !wynik.wymagaAkceptacji) throw new Error("powinno wymagać akceptacji");
    expect(wynik.akceptujacy.map((c) => c.id)).toEqual(["U-1"]);
  });

  it("nie wskazuje samego siebie jako akceptującego", () => {
    const wynik = czyMozeZlozyc(kupujacy, 12000, [kupujacy]);
    expect(wynik.ok).toBe(false);
  });

  it("podgląd nie składa zamówień", () => {
    const wynik = czyMozeZlozyc(podglad, 100, zespol);
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("Podgląd");
  });

  it("nieaktywne konto nie zamawia", () => {
    const wynik = czyMozeZlozyc({ ...kupujacy, aktywny: false }, 100, zespol);
    expect(wynik.ok).toBe(false);
  });

  it("odrzuca zamówienie o wartości zero", () => {
    expect(czyMozeZlozyc(kupujacy, 0, zespol).ok).toBe(false);
  });

  it("nie liczy nieaktywnego właściciela jako akceptującego", () => {
    const wynik = czyMozeZlozyc(kupujacy, 12000, [{ ...wlasciciel, aktywny: false }, kupujacy]);
    expect(wynik.ok).toBe(false);
  });
});

describe("zarządzanie zespołem", () => {
  it("właściciel zmienia rolę", () => {
    const wynik = zmienRole(zespol, "U-3", "kupujacy", wlasciciel);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.zespol.find((c) => c.id === "U-3")?.rola).toBe("kupujacy");
  });

  it("awans na właściciela zdejmuje limit", () => {
    const wynik = zmienRole(zespol, "U-2", "wlasciciel", wlasciciel);
    if (!wynik.ok) throw new Error(wynik.blad);
    expect(wynik.zespol.find((c) => c.id === "U-2")?.limitAkceptacji).toBeNull();
  });

  it("kupujący nie zmienia ról", () => {
    expect(zmienRole(zespol, "U-3", "kupujacy", kupujacy).ok).toBe(false);
  });

  it("nie da się zdegradować jedynego właściciela", () => {
    const wynik = zmienRole(zespol, "U-1", "kupujacy", wlasciciel);
    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toContain("jedyny właściciel");
  });

  it("ustawia limit tylko rolom limitowanym", () => {
    const ok = ustawLimit(zespol, "U-2", 9000, wlasciciel);
    if (!ok.ok) throw new Error(ok.blad);
    expect(ok.zespol.find((c) => c.id === "U-2")?.limitAkceptacji).toBe(9000);
    expect(ustawLimit(zespol, "U-1", 9000, wlasciciel).ok).toBe(false);
  });

  it("odrzuca ujemny limit", () => {
    expect(ustawLimit(zespol, "U-2", -1, wlasciciel).ok).toBe(false);
  });

  it("wyłącza konto, ale nie własne ani ostatniego właściciela", () => {
    expect(wylaczKonto(zespol, "U-2", wlasciciel).ok).toBe(true);
    expect(wylaczKonto(zespol, "U-1", wlasciciel).ok).toBe(false);
    const dwoch = [wlasciciel, czlonek({ id: "U-9", rola: "wlasciciel" })];
    expect(wylaczKonto(dwoch, "U-9", wlasciciel).ok).toBe(true);
  });

  it("nie wyłącza konta wyłączonego", () => {
    const z = [wlasciciel, { ...kupujacy, aktywny: false }];
    expect(wylaczKonto(z, "U-2", wlasciciel).ok).toBe(false);
  });

  it("nie mutuje zespołu wejściowego", () => {
    zmienRole(zespol, "U-3", "kupujacy", wlasciciel);
    expect(zespol.find((c) => c.id === "U-3")?.rola).toBe("podglad");
  });
});

describe("podsumowanie zespołu", () => {
  it("liczy aktywnych, zamawiających i bez limitu", () => {
    expect(podsumujZespol(zespol)).toEqual({ aktywni: 3, zamawiajacy: 2, bezLimitu: 1 });
  });

  it("pomija wyłączonych", () => {
    expect(podsumujZespol([wlasciciel, { ...kupujacy, aktywny: false }])).toEqual({
      aktywni: 1, zamawiajacy: 1, bezLimitu: 1,
    });
  });
});
