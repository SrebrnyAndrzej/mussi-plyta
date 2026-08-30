import { terminy as konfigTerminy } from "@/config/brief";

/**
 * Cykl życia zamówienia: statusy, okno zmian, wersje i terminy.
 *
 * Zakres produktu zawężony przez klienta: portal ma odciążać biuro hurtowni
 * i przyjmować zamówienia online. Ten moduł obsługuje drugą część, czyli to,
 * co dzieje się z zamówieniem od złożenia do wydania.
 *
 * Reguły pochodzą z `design/004-b2b-crm-erp-spec.md`, sekcje
 * „Model statusów zamówienia”, „Reguła 48 godzin” i „Reguła terminu pięciu dni”.
 */

export type StatusZamowienia =
  | "szkic"
  | "do-potwierdzenia"
  | "okno-zmian"
  | "zablokowane"
  | "oczekuje-na-towar"
  | "w-produkcji"
  | "gotowe-do-odbioru"
  | "w-dostawie"
  | "zrealizowane"
  | "anulowane";

/** Co klient może zrobić z zamówieniem w danym statusie. */
export type TrybEdycji =
  /** Swobodna edycja, zamówienie nie weszło jeszcze do systemu. */
  | "pelna"
  /** Edycja tworzy nową wersję, poprzednia zostaje w historii. */
  | "nowa-wersja"
  /** Można tylko złożyć wniosek o zmianę, decyduje hurtownia. */
  | "wniosek"
  /** Nic nie da się zmienić. */
  | "brak";

export type OpisStatusu = {
  nazwa: string;
  coWidziKlient: string;
  edycja: TrybEdycji;
  /** Czy zamówienie trzyma twardą rezerwację stanów. */
  rezerwuje: boolean;
  koncowy: boolean;
};

export const statusy: Record<StatusZamowienia, OpisStatusu> = {
  szkic: {
    nazwa: "Szkic",
    coWidziKlient: "Niepełny koszyk i bieżąca kalkulacja",
    edycja: "pelna",
    rezerwuje: false,
    koncowy: false,
  },
  "do-potwierdzenia": {
    nazwa: "Do potwierdzenia",
    coWidziKlient: "Kontrola adresu, płatności, stanów i terminu",
    edycja: "pelna",
    rezerwuje: false,
    koncowy: false,
  },
  "okno-zmian": {
    nazwa: "Złożone, okno zmian",
    coWidziKlient: "Odliczanie do końca okna zmian",
    edycja: "nowa-wersja",
    rezerwuje: true,
    koncowy: false,
  },
  zablokowane: {
    nazwa: "Zablokowane",
    coWidziKlient: "Zamówienie przekazane do realizacji",
    edycja: "wniosek",
    rezerwuje: true,
    koncowy: false,
  },
  "oczekuje-na-towar": {
    nazwa: "Oczekuje na towar",
    coWidziKlient: "Brakująca pozycja, przewidywana dostawa i wpływ na termin",
    edycja: "wniosek",
    rezerwuje: true,
    koncowy: false,
  },
  "w-produkcji": {
    nazwa: "W produkcji",
    coWidziKlient: "Etap cięcia, oklejania i kompletacji",
    edycja: "brak",
    rezerwuje: true,
    koncowy: false,
  },
  "gotowe-do-odbioru": {
    nazwa: "Gotowe do odbioru",
    coWidziKlient: "Miejsce, godziny i dokument wydania",
    edycja: "brak",
    rezerwuje: true,
    koncowy: false,
  },
  "w-dostawie": {
    nazwa: "W dostawie",
    coWidziKlient: "Termin i dane dostawy",
    edycja: "brak",
    rezerwuje: true,
    koncowy: false,
  },
  zrealizowane: {
    nazwa: "Zrealizowane",
    coWidziKlient: "Dokumenty i ponowienie zamówienia",
    edycja: "brak",
    rezerwuje: false,
    koncowy: true,
  },
  anulowane: {
    nazwa: "Anulowane",
    coWidziKlient: "Powód, osoba i data decyzji",
    edycja: "brak",
    rezerwuje: false,
    koncowy: true,
  },
};

