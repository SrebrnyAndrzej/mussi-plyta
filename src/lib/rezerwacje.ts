import { rezerwacje as konfig } from "@/config/brief";

/**
 * Rezerwacje stanów magazynowych.
 *
 * Sam licznik przy pozycji nie wystarczy przy zamówieniach online: dwa
 * zamówienia złożone w tej samej minucie muszą walczyć o ten sam arkusz,
 * a wygrać może tylko jedno. Ten moduł trzyma rezerwacje jako zapisy,
 * dzięki czemu wiadomo kto, ile i do kiedy.
 *
 * `Akcesorium.rezerwacje` z `src/data/akcesoria.ts` zostaje jako zbiorcza
 * wartość zalążkowa dla ekranów magazynu. Prawdziwe źródło to te zapisy.
 */

export type StanRezerwacji = "aktywna" | "wygasla" | "zwolniona" | "wydana";

export type Rezerwacja = {
  id: string;
  zamowienie: string;
  sku: string;
  ilosc: number;
  utworzona: string;
  /** Kiedy rezerwacja przepadnie bez potwierdzenia. Null oznacza twardą. */
  wygasa: string | null;
  stan: StanRezerwacji;
};

const GODZINA = 60 * 60 * 1000;

function aktywna(r: Rezerwacja, teraz: Date): boolean {
  if (r.stan !== "aktywna") return false;
  if (!r.wygasa) return true;
  return new Date(r.wygasa).getTime() > teraz.getTime();
}

/** Ile sztuk danego indeksu jest realnie zablokowane w tej chwili. */
export function zarezerwowane(
  sku: string,
  lista: readonly Rezerwacja[],
  teraz: Date = new Date(),
): number {
  return lista
    .filter((r) => r.sku === sku && aktywna(r, teraz))
    .reduce((suma, r) => suma + r.ilosc, 0);
}

/** Ile można jeszcze obiecać klientowi: stan z dokumentów minus żywe rezerwacje. */
export function dostepneDoSprzedazy(
  sku: string,
  stanSystemowy: number,
  lista: readonly Rezerwacja[],
  teraz: Date = new Date(),
): number {
  return stanSystemowy - zarezerwowane(sku, lista, teraz);
}

export type PozycjaDoRezerwacji = {
  sku: string;
  nazwa: string;
  ilosc: number;
};

export type Brak = {
  sku: string;
  nazwa: string;
  potrzeba: number;
  dostepne: number;
  brakuje: number;
};

export type WynikRezerwacji =
  | { ok: true; rezerwacje: Rezerwacja[]; nowe: Rezerwacja[] }
  | { ok: false; blad: string; braki: Brak[] };

/**
 * Rezerwuje cały koszyk albo nic.
 *
 * Częściowa rezerwacja jest gorsza niż jej brak: klient dostaje obietnicę
 * terminu na część zamówienia, a hurtownia blokuje towar pod zamówienie,
 * którego i tak nie zrealizuje w całości. Braki wracają w wyniku, żeby
 * ekran mógł pokazać, czego zabrakło.
 */
export function zarezerwuj(
  lista: readonly Rezerwacja[],
  zlecenie: {
    zamowienie: string;
    pozycje: readonly PozycjaDoRezerwacji[];
    /** Stan systemowy dla każdego indeksu z koszyka. */
    stany: Readonly<Record<string, number>>;
    /** Twarda rezerwacja nie wygasa. Domyślnie miękka, do potwierdzenia. */
    twarda?: boolean;
  },
  teraz: Date = new Date(),
): WynikRezerwacji {
  if (zlecenie.pozycje.length === 0) {
    return { ok: false, blad: "Koszyk jest pusty.", braki: [] };
  }
  if (lista.some((r) => r.zamowienie === zlecenie.zamowienie && aktywna(r, teraz))) {
    return {
      ok: false,
      blad: "To zamówienie ma już aktywne rezerwacje. Zwolnij je przed ponowną rezerwacją.",
      braki: [],
    };
  }
  if (zlecenie.pozycje.some((p) => !Number.isInteger(p.ilosc) || p.ilosc < 1)) {
    return { ok: false, blad: "Ilość każdej pozycji musi być dodatnią liczbą całkowitą.", braki: [] };
  }

  /* Sumujemy po indeksie, bo ten sam towar może wystąpić w koszyku dwa razy. */
  const potrzeby = new Map<string, { nazwa: string; ilosc: number }>();
  for (const p of zlecenie.pozycje) {
    const dotad = potrzeby.get(p.sku);
    potrzeby.set(p.sku, { nazwa: p.nazwa, ilosc: (dotad?.ilosc ?? 0) + p.ilosc });
  }

  const braki: Brak[] = [];
  for (const [sku, { nazwa, ilosc }] of potrzeby) {
    const stan = zlecenie.stany[sku];
    if (stan === undefined) {
      return { ok: false, blad: `Brak stanu magazynowego dla indeksu ${sku}.`, braki: [] };
    }
    const wolne = dostepneDoSprzedazy(sku, stan, lista, teraz);
    if (wolne < ilosc) {
      braki.push({ sku, nazwa, potrzeba: ilosc, dostepne: Math.max(wolne, 0), brakuje: ilosc - wolne });
    }
  }

  if (braki.length > 0) {
    return { ok: false, blad: "Nie ma pokrycia na cały koszyk.", braki };
  }

  const wygasa = zlecenie.twarda
    ? null
    : new Date(teraz.getTime() + konfig.wygasanieGodzin * GODZINA).toISOString();

  const nowe: Rezerwacja[] = [...potrzeby].map(([sku, { ilosc }], index) => ({
    id: `${zlecenie.zamowienie}-${sku}-${index}`,
    zamowienie: zlecenie.zamowienie,
    sku,
    ilosc,
    utworzona: teraz.toISOString(),
    wygasa,
    stan: "aktywna",
  }));

  return { ok: true, rezerwacje: [...lista, ...nowe], nowe };
}

