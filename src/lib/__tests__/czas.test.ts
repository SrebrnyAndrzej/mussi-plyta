import { describe, expect, it } from "vitest";
import { dniMiedzy, dzienHurtowni } from "@/lib/czas";

/**
 * Dzień kalendarzowy hurtowni.
 *
 * Regresja, od której zaczęły się te testy: cennik ważny do 31 sierpnia
 * był wciąż podawany jako obowiązujący o 00:17 pierwszego września,
 * bo dzień liczyliśmy w UTC, a Polska jest wtedy dwie godziny do przodu.
 */

describe("dzień liczony w strefie hurtowni, nie w UTC", () => {
  it("kwadrans po północy czasu letniego to już nowy dzień", () => {
    /* 2026-08-31 22:17 UTC to 2026-09-01 00:17 w Polsce. */
    expect(dzienHurtowni(new Date("2026-08-31T22:17:00Z"))).toBe("2026-09-01");
  });

  it("kwadrans po północy czasu zimowego też", () => {
    /* Zimą Polska jest godzinę przed UTC. */
    expect(dzienHurtowni(new Date("2026-01-14T23:17:00Z"))).toBe("2026-01-15");
  });

  it("późny wieczór to nadal ten sam dzień", () => {
    expect(dzienHurtowni(new Date("2026-08-31T20:00:00Z"))).toBe("2026-08-31");
  });

  it("południe nie zależy od strefy", () => {
    expect(dzienHurtowni(new Date("2026-06-15T12:00:00Z"))).toBe("2026-06-15");
  });
});

describe("różnica w dniach kalendarzowych", () => {
  it("z wieczora na poranek to jeden dzień, choć minęło kilka godzin", () => {
    expect(dniMiedzy("2026-09-01", "2026-09-02")).toBe(1);
  });

  it("ten sam dzień to zero", () => {
    expect(dniMiedzy("2026-09-01", "2026-09-01")).toBe(0);
  });

  it("przez koniec miesiąca", () => {
    expect(dniMiedzy("2026-08-30", "2026-09-02")).toBe(3);
  });

  it("wstecz wychodzi ujemnie", () => {
    expect(dniMiedzy("2026-09-05", "2026-09-01")).toBe(-4);
  });

  it("przez zmianę czasu nie gubi doby", () => {
    /* Ostatnia niedziela października, zegary cofają się o godzinę. */
    expect(dniMiedzy("2026-10-24", "2026-10-26")).toBe(2);
  });
});
