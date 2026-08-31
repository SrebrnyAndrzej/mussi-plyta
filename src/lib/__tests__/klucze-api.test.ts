import { describe, expect, it } from "vitest";
import {
  rozbijKlucz,
  skrot,
  utworzKlucz,
  wczytajKlucze,
  zweryfikujKlucz,
  type KluczApi,
} from "@/lib/klucze-api";

/**
 * Klucze API.
 *
 * To jedyna rzecz, która stoi między cudzą aplikacją a cenami kontrahentów,
 * więc testujemy nie tylko szczęśliwą ścieżkę, ale każdy powód odmowy.
 */

const DZIS = new Date("2026-09-01T10:00:00Z");

function klucz(nadpisz: Partial<KluczApi> = {}): KluczApi {
  return {
    id: "abcd1234",
    kontrahent: "K-00128",
    skrot: skrot("tajne"),
    zakresy: ["cennik"],
    aktywny: true,
    wazneDo: null,
    ...nadpisz,
  };
}

describe("kształt klucza", () => {
  it("nowy klucz da się od razu zweryfikować", () => {
    const { doPrzekazania, wpis } = utworzKlucz("K-00128");
    expect(zweryfikujKlucz(`Bearer ${doPrzekazania}`, [wpis], "cennik", DZIS)).toMatchObject({
      ok: true,
    });
  });

  it("sekret nie zostaje u nas w postaci jawnej", () => {
    const { doPrzekazania, wpis } = utworzKlucz("K-00128");
    const sekret = rozbijKlucz(doPrzekazania)!.sekret;
    expect(wpis.skrot).not.toContain(sekret);
    expect(wpis.skrot).toBe(skrot(sekret));
  });

  it("dwa klucze nigdy nie są takie same", () => {
    const a = utworzKlucz("K-00128").doPrzekazania;
    const b = utworzKlucz("K-00128").doPrzekazania;
    expect(a).not.toBe(b);
  });

  it("rozbija poprawny klucz i odrzuca zepsuty", () => {
    expect(rozbijKlucz("mussi_abcd_sekret")).toEqual({ id: "abcd", sekret: "sekret" });
    /* Sekret w base64url ma prawo zawierać podkreślenie i myślnik. */
    expect(rozbijKlucz("mussi_abcd_se_kr-et")).toEqual({ id: "abcd", sekret: "se_kr-et" });
    expect(rozbijKlucz("obcy_abcd_sekret")).toBeNull();
    expect(rozbijKlucz("mussi_abcd")).toBeNull();
    expect(rozbijKlucz("")).toBeNull();
  });
});

describe("odmowy", () => {
  it("brak nagłówka", () => {
    expect(zweryfikujKlucz(null, [klucz()], "cennik", DZIS)).toEqual({
      ok: false,
      powod: "brak-naglowka",
    });
  });

  it("nieznany identyfikator", () => {
    expect(zweryfikujKlucz("Bearer mussi_ffff9999_tajne", [klucz()], "cennik", DZIS)).toEqual({
      ok: false,
      powod: "nieznany-klucz",
    });
  });

  it("dobry identyfikator, zły sekret", () => {
    expect(zweryfikujKlucz("Bearer mussi_abcd1234_nietajne", [klucz()], "cennik", DZIS)).toEqual({
      ok: false,
      powod: "zly-sekret",
    });
  });

  it("klucz wyłączony nie wpuszcza, choć sekret się zgadza", () => {
    expect(
      zweryfikujKlucz("Bearer mussi_abcd1234_tajne", [klucz({ aktywny: false })], "cennik", DZIS),
    ).toEqual({ ok: false, powod: "wylaczony" });
  });

  it("klucz po terminie nie wpuszcza", () => {
    expect(
      zweryfikujKlucz(
        "Bearer mussi_abcd1234_tajne",
        [klucz({ wazneDo: "2026-08-31" })],
        "cennik",
        DZIS,
      ),
    ).toEqual({ ok: false, powod: "wygasl" });
  });

  it("ostatni dzień ważności jeszcze wpuszcza", () => {
    expect(
      zweryfikujKlucz(
        "Bearer mussi_abcd1234_tajne",
        [klucz({ wazneDo: "2026-09-01" })],
        "cennik",
        DZIS,
      ),
    ).toMatchObject({ ok: true });
  });

  it("klucz bez zakresu nie wchodzi na cudzą trasę", () => {
    expect(
      zweryfikujKlucz("Bearer mussi_abcd1234_tajne", [klucz({ zakresy: [] })], "cennik", DZIS),
    ).toEqual({ ok: false, powod: "poza-zakresem" });
  });

  it("nagłówek bez słowa Bearer też działa", () => {
    expect(zweryfikujKlucz("mussi_abcd1234_tajne", [klucz()], "cennik", DZIS)).toMatchObject({
      ok: true,
    });
  });
});

describe("klucz wskazuje kontrahenta, a nie żądanie", () => {
  it("zwraca firmę przypisaną do klucza", () => {
    const wynik = zweryfikujKlucz(
      "Bearer mussi_abcd1234_tajne",
      [klucz({ kontrahent: "K-00074" })],
      "cennik",
      DZIS,
    );
    expect(wynik.ok && wynik.klucz.kontrahent).toBe("K-00074");
  });
});

describe("wczytywanie konfiguracji", () => {
  it("brak zmiennej znaczy brak kluczy, a nie awarię", () => {
    expect(wczytajKlucze(undefined)).toEqual([]);
    expect(wczytajKlucze("  ")).toEqual([]);
  });

  it("niepoprawny JSON krzyczy zamiast po cichu wpuszczać", () => {
    expect(() => wczytajKlucze("{to nie json")).toThrow(/JSON/);
  });

  it("wpis bez kompletu pól krzyczy z numerem wpisu", () => {
    expect(() => wczytajKlucze('[{"id":"a","kontrahent":"K-1"}]')).toThrow(/wpis numer 1/);
  });

  it("aktywny domyślnie prawda, ale da się wyłączyć wprost", () => {
    const lista = wczytajKlucze(
      '[{"id":"a","kontrahent":"K-1","skrot":"x","zakresy":["cennik"]},' +
        '{"id":"b","kontrahent":"K-2","skrot":"y","zakresy":["cennik"],"aktywny":false}]',
    );
    expect(lista[0].aktywny).toBe(true);
    expect(lista[1].aktywny).toBe(false);
  });
});
