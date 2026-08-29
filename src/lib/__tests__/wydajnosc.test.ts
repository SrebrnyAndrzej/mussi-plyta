import { describe, expect, it } from "vitest";
import { policzRozkroj, type Formatka } from "@/lib/nesting";

const f = (d: number, s: number, q: number): Formatka => ({
  dlugosc: d, szerokosc: s, obrzeze: [1, 1, 1, 1], sztuk: q, sloje: false,
});

describe("wydajność rozkroju", () => {
  it("kuchnia typowa liczy się natychmiast", () => {
    const t = performance.now();
    policzRozkroj([f(720, 560, 8), f(564, 500, 6), f(600, 560, 4)]);
    const ms = performance.now() - t;
    console.log("  typowa kuchnia:", ms.toFixed(1), "ms");
    expect(ms).toBeLessThan(50);
  });

  it("duże zlecenie, 600 sztuk, mieści się w budżecie klatki", () => {
    const t = performance.now();
    const w = policzRozkroj([f(720, 560, 200), f(564, 500, 200), f(396, 300, 200)]);
    const ms = performance.now() - t;
    console.log("  600 sztuk:", ms.toFixed(1), "ms, arkuszy:", w.arkuszy);
    expect(ms).toBeLessThan(500);
  });

  it("skrajnie duże zlecenie nie zawiesza przeglądarki", () => {
    const t = performance.now();
    const w = policzRozkroj([f(300, 200, 2000)]);
    const ms = performance.now() - t;
    console.log("  2000 sztuk:", ms.toFixed(1), "ms, arkuszy:", w.arkuszy);
    expect(ms).toBeLessThan(3000);
  });
});
