import { progiRabatowe } from "@/config/brief";
import { dzienHurtowni } from "@/lib/czas";

/**
 * Warunki handlowe kontrahenta: cenniki z datami, ceny indywidualne,
 * limit kupiecki, forma płatności i blokady.
 *
 * Dziś biuro liczy to ręcznie przy każdym zamówieniu, więc jest to
 * najbardziej wymierne odciążenie po stronie hurtowni.
 *
 * Reguły z `design/004-b2b-crm-erp-spec.md`, sekcje „Ceny i rabaty”
 * oraz „Panel operacyjny Mussi”.
 */

export type FormaPlatnosci =
  | "przedplata"
  | "przelew-7"
  | "przelew-14"
  | "przelew-21"
  | "pobranie"
  | "limit-kupiecki";

export const formyPlatnosci: Array<{ id: FormaPlatnosci; nazwa: string; naKredyt: boolean }> = [
  { id: "przedplata", nazwa: "Przedpłata", naKredyt: false },
  { id: "pobranie", nazwa: "Za pobraniem", naKredyt: false },
  { id: "przelew-7", nazwa: "Przelew 7 dni", naKredyt: true },
  { id: "przelew-14", nazwa: "Przelew 14 dni", naKredyt: true },
  { id: "przelew-21", nazwa: "Przelew 21 dni", naKredyt: true },
  { id: "limit-kupiecki", nazwa: "Limit kupiecki", naKredyt: true },
];

export function naKredyt(forma: FormaPlatnosci): boolean {
  return formyPlatnosci.find((f) => f.id === forma)?.naKredyt ?? false;
}

export type StatusHandlowy = "aktywny" | "weryfikacja" | "blokada";

export type Kontrahent = {
  id: string;
  nazwa: string;
  kodProgu: string;
  formaPlatnosci: FormaPlatnosci;
  limitPrzyznany: number;
  limitWykorzystany: number;
  obrotRoczny: number;
  status: StatusHandlowy;
};

const zaokr = (n: number) => Math.round(n * 100) / 100;

export type Cennik = {
  id: string;
  nazwa: string;
  /** Daty w formacie RRRR-MM-DD. */
  obowiazujeOd: string;
  obowiazujeDo: string | null;
  ceny: Readonly<Record<string, number>>;
};

/* Dzień liczony w strefie hurtowni. Szczegóły i powód w `@/lib/czas`. */
const dzienISO = dzienHurtowni;

export function czyObowiazuje(cennik: Cennik, dzien: Date): boolean {
  const d = dzienISO(dzien);
  if (d < cennik.obowiazujeOd) return false;
  return cennik.obowiazujeDo === null || d <= cennik.obowiazujeDo;
}

/**
 * Cennik obowiązujący danego dnia. Gdy pasuje kilka, wygrywa ten
 * o późniejszej dacie startu, bo to on jest nowszą decyzją hurtowni.
 */
export function obowiazujacyCennik(cenniki: readonly Cennik[], dzien: Date): Cennik | null {
  const pasujace = cenniki.filter((c) => czyObowiazuje(c, dzien));
  if (pasujace.length === 0) return null;
  return pasujace.reduce((a, b) => (a.obowiazujeOd >= b.obowiazujeOd ? a : b));
}

export type CenaIndywidualna = {
  kontrahent: string;
  sku: string;
  cena: number;
  obowiazujeOd: string;
  obowiazujeDo: string | null;
};

export type ZrodloCeny = "indywidualna" | "prog" | "katalogowa" | "brak";

export type UstalonaCena = {
  cena: number;
  zrodlo: ZrodloCeny;
  /** Rabat użyty przy wyliczeniu, zero dla ceny indywidualnej. */
  rabat: number;
  cenaKatalogowa: number | null;
};

/**
 * Cena jednej pozycji dla kontrahenta.
 *
 * Kolejność jest istotna: cena negocjowana indywidualnie bije próg rabatowy,
 * bo została uzgodniona wprost, a próg jest tylko regułą ogólną.
 */
export function ustalCene(
  sku: string,
  kontrahent: Pick<Kontrahent, "id" | "kodProgu">,
  zrodla: {
    cenniki: readonly Cennik[];
    indywidualne?: readonly CenaIndywidualna[];
  },
  dzien: Date = new Date(),
): UstalonaCena {
  const d = dzienISO(dzien);

  const indywidualna = (zrodla.indywidualne ?? []).find(
    (c) =>
      c.kontrahent === kontrahent.id &&
      c.sku === sku &&
      d >= c.obowiazujeOd &&
      (c.obowiazujeDo === null || d <= c.obowiazujeDo),
  );

  const cennik = obowiazujacyCennik(zrodla.cenniki, dzien);
  const katalogowa = cennik?.ceny[sku] ?? null;

  if (indywidualna) {
    return { cena: indywidualna.cena, zrodlo: "indywidualna", rabat: 0, cenaKatalogowa: katalogowa };
  }
  if (katalogowa === null) {
    return { cena: 0, zrodlo: "brak", rabat: 0, cenaKatalogowa: null };
  }

  const prog = progiRabatowe.find((p) => p.kod === kontrahent.kodProgu) ?? progiRabatowe[0];
  if (prog.rabat === 0) {
    return { cena: zaokr(katalogowa), zrodlo: "katalogowa", rabat: 0, cenaKatalogowa: katalogowa };
  }
  return {
    cena: zaokr(katalogowa * (1 - prog.rabat)),
    zrodlo: "prog",
    rabat: prog.rabat,
    cenaKatalogowa: katalogowa,
  };
}