/** Dozwolone przejścia. Wszystko poza tą mapą jest błędem operatora. */
const przejscia: Record<StatusZamowienia, StatusZamowienia[]> = {
  szkic: ["do-potwierdzenia", "anulowane"],
  "do-potwierdzenia": ["okno-zmian", "szkic", "anulowane"],
  "okno-zmian": ["zablokowane", "oczekuje-na-towar", "anulowane"],
  zablokowane: ["w-produkcji", "oczekuje-na-towar", "anulowane"],
  "oczekuje-na-towar": ["zablokowane", "w-produkcji", "anulowane"],
  "w-produkcji": ["gotowe-do-odbioru", "w-dostawie", "oczekuje-na-towar", "anulowane"],
  "gotowe-do-odbioru": ["zrealizowane", "w-dostawie", "anulowane"],
  "w-dostawie": ["zrealizowane", "anulowane"],
  zrealizowane: [],
  anulowane: [],
};

export function dozwolonePrzejscia(z: StatusZamowienia): StatusZamowienia[] {
  return przejscia[z];
}

export function czyPrzejscieDozwolone(z: StatusZamowienia, na: StatusZamowienia): boolean {
  return przejscia[z].includes(na);
}

const GODZINA = 60 * 60 * 1000;

/**
 * Koniec okna zmian. Liczony od przyjęcia zamówienia przez system,
 * nie od rozpoczęcia szkicu.
 */
export function koniecOknaZmian(przyjeteO: Date): Date {
  return new Date(przyjeteO.getTime() + konfigTerminy.oknoZmianGodzin * GODZINA);
}

export type StanOknaZmian = {
  tryb: TrybEdycji;
  /** Kiedy okno się zamyka. Null, gdy status nie ma okna zmian. */
  doKiedy: Date | null;
  /** Ile milisekund zostało. Zero, gdy okno zamknięte. */
  pozostaloMs: number;
};

/**
 * Czy klient może dziś edytować zamówienie.
 *
 * Sam status nie wystarczy: w `okno-zmian` decyduje jeszcze zegar,
 * a po jego upływie edycja spada do wniosku o zmianę.
 */
export function stanOknaZmian(
  status: StatusZamowienia,
  przyjeteO: Date | null,
  teraz: Date = new Date(),
): StanOknaZmian {
  const tryb = statusy[status].edycja;
  if (tryb !== "nowa-wersja" || !przyjeteO) {
    return { tryb, doKiedy: null, pozostaloMs: 0 };
  }

  const koniec = koniecOknaZmian(przyjeteO);
  const pozostalo = koniec.getTime() - teraz.getTime();
  if (pozostalo <= 0) {
    return { tryb: "wniosek", doKiedy: koniec, pozostaloMs: 0 };
  }
  return { tryb: "nowa-wersja", doKiedy: koniec, pozostaloMs: pozostalo };
}

/** „19 godz. 24 min”. Licznik pokazuje konkretny czas, nie „2 dni”. */
export function pozostalyCzas(ms: number): string {
  if (ms <= 0) return "okno zamknięte";
  const minuty = Math.floor(ms / 60000);
  const godziny = Math.floor(minuty / 60);
  return `${godziny} godz. ${minuty % 60} min`;
}

export type PozycjaZamowienia = {
  id: string;
  nazwa: string;
  ilosc: number;
  netto: number;
};

export type Wersja = {
  numer: number;
  pozycje: PozycjaZamowienia[];
  wartoscNetto: number;
  /** Prognoza terminu przeliczona dla tej wersji. */
  prognoza: Date;
  utworzona: Date;
  autor: string;
  /** Powód zmiany. Pierwsza wersja go nie ma. */
  powod: string | null;
};

export type Zamowienie = {
  id: string;
  status: StatusZamowienia;
  /** Kiedy system przyjął zamówienie. Null dla szkicu. */
  przyjeteO: Date | null;
  terminOczekiwany: Date | null;
  terminPotwierdzony: Date | null;
  wersje: Wersja[];
};

export function aktualnaWersja(z: Zamowienie): Wersja {
  return z.wersje[z.wersje.length - 1];
}

const zaokr = (n: number) => Math.round(n * 100) / 100;

export function wartoscPozycji(pozycje: readonly PozycjaZamowienia[]): number {
  return zaokr(pozycje.reduce((suma, p) => suma + p.netto, 0));
}

export type WpisAudytuZamowienia = {
  zamowienie: string;
  rodzaj: "wersja" | "status" | "wniosek";
  opis: string;
  autor: string;
  powod: string | null;
  kiedy: string;
};

export type WynikZamowienia<T> =
  | ({ ok: true } & T)
  | { ok: false; blad: string };

/**
 * Nowa wersja zamówienia. Poprzednia zostaje w historii, a cena i prognoza
 * terminu są liczone od nowa. Nie mutuje wejścia.
 */
