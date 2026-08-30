import { podmiotyFakturujace, type PodmiotFakturujacyId } from "@/config/brief";
import {
  migawkaPodmiotu,
  numerDokumentu,
  podmiot,
  walidujWystawienie,
  type MigawkaPodmiotu,
  type PozycjaDokumentu,
  type Przypisania,
} from "@/lib/fakturowanie";
import {
  aktualnaWersja,
  statusy,
  type StatusZamowienia,
  type Zamowienie,
} from "@/lib/zamowienia";

/**
 * Dokumenty zamówienia jako obiekty, nie jako przyciski do pobrania.
 *
 * Zadanie 008 dało podział wartości między trzy podmioty i bramkę wystawienia.
 * Tu powstają same dokumenty, każdy przywiązany do konkretnej wersji zamówienia,
 * żeby późniejsza zmiana kartoteki albo koszyka nie zmieniała tego, co już wyszło.
 *
 * Reguły z `design/004-b2b-crm-erp-spec.md`, sekcja „Dokumenty i rozliczenia”:
 * kalkulacja nie jest zamówieniem, potwierdzenie zapisuje wersję i cenę,
 * WZ jest powiązane z wydaniem, faktura i korekta z zamówieniem.
 */

export type RodzajDokumentu = "potwierdzenie" | "wz" | "faktura" | "korekta";

export const rodzaje: Record<RodzajDokumentu, { nazwa: string; skrot: string; fiskalny: boolean }> = {
  potwierdzenie: { nazwa: "Potwierdzenie zamówienia", skrot: "PZ", fiskalny: false },
  wz: { nazwa: "Wydanie zewnętrzne", skrot: "WZ", fiskalny: false },
  faktura: { nazwa: "Faktura", skrot: "FV", fiskalny: true },
  korekta: { nazwa: "Faktura korygująca", skrot: "KFV", fiskalny: true },
};

/**
 * Stan wysyłki do KSeF.
 *
 * Osobne pole, bo integracja ma być adapterem odpornym na awarie.
 * Błąd wysyłki nie może zatrzymać magazynu, o czym mówi `czyBlokujeMagazyn`.
 */
export type StanKsef = "nie-dotyczy" | "oczekuje" | "wyslany" | "blad";

export type DokumentWystawiony = {
  id: string;
  rodzaj: RodzajDokumentu;
  /** Numer w serii podmiotu. Null, dopóki podmiot nie ma nadanej serii. */
  numer: string | null;
  zamowienie: string;
  /** Wersja zamówienia, którą dokument zamraża. */
  wersja: number;
  podmiot: PodmiotFakturujacyId | null;
  migawka: MigawkaPodmiotu | null;
  pozycje: PozycjaDokumentu[];
  netto: number;
  vat: number;
  brutto: number;
  wystawiony: string;
  autor: string;
  /** Numer dokumentu korygowanego. Tylko dla korekty. */
  koryguje: string | null;
  ksef: StanKsef;
};

const STAWKA_VAT = 0.23;
const zaokr = (v: number) => Math.round(v * 100) / 100;

export type WynikDokumentu =
  | { ok: true; dokument: DokumentWystawiony }
  | { ok: false; blad: string; blokady?: string[] };

export type WynikDokumentow =
  | { ok: true; dokumenty: DokumentWystawiony[] }
  | { ok: false; blad: string; blokady: string[] };

function sumy(pozycje: readonly PozycjaDokumentu[]) {
  const netto = zaokr(pozycje.reduce((s, p) => s + p.netto, 0));
  const vat = zaokr(netto * STAWKA_VAT);
  return { netto, vat, brutto: zaokr(netto + vat) };
}

