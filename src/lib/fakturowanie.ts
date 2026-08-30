import {
  podmiotyFakturujace,
  type PodmiotFakturujacy,
  type PodmiotFakturujacyId,
} from "@/config/brief";

const STAWKA_VAT = 0.23;

const zaokr = (v: number) => Math.round(v * 100) / 100;

/** Pola rejestrowe, bez których nie wolno wystawić dokumentu. */
export const wymaganeDaneFormalne = [
  { pole: "nazwaPrawna", etykieta: "Nazwa prawna" },
  { pole: "nip", etykieta: "NIP" },
  { pole: "adres", etykieta: "Adres" },
  { pole: "rachunek", etykieta: "Rachunek bankowy" },
  { pole: "seriaFaktury", etykieta: "Seria faktur" },
] as const satisfies ReadonlyArray<{ pole: keyof PodmiotFakturujacy; etykieta: string }>;

/** Etykiety pól, których podmiotowi brakuje do wystawienia dokumentu. */
export function brakujaceDaneFormalne(p: PodmiotFakturujacy): string[] {
  return wymaganeDaneFormalne
    .filter(({ pole }) => {
      const wartosc = p[pole];
      return typeof wartosc !== "string" || wartosc.trim() === "";
    })
    .map(({ etykieta }) => etykieta);
}

/** Znormalizowany NIP: same cyfry. */
export function normalizujNip(nip: string): string {
  return nip.replace(/[\s-]/g, "");
}

/** Suma kontrolna NIP. Chroni przed literówką na dokumencie sprzedaży. */
export function poprawnyNip(nip: string): boolean {
  const cyfry = normalizujNip(nip);
  if (!/^\d{10}$/.test(cyfry)) return false;
  const wagi = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const suma = wagi.reduce((s, waga, i) => s + waga * Number(cyfry[i]), 0);
  const kontrolna = suma % 11;
  return kontrolna !== 10 && kontrolna === Number(cyfry[9]);
}

/** Rachunek w formacie IBAN, sprawdzany mod 97. */
export function poprawnyRachunek(rachunek: string): boolean {
  const iban = rachunek.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const przestawiony = iban.slice(4) + iban.slice(0, 4);
  const liczbowo = przestawiony.replace(/[A-Z]/g, (z) => String(z.charCodeAt(0) - 55));
  let reszta = 0;
  for (const znak of liczbowo) reszta = (reszta * 10 + Number(znak)) % 97;
  return reszta === 1;
}

/** Pola wypełnione, ale w złym formacie. Blokują wystawienie tak samo jak braki. */
export function bledneDaneFormalne(p: PodmiotFakturujacy): string[] {
  const bledy: string[] = [];
  if (p.nip && !poprawnyNip(p.nip)) bledy.push("NIP ma niepoprawną sumę kontrolną");
  if (p.rachunek && !poprawnyRachunek(p.rachunek)) bledy.push("Rachunek nie jest poprawnym numerem IBAN");
  return bledy;
}

export function czyPodmiotGotowy(p: PodmiotFakturujacy): boolean {
  return brakujaceDaneFormalne(p).length === 0 && bledneDaneFormalne(p).length === 0;
}

export function podmiot(id: PodmiotFakturujacyId): PodmiotFakturujacy {
  const znaleziony = podmiotyFakturujace.find((p) => p.id === id);
  if (!znaleziony) throw new Error(`Nieznany podmiot fakturujący: ${id}`);
  return znaleziony;
}

/** Kategorie pozycji, po których system proponuje podmiot. */
export type KategoriaPozycji =
  | "materialy"
  | "obrzeza"
  | "akcesoria"
  | "uslugi";

const sugestie: Record<KategoriaPozycji, PodmiotFakturujacyId> = {
  materialy: "plyty",
  obrzeza: "plyty",
  akcesoria: "akcesoria",
  uslugi: "stolarnia",
};

export function sugerujPodmiot(kategoria: KategoriaPozycji): PodmiotFakturujacyId {
  return sugestie[kategoria];
}

export function sugerowanyPodzial(
  pozycje: readonly PozycjaDokumentu[],
): Record<string, PodmiotFakturujacyId> {
  return Object.fromEntries(
    pozycje.map((p) => [p.id, sugerujPodmiot(p.kategoria)]),
  );
}

