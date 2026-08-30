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
/**
 * Zakres produktu, ustalony z klientem 30 sierpnia 2026.
 *
 * Portal ma robić dwie rzeczy: odciążać biuro hurtowni i przyjmować
 * zamówienia online. Klient świadomie odrzucił prywatny kalkulator marży
 * stolarza, mimo naszej rekomendacji. Sekcja o kalkulatorze w
 * `design/004-b2b-crm-erp-spec.md` jest od tej decyzji nieaktualna.
 *
 * Reguła przy szeregowaniu prac: moduł wchodzi, jeżeli skraca pracę biura
 * albo domyka ścieżkę zamówienia online. Moduł, którego jedynym beneficjentem
 * jest stolarz, nie wchodzi.
 */
/**
 * Terminy i okno zmian.
 *
 * `dniRobocze` i `godzinaGraniczna` to nasza propozycja, nie ustalenie.
 * Specyfikacja zostawia otwarte pytanie, czy pięć dni to dni kalendarzowe
 * czy robocze, jaka jest godzina graniczna i który kalendarz świąt obowiązuje.
 * Do potwierdzenia z hurtownią. Dziś pomijamy tylko soboty i niedziele,
 * bez świąt.
 */
/**
 * Rezerwacje stanów.
 *
 * Rezerwacja zakładana przy złożeniu zamówienia jest miękka: wygasa,
 * jeżeli hurtownia nie potwierdzi zamówienia w podanym czasie. Po potwierdzeniu
 * staje się twarda i trzyma towar do wydania. Czas do potwierdzenia z hurtownią.
 */
export const rezerwacje = {
  wygasanieGodzin: 24,
} as const;

/**
 * Dzień odniesienia demonstracji.
 *
 * Trzy ekrany miały wcześniej wpisaną datę na sztywno i po dobie pokazywały
 * wczoraj. Tutaj jest jedno źródło. Zwracamy dzień bieżący, bo dane zalążkowe
 * mają terminy we wrześniu 2026 i dopóki są w przyszłości, wszystko się zgadza.
 * Gdy miną, trzeba przesunąć terminy w `src/data`, a nie zamrażać zegar.
 */
export function dzisDemo(): Date {
  return new Date();
}

export const terminy = {
  dniRealizacji: 5,
  dniRobocze: true,
  godzinaGraniczna: 12,
  oknoZmianGodzin: 48,
} as const;

export const zakresProduktu = {
  ulatwienieDlaHurtowni: true,
  zamowieniaOnline: true,
  kalkulatorMarzyStolarza: false,
  pelnyCrmDlaStolarza: false,
} as const;

export const funkcje = {
  logowanie: true,
  katalog: true,
  kreatorFormatek: true,
  koszyk: true,
  panelKlienta: true,
  /** Zaplecze hurtowni. Wyłączenie odcina trasy /hurtownia i ukrywa nawigację. */
  panelHurtowni: true,
  /** Kontrakt i ekrany są gotowe, prawdziwe połączenie wdraża Lead. */
  integracjaSystemuSprzedazowego: false,
  /** Zaplecze ERP: pokazujemy dopiero po zaakceptowaniu Etapu 3. */
  /** Prawdziwa baza zamiast danych zalążkowych. */
  supabase: false,
  /**
   * Moduły zbudowane do decyzji na spotkaniu. Każdy da się wyłączyć
   * jedną linią, bez wycinania kodu: `bramka` zwraca wtedy 404,
   * a wpis znika z nawigacji.
   */
  rezerwacjeStanow: true,
  dokumentyZamowienia: true,
  warunkiHandlowe: true,
  kolejkaProdukcji: true,
  organizacjaIRole: true,
} as const;

/** Zasady obsługi zamówień używane w demonstracyjnym panelu klienta. */
export const obslugaZamowien = {
  czasNaZmianyGodziny: 48,
  terminRealizacjiDniRobocze: 5,
  komunikatBraku:
    "Termin może się wydłużyć, jeżeli stan magazynowy nie pozwala na realizację zamówienia.",
} as const;

/** Dane kontrahenta używane wyłącznie w poniedziałkowej makiecie portalu. */
export const kontrahentDemo = {
  nazwa: "Stolarnia Nowak",
  kodProgu: "B2",
} as const;

/** Wartości startowe formularza przepisane z zaakceptowanej makiety. */
export const kreatorDomyslne = {
  dlugosc: 720,
  szerokosc: 560,
  sztuk: 1,
  grubosc: 18,
} as const;

