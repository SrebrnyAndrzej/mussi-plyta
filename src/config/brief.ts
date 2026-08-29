/**
 * JEDNO MIEJSCE NA USTALENIA Z KLIENTEM.
 *
 * Wszystko, co może się zmienić po spotkaniu w poniedziałek, siedzi tutaj:
 * ceny, progi rabatowe, parametry rozkroju, nazwy, przełączniki funkcji.
 * Komponenty UI nie mają prawa mieć tych wartości zaszytych na sztywno.
 *
 * Zmiana briefu = edycja tego pliku, nie przepisywanie interfejsu.
 */

export const firma = {
  nazwa: "Mussi-Płyta",
  pelnaNazwa: "P.H.U. Mussi-Płyta S.C.",
  ulica: "ul. Działkowa 19",
  kod: "65-767",
  miasto: "Zielona Góra",
  telefon: "532 183 024",
  email: "biuro@mussi-plyta.pl",
  godziny: "pn. do pt., 8:00 do 16:00",
  odRoku: 2013,
  stolarnia: "U Kazia",
} as const;

/** Parametry technologiczne rozkroju. Do potwierdzenia z operatorem piły. */
export const rozkroj = {
  /** Format arkusza w milimetrach. */
  plyta: { szerokosc: 2800, wysokosc: 2070 },
  /** Szerokość rzazu piły w mm. Realnie 3,2 do 4,4 zależnie od piły. */
  rzaz: 4,
  /** Minimalna formatka, jaką przyjmuje okleiniarka (mm). */
  minFormatka: { szerokosc: 70, wysokosc: 150 },
  /** Maksymalna liczba sztuk jednej pozycji w kreatorze. */
  maxSztuk: 200,
} as const;

/**
 * Cennik usług stolarni. Wartości netto w złotych,
 * przepisane z cennika opublikowanego przez hurtownię.
 * DO POTWIERDZENIA w poniedziałek: czy nadal aktualne.
 */
export const cennik = {
  cieciePlyty18: { cena: 75, jednostka: "płyta", opis: "Cięcie płyty 18 mm" },
  cieciePlyty3: { cena: 25, jednostka: "płyta", opis: "Cięcie płyty 3 mm (HDF)" },
  cieciSklejkiGrubej: { cena: 55, jednostka: "płyta", opis: "Cięcie sklejki od 15 mm" },
  cieciSklejkiCienkiej: { cena: 30, jednostka: "płyta", opis: "Cięcie sklejki do 12 mm" },
  oklejanie18: { cena: 4.5, jednostka: "mb", opis: "Oklejanie płyty 18 mm" },
  oklejanie36: { cena: 6, jednostka: "mb", opis: "Oklejanie płyty 36 mm" },
  sklejanie36: { cena: 45, jednostka: "m2", opis: "Sklejanie dwóch płyt do 36 mm" },
  lukMin: { cena: 50, jednostka: "szt", opis: "Łuki i wycięcia, od" },
  lukMax: { cena: 100, jednostka: "szt", opis: "Łuki i wycięcia, do" },
} as const;

/**
 * Progi rabatowe kontrahentów.
 * Wartości ILUSTRACYJNE, do ustalenia z klientem w poniedziałek.
 */
export const progiRabatowe = [
  { kod: "B0", nazwa: "Bez umowy", rabat: 0, odObrotu: 0 },
  { kod: "B1", nazwa: "Stały klient", rabat: 0.07, odObrotu: 3000 },
  { kod: "B2", nazwa: "Warsztat", rabat: 0.11, odObrotu: 8000 },
  { kod: "B3", nazwa: "Duży warsztat", rabat: 0.13, odObrotu: 20000 },
] as const;

/** Włączniki funkcji. Pozwalają wyciąć moduł na demo bez usuwania kodu. */
export const funkcje = {
  katalog: true,
  kreatorFormatek: true,
  koszyk: true,
  panelKlienta: true,
  /** Zaplecze ERP: pokazujemy dopiero po zaakceptowaniu Etapu 3. */
  zaplecze: false,
  /** Prawdziwa baza zamiast danych zalążkowych. */
  supabase: false,
} as const;

export type ProgRabatowy = (typeof progiRabatowe)[number];
export type PozycjaCennika = { cena: number; jednostka: string; opis: string };
