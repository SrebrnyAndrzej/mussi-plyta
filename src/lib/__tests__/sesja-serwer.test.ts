import { beforeAll, describe, expect, it } from "vitest";
import {
  WAZNOSC_SEKUND,
  odczytajToken,
  utworzToken,
  wymagajSesji,
} from "@/lib/sesja-serwer";

const TERAZ = new Date("2026-08-31T10:00:00Z");

beforeAll(() => {
  process.env.SESJA_SEKRET = "sekret-do-testow-wystarczajaco-dlugi";
});

describe("podpisywanie i odczyt", () => {
  it("token przechodzi w obie strony", () => {
    const t = utworzToken("klient", "K-00128", TERAZ);
    const w = odczytajToken(t, TERAZ);
    if (!w.ok) throw new Error(w.powod);
    expect(w.sesja.rola).toBe("klient");
    expect(w.sesja.kontrahent).toBe("K-00128");
  });

  it("pracownik hurtowni nie ma kontrahenta", () => {
    const w = odczytajToken(utworzToken("hurtownia", null, TERAZ), TERAZ);
    if (!w.ok) throw new Error(w.powod);
    expect(w.sesja.kontrahent).toBeNull();
  });

  it("wygasa po zadanym czasie", () => {
    const t = utworzToken("klient", "K-1", TERAZ);
    const tuzPrzed = new Date(TERAZ.getTime() + (WAZNOSC_SEKUND - 5) * 1000);
    const poCzasie = new Date(TERAZ.getTime() + (WAZNOSC_SEKUND + 5) * 1000);
    expect(odczytajToken(t, tuzPrzed).ok).toBe(true);
    const w = odczytajToken(t, poCzasie);
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.powod).toBe("wygasl");
  });
});

describe("token nie da się podrobić", () => {
  it("podmieniony ładunek nie przechodzi", () => {
    const t = utworzToken("klient", "K-00128", TERAZ);
    const [, podpis] = t.split(".");
    const obcy = Buffer.from(
      JSON.stringify({ rola: "hurtownia", kontrahent: null, wygasa: 9_999_999_999 }),
    ).toString("base64url");

    const w = odczytajToken(`${obcy}.${podpis}`, TERAZ);
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.powod).toBe("podpis");
  });

  it("przedłużenie ważności przez edycję ładunku nie działa", () => {
    const t = utworzToken("klient", "K-1", TERAZ);
    const [ladunek, podpis] = t.split(".");
    const tresc = JSON.parse(Buffer.from(ladunek, "base64url").toString("utf8"));
    tresc.wygasa += 10 * 365 * 24 * 3600;
    const podrobiony = Buffer.from(JSON.stringify(tresc)).toString("base64url");

    expect(odczytajToken(`${podrobiony}.${podpis}`, TERAZ).ok).toBe(false);
  });

  it("token podpisany innym sekretem odpada", () => {
    const t = utworzToken("klient", "K-1", TERAZ);
    process.env.SESJA_SEKRET = "zupelnie-inny-sekret-tez-dlugi";
    const w = odczytajToken(t, TERAZ);
    process.env.SESJA_SEKRET = "sekret-do-testow-wystarczajaco-dlugi";
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.powod).toBe("podpis");
  });

  it("śmieci i brak tokenu są odrzucane bez wyjątku", () => {
    for (const zly of [undefined, "", "bezkropki", ".", "a.b.c"]) {
      expect(odczytajToken(zly as string | undefined, TERAZ).ok).toBe(false);
    }
  });
});

describe("straż tras API", () => {
  it("bez tokenu zwraca 401", () => {
    const w = wymagajSesji(undefined, undefined, TERAZ);
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.status).toBe(401);
  });

  it("zła rola zwraca 403, a nie 401", () => {
    const t = utworzToken("klient", "K-1", TERAZ);
    const w = wymagajSesji(t, "hurtownia", TERAZ);
    expect(w.ok).toBe(false);
    if (w.ok) return;
    expect(w.status).toBe(403);
    expect(w.blad).toContain("nie ma dostępu");
  });

  it("właściwa rola przechodzi", () => {
    const t = utworzToken("hurtownia", null, TERAZ);
    expect(wymagajSesji(t, "hurtownia", TERAZ).ok).toBe(true);
  });

  it("wygasła sesja mówi wprost, co zrobić", () => {
    const t = utworzToken("klient", "K-1", TERAZ);
    const poCzasie = new Date(TERAZ.getTime() + (WAZNOSC_SEKUND + 60) * 1000);
    const w = wymagajSesji(t, undefined, poCzasie);
    if (w.ok) return;
    expect(w.blad).toContain("Zaloguj się ponownie");
  });
});

describe("brak sekretu w środowisku", () => {
  it("kończy się błędem zamiast podpisywać byle czym", () => {
    const zapamietany = process.env.SESJA_SEKRET;
    process.env.SESJA_SEKRET = "";
    expect(() => utworzToken("klient", "K-1", TERAZ)).toThrow(/SESJA_SEKRET/);
    process.env.SESJA_SEKRET = zapamietany;
  });
});
