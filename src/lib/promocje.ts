/**
 * Promocje i reklamy pokazywane na stronie głównej.
 *
 * Miejsce w hero było wcześniej zajęte przez makietę rozkroju. Hurtownia
 * chce tam pokazywać własne przeceny, więc treść musi pochodzić z panelu
 * pracownika, a nie z kodu.
 *
 * Świadomie bez zdjęć produktowych: kontrakt estetyczny zabrania fabrykowania
 * fotografii, a hurtownia ich nie ma. Baner niesie hasło, warunek i termin.
 */

export type Promocja = {
  id: string;
  /** Krótkie hasło, na przykład „Zawiasy Blum taniej o 25%". */
  tytul: string;
  /** Jedno zdanie warunku albo zakresu. */
  opis: string;
  /** Etykieta wyróżnika, na przykład „-25%" albo „Nowość". */
  etykieta: string;
  producent: string | null;
  /** Dokąd prowadzi baner. Pusta wartość oznacza baner bez odnośnika. */
  odnosnik: string | null;
  /** Ścieżka do grafiki w `public`. Null oznacza baner czysto typograficzny. */
  grafika: string | null;
  obowiazujeOd: string;
  obowiazujeDo: string | null;
  aktywna: boolean;
  /** Niższa liczba wyświetla się wcześniej. */
  kolejnosc: number;
};

const dzienISO = (d: Date) => d.toISOString().slice(0, 10);

export function czyTrwa(p: Promocja, dzien: Date = new Date()): boolean {
  if (!p.aktywna) return false;
  const d = dzienISO(dzien);
  if (d < p.obowiazujeOd) return false;
  return p.obowiazujeDo === null || d <= p.obowiazujeDo;
}

/** Promocje do pokazania klientowi, w kolejności ustalonej przez hurtownię. */
export function aktywnePromocje(
  lista: readonly Promocja[],
  dzien: Date = new Date(),
): Promocja[] {
  return lista
    .filter((p) => czyTrwa(p, dzien))
    .sort((a, b) => a.kolejnosc - b.kolejnosc || a.id.localeCompare(b.id));
}

/**
 * Ile pełnych dni zostało do końca. Null dla promocji bezterminowej.
 *
 * Liczone na dniach kalendarzowych, nie na znacznikach czasu. Inaczej promocja
 * kończąca się dzisiaj zwracałaby jeden dzień i komunikat „ostatni dzień"
 * nigdy by się nie pokazał.
 */
export function dniDoKonca(p: Promocja, dzien: Date = new Date()): number | null {
  if (!p.obowiazujeDo) return null;
  const koniec = Date.parse(`${p.obowiazujeDo}T00:00:00Z`);
  const dzis = Date.parse(`${dzienISO(dzien)}T00:00:00Z`);
  return Math.max(0, Math.round((koniec - dzis) / 86_400_000));
}

export type BladPromocji = string;

/**
 * Sprawdzenie przed zapisem.
 *
 * Baner idzie na stronę główną, więc pusty tytuł albo odwrócone daty
 * zobaczyłby klient. Lepiej odmówić zapisu niż opublikować śmieć.
 */
export function walidujPromocje(p: Omit<Promocja, "id">): BladPromocji[] {
  const bledy: BladPromocji[] = [];

  if (p.tytul.trim().length < 5) bledy.push("Hasło musi mieć co najmniej 5 znaków.");
  if (p.tytul.length > 80) bledy.push("Hasło jest za długie, maksimum 80 znaków.");
  if (p.opis.trim().length < 10) bledy.push("Opis musi wyjaśniać warunek, minimum 10 znaków.");
  if (p.opis.length > 160) bledy.push("Opis jest za długi, maksimum 160 znaków.");
  if (!p.etykieta.trim()) bledy.push("Etykieta nie może być pusta.");
  if (p.etykieta.length > 12) bledy.push("Etykieta jest za długa, maksimum 12 znaków.");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.obowiazujeOd)) {
    bledy.push("Data początku jest niepoprawna.");
  }
  if (p.obowiazujeDo !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.obowiazujeDo)) {
      bledy.push("Data końca jest niepoprawna.");
    } else if (p.obowiazujeDo < p.obowiazujeOd) {
      bledy.push("Data końca wypada przed początkiem.");
    }
  }

  if (p.odnosnik !== null && !p.odnosnik.startsWith("/")) {
    bledy.push("Odnośnik musi być ścieżką w portalu, zaczynającą się od ukośnika.");
  }

  if (p.grafika !== null && !p.grafika.startsWith("/")) {
    bledy.push("Grafika musi być plikiem z katalogu publicznego, ścieżką od ukośnika.");
  }

  if (!Number.isInteger(p.kolejnosc) || p.kolejnosc < 0) {
    bledy.push("Kolejność musi być liczbą całkowitą nie mniejszą niż zero.");
  }

  return bledy;
}

export type WynikPromocji =
  | { ok: true; promocje: Promocja[]; promocja: Promocja }
  | { ok: false; bledy: BladPromocji[] };

export function dodajPromocje(
  lista: readonly Promocja[],
  nowa: Omit<Promocja, "id">,
  id: string,
): WynikPromocji {
  const bledy = walidujPromocje(nowa);
  if (lista.some((p) => p.id === id)) bledy.push("Promocja o tym identyfikatorze już istnieje.");
  if (bledy.length > 0) return { ok: false, bledy };

  const promocja: Promocja = { ...nowa, id };
  return { ok: true, promocje: [...lista, promocja], promocja };
}

export function przelaczPromocje(
  lista: readonly Promocja[],
  id: string,
): Promocja[] {
  return lista.map((p) => (p.id === id ? { ...p, aktywna: !p.aktywna } : p));
}

export function usunPromocje(lista: readonly Promocja[], id: string): Promocja[] {
  return lista.filter((p) => p.id !== id);
}

export type PodsumowaniePromocji = {
  wszystkie: number;
  trwajace: number;
  zaplanowane: number;
  zakonczone: number;
};

export function podsumujPromocje(
  lista: readonly Promocja[],
  dzien: Date = new Date(),
): PodsumowaniePromocji {
  const d = dzienISO(dzien);
  return {
    wszystkie: lista.length,
    trwajace: lista.filter((p) => czyTrwa(p, dzien)).length,
    zaplanowane: lista.filter((p) => p.obowiazujeOd > d).length,
    zakonczone: lista.filter((p) => p.obowiazujeDo !== null && p.obowiazujeDo < d).length,
  };
}