/** Czy dokument danego rodzaju można wystawić w tym statusie zamówienia. */
const dozwoloneStatusy: Record<RodzajDokumentu, StatusZamowienia[]> = {
  potwierdzenie: ["okno-zmian", "zablokowane", "oczekuje-na-towar"],
  wz: ["gotowe-do-odbioru", "w-dostawie", "zrealizowane"],
  faktura: ["zablokowane", "oczekuje-na-towar", "w-produkcji", "gotowe-do-odbioru", "w-dostawie", "zrealizowane"],
  korekta: ["zrealizowane", "w-dostawie", "gotowe-do-odbioru", "w-produkcji", "zablokowane"],
};

export function czyMoznaWystawic(rodzaj: RodzajDokumentu, status: StatusZamowienia): boolean {
  return dozwoloneStatusy[rodzaj].includes(status);
}

/**
 * Potwierdzenie zamówienia. Zamraża wersję i cenę, więc od tej chwili
 * nie ma sporu o to, co i za ile zostało uzgodnione.
 *
 * Nie jest dokumentem fiskalnym, więc nie wymaga danych rejestrowych podmiotu.
 */
export function wystawPotwierdzenie(
  zamowienie: Zamowienie,
  pozycje: readonly PozycjaDokumentu[],
  autor: string,
  teraz: Date = new Date(),
): WynikDokumentu {
  if (!czyMoznaWystawic("potwierdzenie", zamowienie.status)) {
    return { ok: false, blad: `Statusu „${statusy[zamowienie.status].nazwa}” nie potwierdza się dokumentem.` };
  }
  if (pozycje.length === 0) {
    return { ok: false, blad: "Potwierdzenie musi obejmować co najmniej jedną pozycję." };
  }
  if (!autor.trim()) {
    return { ok: false, blad: "Wystawienie dokumentu wymaga wskazania operatora." };
  }

  const wersja = aktualnaWersja(zamowienie).numer;
  return {
    ok: true,
    dokument: {
      id: `PZ-${zamowienie.id}-${wersja}`,
      rodzaj: "potwierdzenie",
      numer: `PZ/${zamowienie.id}/${wersja}`,
      zamowienie: zamowienie.id,
      wersja,
      podmiot: null,
      migawka: null,
      pozycje: pozycje.map((p) => ({ ...p })),
      ...sumy(pozycje),
      wystawiony: teraz.toISOString(),
      autor,
      koryguje: null,
      ksef: "nie-dotyczy",
    },
  };
}

/**
 * Wydanie zewnętrzne, powiązane z faktycznym wydaniem towaru.
 *
 * Świadomie nie sprawdza stanu KSeF: magazyn ma wydawać towar także wtedy,
 * gdy wysyłka faktury się nie powiodła.
 */
export function wystawWz(
  zamowienie: Zamowienie,
  wydanie: {
    podmiot: PodmiotFakturujacyId;
    pozycje: readonly PozycjaDokumentu[];
    autor: string;
    kolejny?: number;
  },
  teraz: Date = new Date(),
): WynikDokumentu {
  if (!czyMoznaWystawic("wz", zamowienie.status)) {
    return { ok: false, blad: "WZ wystawia się dopiero przy wydaniu towaru." };
  }
  if (wydanie.pozycje.length === 0) {
    return { ok: false, blad: "WZ musi obejmować co najmniej jedną pozycję." };
  }
  if (!wydanie.autor.trim()) {
    return { ok: false, blad: "Wystawienie dokumentu wymaga wskazania operatora." };
  }

  const p = podmiot(wydanie.podmiot);
  const wersja = aktualnaWersja(zamowienie).numer;
  return {
    ok: true,
    dokument: {
      id: `WZ-${zamowienie.id}-${wydanie.podmiot}`,
      rodzaj: "wz",
      numer: numerDokumentu(p.seriaWz, wydanie.kolejny ?? 1, teraz.getFullYear()),
      zamowienie: zamowienie.id,
      wersja,
      podmiot: wydanie.podmiot,
      migawka: migawkaPodmiotu(p, teraz.toISOString()),
      pozycje: wydanie.pozycje.map((x) => ({ ...x })),
      ...sumy(wydanie.pozycje),
      wystawiony: teraz.toISOString(),
      autor: wydanie.autor,
      koryguje: null,
      ksef: "nie-dotyczy",
    },
  };
}