export type PozycjaDokumentu = {
  id: string;
  nazwa: string;
  kategoria: KategoriaPozycji;
  netto: number;
  opis?: string;
};

/** Przypisanie pozycji do podmiotu. Brak klucza oznacza pozycję nieprzypisaną. */
export type Przypisania = Record<string, PodmiotFakturujacyId | undefined>;

/**
 * Migawka danych rejestrowych zapisywana na dokumencie.
 * Późniejsza zmiana kartoteki nie może zmieniać wystawionego dokumentu.
 */
export type MigawkaPodmiotu = {
  id: PodmiotFakturujacyId;
  nazwaPrawna: string | null;
  nip: string | null;
  adres: string | null;
  rachunek: string | null;
  seriaFaktury: string | null;
  ksef: PodmiotFakturujacy["ksef"];
  kiedy: string;
};

export function migawkaPodmiotu(
  p: PodmiotFakturujacy,
  kiedy: string = new Date().toISOString(),
): MigawkaPodmiotu {
  return {
    id: p.id as PodmiotFakturujacyId,
    nazwaPrawna: p.nazwaPrawna,
    nip: p.nip,
    adres: p.adres,
    rachunek: p.rachunek,
    seriaFaktury: p.seriaFaktury,
    ksef: p.ksef,
    kiedy,
  };
}

/** `FV-P/0007/2026`. Zwraca null, dopóki podmiot nie ma serii. */
export function numerDokumentu(
  seria: string | null,
  kolejny: number,
  rok: number,
): string | null {
  if (!seria || !Number.isInteger(kolejny) || kolejny < 1) return null;
  return `${seria}/${String(kolejny).padStart(4, "0")}/${rok}`;
}

export type Dokument = {
  podmiot: PodmiotFakturujacy;
  pozycje: PozycjaDokumentu[];
  netto: number;
  vat: number;
  brutto: number;
  migawka: MigawkaPodmiotu;
  braki: string[];
  gotowy: boolean;
  numer: string | null;
};

export type OpcjePodzialu = {
  rok?: number;
  /** Kolejne numery w serii każdego podmiotu, np. { plyty: 7 }. */
  liczniki?: Partial<Record<PodmiotFakturujacyId, number>>;
  kiedy?: string;
};

/**
 * Dzieli zamówienie na od jednego do trzech dokumentów sprzedaży.
 * Podmiot bez przypisanych pozycji nie generuje dokumentu.
 */
export function podzielNaDokumenty(
  pozycje: readonly PozycjaDokumentu[],
  przypisania: Przypisania,
  opcje: OpcjePodzialu = {},
): Dokument[] {
  const rok = opcje.rok ?? new Date().getFullYear();
  const kiedy = opcje.kiedy ?? new Date().toISOString();

  return podmiotyFakturujace
    .map((p) => {
      const wlasne = pozycje.filter((poz) => przypisania[poz.id] === p.id);
      const netto = zaokr(wlasne.reduce((suma, poz) => suma + poz.netto, 0));
      const vat = zaokr(netto * STAWKA_VAT);
      const braki = [...brakujaceDaneFormalne(p), ...bledneDaneFormalne(p)];
      return {
        podmiot: p as PodmiotFakturujacy,
        pozycje: wlasne,
        netto,
        vat,
        brutto: zaokr(netto + vat),
        migawka: migawkaPodmiotu(p, kiedy),
        braki,
        gotowy: braki.length === 0,
        numer: numerDokumentu(p.seriaFaktury, opcje.liczniki?.[p.id] ?? 1, rok),
      };
    })
    .filter((d) => d.pozycje.length > 0);
}

export type WynikWystawienia =
  | { ok: true; dokumenty: Dokument[] }
  | { ok: false; dokumenty: Dokument[]; blokady: string[] };

/**
 * Bramka wystawienia dokumentów. Blokuje, gdy pozycja nie ma podmiotu
 * albo gdy podmiot z pozycjami nie ma kompletu danych rejestrowych.
 */