/** Potwierdzenie zamówienia zamienia rezerwację miękką w twardą. */
export function utwardz(
  lista: readonly Rezerwacja[],
  zamowienie: string,
  teraz: Date = new Date(),
): { rezerwacje: Rezerwacja[]; zmienione: number } {
  let zmienione = 0;
  const rezerwacje = lista.map((r) => {
    if (r.zamowienie !== zamowienie || !aktywna(r, teraz)) return r;
    zmienione += 1;
    return { ...r, wygasa: null };
  });
  return { rezerwacje, zmienione };
}

export type WpisRezerwacji = {
  zamowienie: string;
  sku: string;
  ilosc: number;
  zdarzenie: "zwolniona" | "wygasla" | "wydana";
  powod: string | null;
  kiedy: string;
};

/**
 * Zamyka rezerwacje, którym minął czas. Uruchamiane cyklicznie,
 * żeby towar z niepotwierdzonych zamówień wracał do sprzedaży.
 */
export function wygasPrzeterminowane(
  lista: readonly Rezerwacja[],
  teraz: Date = new Date(),
): { rezerwacje: Rezerwacja[]; wpisy: WpisRezerwacji[] } {
  const wpisy: WpisRezerwacji[] = [];
  const rezerwacje = lista.map((r) => {
    if (r.stan !== "aktywna" || !r.wygasa) return r;
    if (new Date(r.wygasa).getTime() > teraz.getTime()) return r;
    wpisy.push({
      zamowienie: r.zamowienie,
      sku: r.sku,
      ilosc: r.ilosc,
      zdarzenie: "wygasla",
      powod: "Brak potwierdzenia w wyznaczonym czasie",
      kiedy: teraz.toISOString(),
    });
    return { ...r, stan: "wygasla" as const };
  });
  return { rezerwacje, wpisy };
}

function zamknij(
  lista: readonly Rezerwacja[],
  zamowienie: string,
  stan: Extract<StanRezerwacji, "zwolniona" | "wydana">,
  powod: string | null,
  teraz: Date,
): { rezerwacje: Rezerwacja[]; wpisy: WpisRezerwacji[] } {
  const wpisy: WpisRezerwacji[] = [];
  const rezerwacje = lista.map((r) => {
    if (r.zamowienie !== zamowienie || r.stan !== "aktywna") return r;
    wpisy.push({
      zamowienie: r.zamowienie,
      sku: r.sku,
      ilosc: r.ilosc,
      zdarzenie: stan,
      powod,
      kiedy: teraz.toISOString(),
    });
    return { ...r, stan };
  });
  return { rezerwacje, wpisy };
}

/** Anulowanie zamówienia oddaje towar do sprzedaży. */
export function zwolnij(
  lista: readonly Rezerwacja[],
  zamowienie: string,
  powod: string,
  teraz: Date = new Date(),
) {
  return zamknij(lista, zamowienie, "zwolniona", powod, teraz);
}

/** Wydanie towaru zamyka rezerwację i zdejmuje stan z magazynu. */
export function wydaj(
  lista: readonly Rezerwacja[],
  zamowienie: string,
  teraz: Date = new Date(),
) {
  return zamknij(lista, zamowienie, "wydana", null, teraz);
}

export type PodsumowanieRezerwacji = {
  aktywne: number;
  sztuk: number;
  najblizszeWygasniecie: string | null;
};

export function podsumujRezerwacje(
  lista: readonly Rezerwacja[],
  teraz: Date = new Date(),
): PodsumowanieRezerwacji {
  const zywe = lista.filter((r) => aktywna(r, teraz));
  const terminy = zywe
    .map((r) => r.wygasa)
    .filter((w): w is string => w !== null)
    .sort();
  return {
    aktywne: zywe.length,
    sztuk: zywe.reduce((suma, r) => suma + r.ilosc, 0),
    najblizszeWygasniecie: terminy[0] ?? null,
  };
}
