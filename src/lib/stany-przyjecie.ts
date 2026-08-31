/**
 * Przyjęcie stanów magazynowych z systemu sprzedażowego.
 *
 * Integrator czyta bazę hurtowni i wypycha tu paczkę stanów. Ten moduł jest
 * bramą: sprawdza paczkę, zanim cokolwiek trafi do portalu.
 *
 * Główne założenie: **awaria ma być głośna**. Zepsute zapytanie po stronie
 * integratora zwykle nie wywala się błędem, tylko zwraca pustą albo obciętą
 * listę. Gdyby portal to przyjął, pokazałby klientom zerowe stany i zablokował
 * sprzedaż, a nikt nie wiedziałby dlaczego. Dlatego podejrzanie małą paczkę
 * odrzucamy zamiast zastosować.
 */

export type PozycjaStanu = {
  sku: string;
  /** Ilość z dokumentów. Ułamkowa jest dozwolona, bo obrzeża idą na metry. */
  stan: number;
  rezerwacje: number;
};

export type PaczkaStanow = {
  zrodlo: string;
  /** Znacznik z chwili odczytu po stronie hurtowni, nie z chwili wysyłki. */
  wygenerowano: string;
  /** Identyfikator paczki. Powtórzone przyjęcie tej samej nie zmienia niczego. */
  partia: string;
  pozycje: PozycjaStanu[];
};

export type OdrzuconaPozycja = { sku: string; powod: string };

export type ZmianaStanu = {
  sku: string;
  stanPrzed: number;
  stanPo: number;
  rezerwacjePrzed: number;
  rezerwacjePo: number;
};

export type WynikPrzyjecia =
  | {
      ok: true;
      zmiany: ZmianaStanu[];
      odrzucone: OdrzuconaPozycja[];
      nieznane: string[];
      bezZmian: number;
    }
  | { ok: false; blad: string; odrzucone: OdrzuconaPozycja[] };

/**
 * Ile procent znanych indeksów musi znaleźć się w paczce, żeby uznać ją
 * za wiarygodną. Poniżej tego progu zakładamy zepsute zapytanie, a nie
 * wyprzedany magazyn.
 */
export const PROG_KOMPLETNOSCI = 0.5;

export function walidujPozycje(p: unknown): OdrzuconaPozycja | null {
  if (!p || typeof p !== "object") return { sku: "?", powod: "Pozycja nie jest obiektem." };
  const poz = p as Partial<PozycjaStanu>;

  if (typeof poz.sku !== "string" || poz.sku.trim() === "") {
    return { sku: "?", powod: "Brak indeksu." };
  }
  for (const [pole, wartosc] of [["stan", poz.stan], ["rezerwacje", poz.rezerwacje]] as const) {
    if (typeof wartosc !== "number" || !Number.isFinite(wartosc)) {
      return { sku: poz.sku, powod: `Pole ${pole} nie jest liczbą.` };
    }
    if (wartosc < 0) {
      return { sku: poz.sku, powod: `Pole ${pole} jest ujemne.` };
    }
  }
  return null;
}

/**
 * Sprawdza i stosuje paczkę wobec stanu obecnego.
 *
 * Nie mutuje wejścia. Zwraca listę zmian, żeby wywołujący mógł je zapisać
 * i pokazać operatorowi, co się ruszyło.
 */
export function przyjmijStany(
  paczka: PaczkaStanow,
  obecne: ReadonlyArray<{ sku: string; stanSystemowy: number; rezerwacje: number }>,
  opcje: { ostatniaPartia?: string | null } = {},
): WynikPrzyjecia {
  const odrzucone: OdrzuconaPozycja[] = [];

  if (!paczka.partia?.trim()) {
    return { ok: false, blad: "Paczka nie ma identyfikatora partii.", odrzucone };
  }
  if (opcje.ostatniaPartia && opcje.ostatniaPartia === paczka.partia) {
    return { ok: false, blad: "Ta partia została już przyjęta.", odrzucone };
  }
  if (!Array.isArray(paczka.pozycje) || paczka.pozycje.length === 0) {
    return {
      ok: false,
      blad: "Paczka jest pusta. Pusty odczyt to zwykle zepsute zapytanie, a nie pusty magazyn.",
      odrzucone,
    };
  }

  const widziane = new Set<string>();
  const poprawne: PozycjaStanu[] = [];

  for (const p of paczka.pozycje) {
    const blad = walidujPozycje(p);
    if (blad) {
      odrzucone.push(blad);
      continue;
    }
    const poz = p as PozycjaStanu;
    if (widziane.has(poz.sku)) {
      odrzucone.push({ sku: poz.sku, powod: "Indeks powtórzony w paczce." });
      continue;
    }
    widziane.add(poz.sku);
    poprawne.push(poz);
  }

  if (poprawne.length === 0) {
    return { ok: false, blad: "Żadna pozycja nie przeszła sprawdzenia.", odrzucone };
  }

  /* Bramka kompletności. Chroni przed cichym wyzerowaniem magazynu. */
  const znane = new Set(obecne.map((o) => o.sku));
  const pokryte = poprawne.filter((p) => znane.has(p.sku)).length;
  if (znane.size > 0 && pokryte / znane.size < PROG_KOMPLETNOSCI) {
    return {
      ok: false,
      blad:
        `Paczka pokrywa ${pokryte} z ${znane.size} znanych indeksów, ` +
        `czyli poniżej progu ${Math.round(PROG_KOMPLETNOSCI * 100)}%. ` +
        "Wygląda na obcięty odczyt, więc nie stosuję jej.",
      odrzucone,
    };
  }

  const wgSku = new Map(obecne.map((o) => [o.sku, o]));
  const zmiany: ZmianaStanu[] = [];
  const nieznane: string[] = [];
  let bezZmian = 0;

  for (const p of poprawne) {
    const teraz = wgSku.get(p.sku);
    if (!teraz) {
      nieznane.push(p.sku);
      continue;
    }
    if (teraz.stanSystemowy === p.stan && teraz.rezerwacje === p.rezerwacje) {
      bezZmian += 1;
      continue;
    }
    zmiany.push({
      sku: p.sku,
      stanPrzed: teraz.stanSystemowy,
      stanPo: p.stan,
      rezerwacjePrzed: teraz.rezerwacje,
      rezerwacjePo: p.rezerwacje,
    });
  }

  return { ok: true, zmiany, odrzucone, nieznane, bezZmian };
}

export type PodsumowanieSynchronizacji = {
  zmienione: number;
  bezZmian: number;
  odrzucone: number;
  nieznane: number;
  najwiekszySkok: ZmianaStanu | null;
};

/** Co pokazać operatorowi po synchronizacji. */
export function podsumujPrzyjecie(w: WynikPrzyjecia): PodsumowanieSynchronizacji | null {
  if (!w.ok) return null;
  const najwiekszy = w.zmiany.reduce<ZmianaStanu | null>((max, z) => {
    const skok = Math.abs(z.stanPo - z.stanPrzed);
    if (!max || skok > Math.abs(max.stanPo - max.stanPrzed)) return z;
    return max;
  }, null);
  return {
    zmienione: w.zmiany.length,
    bezZmian: w.bezZmian,
    odrzucone: w.odrzucone.length,
    nieznane: w.nieznane.length,
    najwiekszySkok: najwiekszy,
  };
}