/** Klucz kolumn używany przez import list formatek Mussi. */
export const importMussi = {
  separator: ";",
  kolumny: ["Lp.", "Oznaczenie(np. frez)", "x", "Długość", "Szerokość", "Ilość", "słoje", "Okleina"],
  przyklad: ["1", "5981 bs", "", "2500", "505", "2", "", "1010"],
} as const;

/**
 * Copy aplikacji. Etykiety pochodzą z zaakceptowanej makiety HTML i briefu 003.
 * Trzymamy je poza komponentami, aby korekta języka nie wymagała zmian w JSX.
 */
export const copy = {
  wspolne: {
    portal: "Portal B2B",
    kreator: "Kreator formatek",
    katalog: "Katalog",
    koszyk: "Koszyk",
    konto: "Konto klienta",
    prog: "Próg kontrahenta",
    cenaNetto: "netto",
    pominNawigacje: "Przejdź do treści",
  },
  kreator: {
    eyebrow: "Rozkrój i wycena",
    tytul: "Policz sam, zanim zadzwonisz",
    opis:
      "Dodaj formatki, ustaw obrzeże na każdej krawędzi i zobacz rozkrój policzony na żywo.",
    nowaPozycja: "Nowa pozycja",
    importTytul: "Import listy formatek",
    importFormaty: "CSV / XLSX",
    importOpis: "Wgraj CSV albo Excel XLSX zgodny z kluczem Mussi.",
    importWybierz: "Wybierz plik CSV lub XLSX",
    importPomoc: "Oznaczenie płyty może być wpisane tylko w pierwszym wierszu grupy; kolejne formatki je dziedziczą. Okleina: góra, dół, lewa, prawa; 0 oznacza brak, 1 lub 2 grubość w mm. Słoje oznacz literą T lub X.",
    importKlucz: "Klucz Mussi",
    importWzor: "Pobierz wzór CSV",
    importCzytanie: "Czytam plik",
    importGotowe: "Pozycje gotowe do dodania",
    importBledy: "Uwagi do importu",
    importDodaj: "Dodaj do rozkroju",
    importWyczysc: "Wyczyść import",
    importBladPliku: "Nie udało się odczytać pliku.",
    importBrakDekoru: "nie rozpoznano dekoru",
    importDekorZastepczy: "użyto aktualnie wybranej płyty",
    dekor: "Dekor",
    wybranoZKatalogu: "Wybrano z katalogu",
    dlugosc: "Długość",
    szerokosc: "Szerokość",
    sztuk: "Sztuk",
    jednostkaMm: "mm",
    sloje: "Słoje wzdłuż długości",
    obrzeze: "Obrzeże, dotknij aby zmienić",
    obrzezePomoc: "Każde dotknięcie zmienia wartość: 0 → 1 → 2 → 0.",
    obrzezeProdukt: "Obrzeże do płyty",
    obrzezeSugestia: "Sugestia systemu",
    obrzezeWybraneRecznie: "Wybór ręczny",
    obrzezeBrak: "Brak obrzeża w katalogu",
    obrzezeZmien: "Zmień obrzeże",
    obrzezeZamknij: "Zamknij wybór",
    obrzezeSzukaj: "Szukaj po kodzie, nazwie lub producencie",
    obrzezeBrakWynikow: "Brak obrzeży pasujących do wyszukiwania.",
    obrzezeWyniki: "Wyniki wyszukiwania obrzeży",
    krawedzie: ["górna", "dolna", "lewa", "prawa"],
    zmienKrawedz: "Zmień obrzeże, krawędź",
    krawedzStan: "Krawędź",
    krawedzPoDotknieciu: "Po dotknięciu ustawisz",
    dodaj: "Dodaj formatkę",
    lista: "Lista formatek",
    pustaLista: "Lista jest pusta. Dodaj pierwszą formatkę powyżej.",
    usun: "Usuń",
    brak: "brak",
    rozkroj: "Rozkrój na żywo",
    pustyRozkroj: "Podgląd pojawi się po dodaniu pierwszej formatki.",
    arkusz: "Arkusz",
    arkusze: "Arkusze",
    wykorzystanie: "Wykorzystanie materiału",
    odrzucone: "Formatka odrzucona",
    odrzuconeOpis: "Wymiar nie mieści się w parametrach produkcyjnych.",
    wymiary: "Wymiary",
    slojeSkrot: "Słoje",
    wycena: "Wycena usług",
    ciecie: "Cięcie",
    obrzezeMetry: "Obrzeże",
    oklejanie: "Oklejanie",
    razem: "Usługi netto",
    wycenaInfo:
      "Wycena orientacyjna. Materiał liczymy osobno, a rozkrój nietypowy wyceniamy z rysunku.",
  },
  katalog: {
    podpisEkspozycji: "Regał z próbkami w hurtowni przy Działkowej. Każdy dekor z katalogu możesz zobaczyć na miejscu przed zamówieniem.",
    eyebrow: "Dekory i materiały",
    tytul: "Dekory, które mamy dziś na stanie",
    opis:
      "Pełny katalog po zalogowaniu, razem z ceną dopasowaną do progu kontrahenta.",
    filtrKategorii: "Kategoria",
    filtrDostepnosci: "Dostępność",
    wszystkie: "Wszystkie",
    dostepne: "Na stanie",
    plyta: "Płyty",
    blat: "Blaty",
    front: "Fronty",
    sklejka: "Sklejki",
    obrzeze: "Obrzeża",
    akcesorium: "Akcesoria",
    naStanie: "na stanie",
    ostatnieSztuki: "ostatnie sztuki",
    naZamowienie: "na zamówienie",
    grubosc: "Grubość",
    twojaCena: "Twoja cena",
    uzyjWKreatorze: "Użyj w kreatorze",
    dodajDoKoszyka: "Dodaj do koszyka",
    jednostka: "Jednostka sprzedaży",
    brakWynikow: "Brak materiałów dla wybranych filtrów.",
    pozycji: "pozycji",
    wyniki: "Wyniki katalogu",
  },
} as const;