export function utworzWersje(
  zamowienie: Zamowienie,
  zmiana: {
    pozycje: PozycjaZamowienia[];
    powod: string;
    autor: string;
    /** Prognoza po przeliczeniu dostępności. */
    prognoza: Date;
  },
  teraz: Date = new Date(),
): WynikZamowienia<{ zamowienie: Zamowienie; wersja: Wersja; wpis: WpisAudytuZamowienia }> {
  const stan = stanOknaZmian(zamowienie.status, zamowienie.przyjeteO, teraz);

  if (stan.tryb === "brak") {
    return { ok: false, blad: `Status „${statusy[zamowienie.status].nazwa}” nie pozwala na zmiany.` };
  }
  if (stan.tryb === "wniosek") {
    return { ok: false, blad: "Okno zmian jest zamknięte. Zostaje wniosek o zmianę." };
  }
  if (zmiana.pozycje.length === 0) {
    return { ok: false, blad: "Zamówienie musi mieć co najmniej jedną pozycję." };
  }
  if (!zmiana.powod.trim()) {
    return { ok: false, blad: "Zmiana wersji wymaga podania powodu." };
  }
  if (!zmiana.autor.trim()) {
    return { ok: false, blad: "Zmiana wersji wymaga wskazania osoby." };
  }
  if (zmiana.pozycje.some((p) => !Number.isInteger(p.ilosc) || p.ilosc < 1)) {
    return { ok: false, blad: "Ilość każdej pozycji musi być dodatnią liczbą całkowitą." };
  }

  const poprzednia = aktualnaWersja(zamowienie);
  const wersja: Wersja = {
    numer: poprzednia.numer + 1,
    pozycje: zmiana.pozycje.map((p) => ({ ...p })),
    wartoscNetto: wartoscPozycji(zmiana.pozycje),
    prognoza: zmiana.prognoza,
    utworzona: teraz,
    autor: zmiana.autor,
    powod: zmiana.powod,
  };

  return {
    ok: true,
    zamowienie: { ...zamowienie, wersje: [...zamowienie.wersje, wersja] },
    wersja,
    wpis: {
      zamowienie: zamowienie.id,
      rodzaj: "wersja",
      opis: `Wersja ${wersja.numer}, wartość ${wersja.wartoscNetto.toFixed(2)} zł netto`,
      autor: zmiana.autor,
      powod: zmiana.powod,
      kiedy: teraz.toISOString(),
    },
  };
}

/**
 * Zmiana statusu. Operacyjna zmiana wykonana przez pracownika wymaga powodu
 * i zostawia ślad w audycie.
 */
export function zmienStatus(
  zamowienie: Zamowienie,
  na: StatusZamowienia,
  autor: string,
  powod: string,
  teraz: Date = new Date(),
): WynikZamowienia<{ zamowienie: Zamowienie; wpis: WpisAudytuZamowienia }> {
  if (zamowienie.status === na) {
    return { ok: false, blad: "Zamówienie jest już w tym statusie." };
  }
  if (!czyPrzejscieDozwolone(zamowienie.status, na)) {
    return {
      ok: false,
      blad: `Przejście z „${statusy[zamowienie.status].nazwa}” do „${statusy[na].nazwa}” nie jest dozwolone.`,
    };
  }
  if (!autor.trim()) {
    return { ok: false, blad: "Zmiana statusu wymaga wskazania operatora." };
  }
  if (!powod.trim()) {
    return { ok: false, blad: "Zmiana statusu wymaga podania powodu." };
  }

  /* Przyjęcie do systemu uruchamia zegar okna zmian. */
  const przyjeteO =
    na === "okno-zmian" && !zamowienie.przyjeteO ? teraz : zamowienie.przyjeteO;

  return {
    ok: true,
    zamowienie: { ...zamowienie, status: na, przyjeteO },
    wpis: {
      zamowienie: zamowienie.id,
      rodzaj: "status",
      opis: `${statusy[zamowienie.status].nazwa} na ${statusy[na].nazwa}`,
      autor,
      powod,
      kiedy: teraz.toISOString(),
    },
  };
}

export type WniosekOZmiane = {
  zamowienie: string;
  tresc: string;
  autor: string;
  kiedy: string;
  stan: "zlozony";
};

/**
 * Wniosek o zmianę po zamknięciu okna. Nie modyfikuje zamówienia,
 * czeka na decyzję hurtowni.
 */
