import { describe, expect, it } from "vitest";
import { parseDelimited, parseMussiTable } from "@/lib/import-formats";

/** Skrót: tak samo jak w kreatorze, tylko bez czytania pliku z dysku. */
const zTekstu = (text: string) => parseMussiTable(parseDelimited(text));

/**
 * Odporność importu na to, co klient naprawdę wrzuci: plik z innego programu,
 * pustą tabelkę, przecinki dziesiętne, końce linii z Windowsa i śmieci.
 */
describe("import listy formatek, odporność", () => {
  it("pusty plik zgłasza błąd zamiast wywracać parser", () => {
    const w = zTekstu("");
    expect(w.rows).toHaveLength(0);
    expect(w.errors.length).toBeGreaterThan(0);
  });

  it("sam nagłówek bez wierszy daje pustą listę", () => {
    const w = zTekstu("dlugosc;szerokosc;sztuk\n");
    expect(w.rows).toHaveLength(0);
  });

  it("plik bez rozpoznawalnego nagłówka nie zwraca śmieci", () => {
    const w = zTekstu("jakis;zupelnie;inny;plik\n1;2;3;4\n");
    expect(w.rows.every((r) => r.dlugosc > 0 && r.szerokosc > 0)).toBe(true);
  });

  it("pomija wiersze bez wymiarów zamiast tworzyć zera", () => {
    const w = zTekstu("dlugosc;szerokosc;sztuk\n720;560;8\n;;\nabc;def;ghi\n");
    expect(w.rows.every((r) => r.dlugosc > 0 && r.szerokosc > 0)).toBe(true);
  });

  it("nie gubi się na końcach linii z Windowsa", () => {
    const a = zTekstu("dlugosc;szerokosc;sztuk\r\n720;560;8\r\n");
    const b = zTekstu("dlugosc;szerokosc;sztuk\n720;560;8\n");
    expect(a.rows.length).toBe(b.rows.length);
    expect(a.rows.length).toBeGreaterThan(0);
  });

  it("rozpoznaje plik rozdzielany tabulatorem i przecinkiem", () => {
    const tab = zTekstu("dlugosc\tszerokosc\tsztuk\n720\t560\t8\n");
    const prz = zTekstu("dlugosc,szerokosc,sztuk\n720,560,8\n");
    expect(tab.rows.length).toBeGreaterThan(0);
    expect(prz.rows.length).toBeGreaterThan(0);
  });

  it("bardzo duży plik nie zawiesza importu", () => {
    const linie = ["dlugosc;szerokosc;sztuk", ...Array.from({ length: 5000 }, () => "720;560;1")];
    const t = performance.now();
    const w = zTekstu(linie.join("\n"));
    const ms = performance.now() - t;
    console.log("  import 5000 wierszy:", ms.toFixed(1), "ms, wczytanych:", w.rows.length);
    expect(ms).toBeLessThan(2000);
    expect(w.rows.length).toBeGreaterThan(0);
  });
});