export function dostepnyLimit(k: Pick<Kontrahent, "limitPrzyznany" | "limitWykorzystany">): number {
  return zaokr(k.limitPrzyznany - k.limitWykorzystany);
}

export type DecyzjaHandlowa =
  | { ok: true; ostrzezenie: string | null }
  | { ok: false; blad: string; ostrzezenie: string | null };

/**
 * Czy kontrahent może złożyć zamówienie o tej wartości.
 *
 * Blokada handlowa zatrzymuje wszystko. Kontrahent w weryfikacji może kupować,
 * ale wyłącznie z góry. Limit kupiecki sprawdzamy tylko przy formach
 * płatności odroczonych, bo przy przedpłacie hurtownia nie kredytuje.
 */
export function czyMoznaZlozycZamowienie(
  k: Kontrahent,
  wartoscBrutto: number,
): DecyzjaHandlowa {
  if (k.status === "blokada") {
    return { ok: false, blad: `Kontrahent ${k.nazwa} ma blokadę handlową.`, ostrzezenie: null };
  }
  if (wartoscBrutto <= 0) {
    return { ok: false, blad: "Wartość zamówienia musi być dodatnia.", ostrzezenie: null };
  }

  if (k.status === "weryfikacja" && naKredyt(k.formaPlatnosci)) {
    return {
      ok: false,
      blad: "Kontrahent jest w weryfikacji, więc zamówienie wymaga przedpłaty.",
      ostrzezenie: null,
    };
  }

  if (!naKredyt(k.formaPlatnosci)) {
    return { ok: true, ostrzezenie: null };
  }

  const wolne = dostepnyLimit(k);
  if (wartoscBrutto > wolne) {
    return {
      ok: false,
      blad: `Zamówienie przekracza limit kupiecki o ${zaokr(wartoscBrutto - wolne).toFixed(2)} zł.`,
      ostrzezenie: null,
    };
  }

  const poZamowieniu = zaokr(wolne - wartoscBrutto);
  if (k.limitPrzyznany > 0 && poZamowieniu / k.limitPrzyznany < 0.2) {
    return {
      ok: true,
      ostrzezenie: `Po tym zamówieniu zostanie ${poZamowieniu.toFixed(2)} zł limitu.`,
    };
  }
  return { ok: true, ostrzezenie: null };
}

export type ZmianaWarunkow = Partial<
  Pick<Kontrahent, "kodProgu" | "formaPlatnosci" | "limitPrzyznany" | "status">
>;

export type WpisAudytuWarunkow = {
  kontrahent: string;
  pole: string;
  przed: string;
  po: string;
  autor: string;
  powod: string;
  kiedy: string;
};

export type WynikZmianyWarunkow =
  | { ok: true; kontrahent: Kontrahent; wpisy: WpisAudytuWarunkow[] }
  | { ok: false; blad: string };

const etykietyPol: Record<string, string> = {
  kodProgu: "Próg rabatowy",
  formaPlatnosci: "Forma płatności",
  limitPrzyznany: "Limit kupiecki",
  status: "Status handlowy",
};

/**
 * Zmiana warunków handlowych. Każda zmiana wymaga powodu i zostawia
 * osobny wpis w audycie dla każdego zmienionego pola.
 */
export function zmienWarunki(
  k: Kontrahent,
  zmiana: ZmianaWarunkow,
  autor: string,
  powod: string,
  teraz: Date = new Date(),
): WynikZmianyWarunkow {
  if (!autor.trim()) return { ok: false, blad: "Zmiana warunków wymaga wskazania operatora." };
  if (!powod.trim()) return { ok: false, blad: "Zmiana warunków wymaga podania powodu." };

  if (zmiana.kodProgu && !progiRabatowe.some((p) => p.kod === zmiana.kodProgu)) {
    return { ok: false, blad: `Nieznany próg rabatowy: ${zmiana.kodProgu}.` };
  }
  if (zmiana.limitPrzyznany !== undefined) {
    if (zmiana.limitPrzyznany < 0) {
      return { ok: false, blad: "Limit kupiecki nie może być ujemny." };
    }
    if (zmiana.limitPrzyznany < k.limitWykorzystany) {
      return {
        ok: false,
        blad: `Limit nie może być niższy niż już wykorzystane ${k.limitWykorzystany.toFixed(2)} zł.`,
      };
    }
  }

  const wpisy: WpisAudytuWarunkow[] = [];
  for (const [pole, wartosc] of Object.entries(zmiana) as Array<[keyof ZmianaWarunkow, unknown]>) {
    if (wartosc === undefined) continue;
    const przed = k[pole];
    if (String(przed) === String(wartosc)) continue;
    wpisy.push({
      kontrahent: k.id,
      pole: etykietyPol[pole] ?? pole,
      przed: String(przed),
      po: String(wartosc),
      autor,
      powod,
      kiedy: teraz.toISOString(),
    });
  }

  if (wpisy.length === 0) {
    return { ok: false, blad: "Zmiana nie zmienia żadnego warunku." };
  }

  return { ok: true, kontrahent: { ...k, ...zmiana }, wpisy };
}

/** Ile brakuje do wyższego progu. Wykorzystywane w panelu klienta. */
export function doWyzszegoProgu(obrotRoczny: number): { kod: string; brakuje: number } | null {
  const wyzsze = progiRabatowe.filter((p) => p.odObrotu > obrotRoczny);
  if (wyzsze.length === 0) return null;
  const nastepny = wyzsze.reduce((a, b) => (a.odObrotu < b.odObrotu ? a : b));
  return { kod: nastepny.kod, brakuje: zaokr(nastepny.odObrotu - obrotRoczny) };
}
