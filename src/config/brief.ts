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