export function walidujWystawienie(
  pozycje: readonly PozycjaDokumentu[],
  przypisania: Przypisania,
  opcje: OpcjePodzialu = {},
): WynikWystawienia {
  const dokumenty = podzielNaDokumenty(pozycje, przypisania, opcje);
  const blokady: string[] = [];

  const bezPodmiotu = pozycje.filter((poz) => !przypisania[poz.id]);
  for (const poz of bezPodmiotu) {
    blokady.push(`Pozycja „${poz.nazwa}” nie ma przypisanego podmiotu.`);
  }

  for (const d of dokumenty) {
    if (!d.gotowy) {
      blokady.push(
        `${d.podmiot.nazwaPrawna ?? d.podmiot.nazwaRobocza}: brak danych (${d.braki.join(", ")}).`,
      );
    }
  }

  if (pozycje.length > 0 && dokumenty.length === 0) {
    blokady.push("Zamówienie nie generuje żadnego dokumentu.");
  }

  return blokady.length > 0 ? { ok: false, dokumenty, blokady } : { ok: true, dokumenty };
}

export type PowodZmianyPodmiotu =
  | "zrodlo-towaru"
  | "zyczenie-klienta"
  | "korekta-sugestii"
  | "rozliczenie-uslugi";

export const powodyZmianyPodmiotu: Array<{ id: PowodZmianyPodmiotu; nazwa: string }> = [
  { id: "zrodlo-towaru", nazwa: "Towar z innego podmiotu" },
  { id: "zyczenie-klienta", nazwa: "Życzenie klienta" },
  { id: "korekta-sugestii", nazwa: "Poprawka błędnej sugestii" },
  { id: "rozliczenie-uslugi", nazwa: "Zmiana rozliczenia usługi" },
];

export type WpisAudytuFaktur = {
  zamowienie: string;
  pozycja: string;
  nazwaPozycji: string;
  zPodmiotu: PodmiotFakturujacyId | null;
  naPodmiot: PodmiotFakturujacyId;
  powod: PowodZmianyPodmiotu;
  autor: string;
  kiedy: string;
};

export type WynikZmiany =
  | { ok: true; przypisania: Przypisania; wpis: WpisAudytuFaktur }
  | { ok: false; blad: string };

/**
 * Zmiana podmiotu na pozycji. Zwraca nowy obiekt przypisań i wpis audytu.
 * Nie mutuje wejścia.
 */
export function zmienPodmiotPozycji(
  pozycje: readonly PozycjaDokumentu[],
  przypisania: Przypisania,
  zmiana: {
    zamowienie: string;
    pozycja: string;
    naPodmiot: PodmiotFakturujacyId;
    powod: PowodZmianyPodmiotu;
    autor: string;
  },
  kiedy: string = new Date().toISOString(),
): WynikZmiany {
  const poz = pozycje.find((p) => p.id === zmiana.pozycja);
  if (!poz) return { ok: false, blad: "Nie znaleziono pozycji zamówienia." };

  if (!podmiotyFakturujace.some((p) => p.id === zmiana.naPodmiot)) {
    return { ok: false, blad: "Nieznany podmiot fakturujący." };
  }

  const obecny = przypisania[zmiana.pozycja] ?? null;
  if (obecny === zmiana.naPodmiot) {
    return { ok: false, blad: "Pozycja jest już przypisana do tego podmiotu." };
  }

  if (!zmiana.autor.trim()) {
    return { ok: false, blad: "Zmiana podmiotu wymaga wskazania operatora." };
  }

  return {
    ok: true,
    przypisania: { ...przypisania, [zmiana.pozycja]: zmiana.naPodmiot },
    wpis: {
      zamowienie: zmiana.zamowienie,
      pozycja: poz.id,
      nazwaPozycji: poz.nazwa,
      zPodmiotu: obecny,
      naPodmiot: zmiana.naPodmiot,
      powod: zmiana.powod,
      autor: zmiana.autor,
      kiedy,
    },
  };
}

/** Ile dokumentów powstanie z zamówienia. */
export function liczbaDokumentow(
  pozycje: readonly PozycjaDokumentu[],
  przypisania: Przypisania,
): number {
  return podzielNaDokumenty(pozycje, przypisania).length;
}

export function odmienDokumenty(liczba: number): string {
  if (liczba === 1) return "dokument";
  const dziesiatki = liczba % 100;
  const jednosci = liczba % 10;
  if (dziesiatki >= 12 && dziesiatki <= 14) return "dokumentów";
  return jednosci >= 2 && jednosci <= 4 ? "dokumenty" : "dokumentów";
}