export function zlozWniosekOZmiane(
  zamowienie: Zamowienie,
  tresc: string,
  autor: string,
  teraz: Date = new Date(),
): WynikZamowienia<{ wniosek: WniosekOZmiane; wpis: WpisAudytuZamowienia }> {
  const stan = stanOknaZmian(zamowienie.status, zamowienie.przyjeteO, teraz);
  if (stan.tryb === "brak") {
    return { ok: false, blad: `Status „${statusy[zamowienie.status].nazwa}” nie przyjmuje już wniosków.` };
  }
  if (stan.tryb === "pelna" || stan.tryb === "nowa-wersja") {
    return { ok: false, blad: "Zamówienie można jeszcze edytować bez wniosku." };
  }
  if (tresc.trim().length < 10) {
    return { ok: false, blad: "Wniosek musi opisywać zmianę, minimum 10 znaków." };
  }
  if (!autor.trim()) {
    return { ok: false, blad: "Wniosek wymaga wskazania osoby." };
  }

  return {
    ok: true,
    wniosek: { zamowienie: zamowienie.id, tresc: tresc.trim(), autor, kiedy: teraz.toISOString(), stan: "zlozony" },
    wpis: {
      zamowienie: zamowienie.id,
      rodzaj: "wniosek",
      opis: "Wniosek o zmianę po zamknięciu okna",
      autor,
      powod: null,
      kiedy: teraz.toISOString(),
    },
  };
}

/**
 * Termin oczekiwany ze standardowych dni realizacji.
 *
 * Czy liczymy dni robocze i jaka jest godzina graniczna, ustala
 * `terminy` w `brief.ts`. Kalendarz świąt czeka na decyzję klienta,
 * więc dziś pomijamy wyłącznie soboty i niedziele.
 */
export function terminOczekiwany(zlozoneO: Date): Date {
  const { dniRealizacji, dniRobocze, godzinaGraniczna } = konfigTerminy;
  const start = new Date(zlozoneO);
  /* Zamówienie po godzinie granicznej liczy się jak złożone następnego dnia. */
  if (start.getHours() >= godzinaGraniczna) start.setDate(start.getDate() + 1);

  let zostalo = dniRealizacji;
  const wynik = new Date(start);
  while (zostalo > 0) {
    wynik.setDate(wynik.getDate() + 1);
    const dzien = wynik.getDay();
    if (!dniRobocze || (dzien !== 0 && dzien !== 6)) zostalo -= 1;
  }
  return wynik;
}

export type DostepnoscKoszyka = "cala" | "czesciowa" | "do-potwierdzenia";

/**
 * Komunikat przed złożeniem zamówienia. Klient nie może zobaczyć
 * standardowego terminu jako gwarancji, jeśli część koszyka nie jest dostępna.
 */
export function komunikatTerminu(
  dostepnosc: DostepnoscKoszyka,
  termin: Date | null,
  dataDostawyBraku: Date | null = null,
): string {
  const dzien = (d: Date) => d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });

  if (dostepnosc === "cala" && termin) {
    return `Towar zarezerwowany, realizacja do ${dzien(termin)}`;
  }
  if (dostepnosc === "czesciowa") {
    return dataDostawyBraku
      ? `Część towaru oczekuje na dostawę, przewidywany termin ${dzien(dataDostawyBraku)}`
      : "Część towaru oczekuje na dostawę, termin dostawy nie jest jeszcze znany";
  }
  return "Termin wymaga potwierdzenia przez Mussi";
}

export type Terminy = {
  oczekiwany: Date | null;
  potwierdzony: Date | null;
  prognoza: Date | null;
};

/**
 * Trzy terminy trzymane osobno. Prognoza bierze się z aktualnej wersji,
 * bo to ona uwzględnia ostatnie przeliczenie dostępności.
 */
export function terminyZamowienia(z: Zamowienie): Terminy {
  return {
    oczekiwany: z.terminOczekiwany,
    potwierdzony: z.terminPotwierdzony,
    prognoza: z.wersje.length > 0 ? aktualnaWersja(z).prognoza : null,
  };
}

/** Czy prognoza wypadła po terminie potwierdzonym, czyli czy jest opóźnienie. */
export function czyOpoznienie(z: Zamowienie): boolean {
  const { potwierdzony, prognoza } = terminyZamowienia(z);
  if (!potwierdzony || !prognoza) return false;
  return prognoza.getTime() > potwierdzony.getTime();
}