/**
 * Faktury dla zamówienia, po jednej na podmiot, który ma przypisane pozycje.
 *
 * Bramka z zadania 008 obowiązuje: podmiot bez kompletu danych rejestrowych
 * nie wystawia dokumentu, a pozycja bez podmiotu blokuje całość.
 */
export function wystawFaktury(
  zamowienie: Zamowienie,
  pozycje: readonly PozycjaDokumentu[],
  przypisania: Przypisania,
  autor: string,
  opcje: { liczniki?: Partial<Record<PodmiotFakturujacyId, number>>; teraz?: Date } = {},
): WynikDokumentow {
  const teraz = opcje.teraz ?? new Date();

  if (!czyMoznaWystawic("faktura", zamowienie.status)) {
    return {
      ok: false,
      blad: `Zamówienie w statusie „${statusy[zamowienie.status].nazwa}” nie jest gotowe do fakturowania.`,
      blokady: [],
    };
  }
  if (!autor.trim()) {
    return { ok: false, blad: "Wystawienie dokumentu wymaga wskazania operatora.", blokady: [] };
  }

  const wynik = walidujWystawienie(pozycje, przypisania, {
    rok: teraz.getFullYear(),
    liczniki: opcje.liczniki,
    kiedy: teraz.toISOString(),
  });

  if (!wynik.ok) {
    return { ok: false, blad: "Wystawienie zablokowane.", blokady: wynik.blokady };
  }

  const wersja = aktualnaWersja(zamowienie).numer;
  return {
    ok: true,
    dokumenty: wynik.dokumenty.map((d) => ({
      id: `FV-${zamowienie.id}-${d.podmiot.id}`,
      rodzaj: "faktura" as const,
      numer: d.numer,
      zamowienie: zamowienie.id,
      wersja,
      podmiot: d.podmiot.id as PodmiotFakturujacyId,
      migawka: d.migawka,
      pozycje: d.pozycje,
      netto: d.netto,
      vat: d.vat,
      brutto: d.brutto,
      wystawiony: teraz.toISOString(),
      autor,
      koryguje: null,
      ksef: "oczekuje" as StanKsef,
    })),
  };
}

/**
 * Korekta faktury. Pozycje podaje się w wartościach docelowych,
 * a dokument niesie różnicę wobec faktury pierwotnej.
 */
export function wystawKorekte(
  faktura: DokumentWystawiony,
  poprawione: readonly PozycjaDokumentu[],
  powod: string,
  autor: string,
  opcje: { kolejny?: number; teraz?: Date } = {},
): WynikDokumentu {
  const teraz = opcje.teraz ?? new Date();

  if (faktura.rodzaj !== "faktura") {
    return { ok: false, blad: "Korygować można wyłącznie fakturę." };
  }
  if (!faktura.numer) {
    return { ok: false, blad: "Nie da się skorygować faktury bez numeru." };
  }
  if (!powod.trim()) {
    return { ok: false, blad: "Korekta wymaga podania powodu." };
  }
  if (!autor.trim()) {
    return { ok: false, blad: "Wystawienie dokumentu wymaga wskazania operatora." };
  }

  const docelowe = sumy(poprawione);
  const roznicaNetto = zaokr(docelowe.netto - faktura.netto);
  if (roznicaNetto === 0) {
    return { ok: false, blad: "Korekta nie zmienia wartości faktury." };
  }

  const p = faktura.podmiot ? podmiot(faktura.podmiot) : null;
  const roznicaVat = zaokr(roznicaNetto * STAWKA_VAT);

  return {
    ok: true,
    dokument: {
      id: `KFV-${faktura.id}`,
      rodzaj: "korekta",
      numer: numerDokumentu(p?.seriaKorekty ?? null, opcje.kolejny ?? 1, teraz.getFullYear()),
      zamowienie: faktura.zamowienie,
      wersja: faktura.wersja,
      podmiot: faktura.podmiot,
      migawka: faktura.migawka,
      pozycje: poprawione.map((x) => ({ ...x })),
      netto: roznicaNetto,
      vat: roznicaVat,
      brutto: zaokr(roznicaNetto + roznicaVat),
      wystawiony: teraz.toISOString(),
      autor,
      koryguje: faktura.numer,
      ksef: "oczekuje",
    },
  };
}