export type ProgRabatowy = (typeof progiRabatowe)[number];
export type PozycjaCennika = { cena: number; jednostka: string; opis: string };

/**
 * Kto obsługuje magazyn po stronie hurtowni. Podpisuje korekty ręczne,
 * żeby po miesiącu dało się ustalić, kto zmienił stan i dlaczego.
 * Docelowo zastąpi to zalogowany użytkownik z Supabase.
 */
export const operatorHurtowni = {
  imie: "Biuro",
  login: "biuro",
} as const;

/**
 * Podmioty, które mogą wystawiać dokumenty do jednego zamówienia.
 *
 * Żaden podmiot nie ma dziś kompletu danych rejestrowych: brakuje NIP-ów,
 * rachunków i serii numeracji. Kompletność wylicza `czyPodmiotGotowy`
 * z `src/lib/fakturowanie.ts`, więc wpisanie brakującego pola tutaj
 * od razu odblokowuje wystawienie dokumentu w panelu hurtowni.
 * Do potwierdzenia na spotkaniu z klientem.
 */
export type PodmiotFakturujacy = {
  id: string;
  nazwaRobocza: string;
  zakres: string;
  nazwaPrawna: string | null;
  nip: string | null;
  regon: string | null;
  adres: string | null;
  rachunek: string | null;
  /** Serie numeracji: faktura, korekta, wydanie zewnętrzne. */
  seriaFaktury: string | null;
  seriaKorekty: string | null;
  seriaWz: string | null;
  ksef: "podlaczony" | "niepodlaczony";
};

export const podmiotyFakturujace = [
  {
    id: "plyty",
    nazwaRobocza: "Płyty",
    zakres: "Płyty, blaty, fronty i obrzeża",
    nazwaPrawna: firma.pelnaNazwa,
    nip: null,
    regon: null,
    adres: `${firma.ulica}, ${firma.kod} ${firma.miasto}`,
    rachunek: null,
    seriaFaktury: null,
    seriaKorekty: null,
    seriaWz: null,
    ksef: "niepodlaczony",
  },
  {
    id: "akcesoria",
    nazwaRobocza: "Akcesoria",
    zakres: "Okucia, systemy i pozostałe akcesoria",
    nazwaPrawna: null,
    nip: null,
    regon: null,
    adres: null,
    rachunek: null,
    seriaFaktury: null,
    seriaKorekty: null,
    seriaWz: null,
    ksef: "niepodlaczony",
  },
  {
    id: "stolarnia",
    nazwaRobocza: `Stolarnia ${firma.stolarnia}`,
    zakres: "Cięcie, oklejanie i usługi stolarskie",
    nazwaPrawna: null,
    nip: null,
    regon: null,
    adres: null,
    rachunek: null,
    seriaFaktury: null,
    seriaKorekty: null,
    seriaWz: null,
    ksef: "niepodlaczony",
  },
] as const satisfies readonly PodmiotFakturujacy[];

export type PodmiotFakturujacyId = (typeof podmiotyFakturujace)[number]["id"];