/**
 * Adapter KSeF. Zapisuje wynik wysyłki, nie mutując dokumentu.
 *
 * Wysyłka dotyczy tylko dokumentów fiskalnych. Potwierdzenie i WZ
 * zostają poza obiegiem.
 */
export function oznaczKsef(
  dokument: DokumentWystawiony,
  stan: Exclude<StanKsef, "nie-dotyczy">,
): DokumentWystawiony {
  if (!rodzaje[dokument.rodzaj].fiskalny) return dokument;
  return { ...dokument, ksef: stan };
}

/**
 * Czy stan KSeF wstrzymuje pracę magazynu.
 *
 * Zawsze fałsz, i to jest reguła, nie przeoczenie. Specyfikacja wymaga,
 * żeby awaria KSeF nie blokowała wydania bez kontrolowanej ścieżki awaryjnej.
 * Funkcja istnieje po to, żeby ten warunek dało się przetestować.
 */
export function czyBlokujeMagazyn(): boolean {
  return false;
}

export type SciezkaAwaryjna = {
  potrzebna: boolean;
  komunikat: string;
};

/** Co operator ma zrobić, gdy wysyłka faktury do KSeF się nie powiodła. */
export function sciezkaAwaryjna(dokumenty: readonly DokumentWystawiony[]): SciezkaAwaryjna {
  const bledne = dokumenty.filter((d) => d.ksef === "blad");
  if (bledne.length === 0) {
    return { potrzebna: false, komunikat: "Wszystkie dokumenty przeszły do KSeF." };
  }
  return {
    potrzebna: true,
    komunikat:
      `Wysyłka do KSeF nie powiodła się dla ${bledne.length} z ${dokumenty.length} dokumentów. ` +
      "Wydanie towaru jest możliwe. Ponów wysyłkę po ustąpieniu awarii, numeracja zostaje bez zmian.",
  };
}

export type KompletDokumentow = {
  zamowienie: string;
  dokumenty: DokumentWystawiony[];
  brakuje: RodzajDokumentu[];
};

/**
 * Komplet dokumentów pod jednym numerem zamówienia, mimo że wystawiły je
 * różne podmioty. Tego widoku oczekuje klient.
 */
export function kompletDlaZamowienia(
  zamowienie: string,
  wszystkie: readonly DokumentWystawiony[],
  oczekiwane: RodzajDokumentu[] = ["potwierdzenie", "wz", "faktura"],
): KompletDokumentow {
  const dokumenty = wszystkie.filter((d) => d.zamowienie === zamowienie);
  const obecne = new Set(dokumenty.map((d) => d.rodzaj));
  return {
    zamowienie,
    dokumenty,
    brakuje: oczekiwane.filter((r) => !obecne.has(r)),
  };
}

/** Ile pieniędzy niesie komplet: korekty liczą się z własnym znakiem. */
export function wartoscKompletu(dokumenty: readonly DokumentWystawiony[]): number {
  return zaokr(
    dokumenty
      .filter((d) => rodzaje[d.rodzaj].fiskalny)
      .reduce((suma, d) => suma + d.brutto, 0),
  );
}

/** Podmioty, które wystawiły cokolwiek do tego zamówienia. */
export function podmiotyKompletu(dokumenty: readonly DokumentWystawiony[]): PodmiotFakturujacyId[] {
  const uzyte = new Set(dokumenty.map((d) => d.podmiot).filter((p): p is PodmiotFakturujacyId => p !== null));
  return podmiotyFakturujace.map((p) => p.id).filter((id) => uzyte.has(id));
}
