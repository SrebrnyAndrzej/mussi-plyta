export type OrderStatus = "W produkcji" | "Kompletacja" | "Wysłane" | "W realizacji" | "Zakończone";

export type DemoOrder = {
  id: string;
  project: string;
  status: OrderStatus;
  editWindow: string;
  editHint: string;
  editable: boolean;
  delivery: string;
  deliveryHint: string;
  availability: string;
  availabilityTone: "ok" | "warning" | "neutral";
  value: string;
};

export const portalNavigation = [
  { href: "/panel", label: "Pulpit", ikona: "pulpit" },
  { href: "/projekty/palmowa", label: "Projekty", ikona: "projekty" },
  { href: "/katalog", label: "Katalog", ikona: "katalog" },
  { href: "/koszyk", label: "Koszyk", ikona: "koszyk" },
  { href: "/zamowienia", label: "Zamówienia", ikona: "zamowienia" },
  { href: "/zamowienia#dokumenty", label: "Dokumenty", ikona: "dokumenty" },
] as const;

export const cartCopy = {
  eyebrow: "Wycena zamówienia",
  title: "Wszystko w jednym koszyku",
  subtitle: "Materiały, obrzeża, usługi i okucia policzone według warunków Twojej firmy.",
  backToCatalog: "Wróć do katalogu",
  items: "Pozycje zamówienia",
  item: "pozycja",
  itemsFew: "pozycje",
  itemsMany: "pozycji",
  quantity: "Ilość",
  unitPrice: "Twoja cena netto",
  lineValue: "Wartość netto",
  remove: "Usuń z koszyka",
  availability: {
    "na-stanie": "Na stanie",
    "ostatnie-sztuki": "Ostatnie sztuki",
    "na-zamowienie": "Na zamówienie",
  },
  groups: {
    plyta: "Płyty i materiały",
    obrzeze: "Obrzeża",
    akcesorium: "Okucia i akcesoria",
    usluga: "Usługi",
  },
  summary: "Podsumowanie wyceny",
  customerPriceHint: "Wszystkie ceny uwzględniają warunki przypisane do Twojego konta.",
  net: "Razem netto",
  vat: "VAT 23%",
  gross: "Do zapłaty brutto",
  completion: "Przewidywana realizacja",
  standardTerm: "5 dni roboczych",
  stockWarning: "Termin wymaga potwierdzenia",
  stockWarningHint: "Jedna lub więcej pozycji nie jest dostępna od ręki.",
  editWindow: "Po złożeniu możesz zmieniać zamówienie przez 48 godzin.",
  continueProject: "Przejdź do kalkulacji projektu",
  submit: "Złóż zamówienie",
  submitted: "Zamówienie zapisane w wersji demonstracyjnej",
  submittedHint: "Edycja pozostaje dostępna przez 48 godzin. Realizacja rozpocznie się po potwierdzeniu stanów.",
  emptyTitle: "Koszyk jest pusty",
  emptyHint: "Dodaj materiały lub okucia z katalogu, aby przygotować wycenę.",
  browseCatalog: "Przejdź do katalogu",
  demoLabel: "Dane demonstracyjne",
  addedFromCatalog: "Produkt z katalogu został dodany do koszyka.",
} as const;

export const cartServiceDemo = {
  id: "ciecie-oklejanie",
  kod: "USŁ-R01",
  nazwa: "Cięcie i okleinowanie projektu Palmowa",
  producent: "Mussi-Płyta",
  kategoria: "usluga",
  cenaKatalogowa: 412.5,
  jednostka: "kpl.",
  dostepnosc: "na-stanie",
} as const;

export const dashboardCopy = {
  greeting: "Dzień dobry,",
  title: "Stolarnia Nowak",
  subtitle: "Tu masz pełną kontrolę nad zamówieniami i projektami.",
  activeOrder: "Aktywne zamówienie",
  statusLabel: "Status zamówienia",
  editLabel: "Zmiany możliwe jeszcze",
  editPolicy: "Po upływie 48 godzin zamówienie przechodzi do produkcji i edycja zostaje zablokowana.",
  deliveryLabel: "Termin potwierdzony",
  stockAlert: "Brak magazynowy: prowadnica Blum 500 mm, dostawa 5 września",
  orderContents: "Zawartość zamówienia",
  summary: "Podsumowanie",
  newOrder: "Nowe zamówienie",
  quickCut: "Szybki rozkrój",
  goToOrder: "Przejdź do zamówienia",
  seeDetails: "Zobacz szczegóły",
  nextSteps: "Następne kroki",
} as const;

export const activeOrder = {
  id: "M-2026-0842",
  status: "W produkcji",
  editWindow: "19 godz. 24 min",
  editHint: "Polityka edycji: 48 godzin od złożenia",
  delivery: "3 września",
  deliveryHint: "środa",
  value: "8 462,70 zł",
  rows: [
    { label: "Rozkrój płyt", description: "18 płyt · 6 materiałów · 142 elementy", value: "5 628,40 zł" },
    { label: "Okleiny i obrzeża", description: "PVC 2 mm · ABS 1 mm · 5 dekorów", value: "1 124,30 zł" },
    { label: "Akcesoria i okucia", description: "35 pozycji · Blum · GTV · Hettich", value: "1 710,00 zł" },
  ],
  timeline: [
    { label: "Zamówienie złożone", date: "28.08, 10:31", done: true },
    { label: "Potwierdzone", date: "28.08, 10:42", done: true },
    { label: "W produkcji", date: "28.08, 14:57", done: true },
    { label: "Kompletacja", date: "2.09", done: false },
    { label: "Wysyłka", date: "3.09", done: false },
  ],
} as const;

export const projectCopy = {
  back: "Wszystkie projekty",
  title: "Kuchnia Palmowa 5981BS",
  client: "Klient: Jan Kowalski",
  created: "Utworzono: 24.05.2026",
  updated: "Aktualizacja: dzisiaj, 10:42",
  source: "Źródło danych",
  file: "5981BS palmowa wejście.xlsx",
  imported: "Zaimportowano: 24.05.2026, 09:18",
  projectSummary: "Podsumowanie projektu",
  estimate: "Wycena dla zamówienia",
  orderValue: "Wartość zamówienia netto",
  orderValueHint: "To wartość Twojego zamówienia w Mussi-Płyta. Nie zawiera Twojej marży.",
  clientCalculation: "Twoja kalkulacja dla klienta",
  privateCalculation: "Tylko dla Ciebie",
  margin: "Marża",
  clientPrice: "Cena dla klienta netto",
  privateHint: "Ta kalkulacja nie wpływa na wartość zamówienia w Mussi-Płyta.",
  backToCut: "Wróć do rozkroju",
  save: "Zapisz projekt",
  saved: "Projekt zapisany",
  submit: "Złóż zamówienie",
  submitted: "Zamówienie zostało złożone",
  submittedHint: "Możesz wprowadzać zmiany przez najbliższe 48 godzin.",
  goToOrders: "Przejdź do zamówień",
} as const;

export const projectPricing = {
  orderValueNet: 8462.7,
  defaultMarginPercent: 22,
} as const;

export const projectSteps = [
  { label: "Materiały", hint: "Dobór płyt" },
  { label: "Rozkrój", hint: "Optymalizacja" },
  { label: "Obrzeża", hint: "Dobór i ilości" },
  { label: "Okucia", hint: "Akcesoria i dodatki" },
  { label: "Wycena", hint: "Podsumowanie" },
  { label: "Zamówienie", hint: "Realizacja" },
] as const;

export const projectRows = [
  {
    label: "Płyty i blaty",
    description: "12 formatek · 38 elementów",
    product: "Płyta 5981 BS",
    detail: "Dąb Palmowy · 7 szt.",
    value: "6 214,40 zł",
  },
  {
    label: "Obrzeża",
    description: "Automatycznie dobrane do formatek",
    product: "ABS 2 mm 5981",
    detail: "Obrzeże sugerowane · 95,6 m",
    value: "1 286,30 zł",
  },
  {
    label: "Okucia i akcesoria",
    description: "35 pozycji",
    product: "Blum · GTV · Hettich",
    detail: "Prowadnice, zawiasy i mocowania",
    value: "962,00 zł",
  },
] as const;

export const ordersCopy = {
  title: "Zamówienia pod kontrolą",
  subtitle: "Kolejka zamówień ze stanem realizacji, edycji i dostępności.",
  attention: "Wymaga Twojej uwagi: 2 zamówienia do edycji w ciągu 24 godzin",
  attentionHint: "Po 48 godzinach edycja zostanie zablokowana.",
  newOrder: "Nowe zamówienie",
  search: "Szukaj zamówienia lub projektu",
  filters: ["Wszystkie", "Wymagają uwagi", "Można edytować", "W realizacji", "Zakończone"],
  columns: ["Zamówienie / projekt", "Status", "Termin edycji", "Realizacja", "Dostępność", "Wartość końcowa"],
  download: "Pobierz specyfikację PDF",
  edit: "Edytuj zamówienie",
  editLocked: "Edycja zablokowana po 48 godzinach",
  closeEditor: "Zamknij edycję",
  saveChanges: "Zapisz zmiany",
  savedChanges: "Zmiany zapisane w wersji demonstracyjnej",
} as const;

export const demoOrders: DemoOrder[] = [
  {
    id: "M-2026-0842",
    project: "Kuchnia Palmowa",
    status: "W produkcji",
    editWindow: "19 godz. 24 min",
    editHint: "do 30.08, 15:00",
    editable: true,
    delivery: "3 września",
    deliveryHint: "środa",
    availability: "1 brak",
    availabilityTone: "warning",
    value: "8 462,70 zł",
  },
  {
    id: "M-2026-0837",
    project: "Garderoba Słoneczna",
    status: "Kompletacja",
    editWindow: "Edycja zablokowana",
    editHint: "minęło 2 dni",
    editable: false,
    delivery: "1 września",
    deliveryHint: "poniedziałek",
    availability: "Kompletne",
    availabilityTone: "ok",
    value: "4 918,20 zł",
  },
  {
    id: "M-2026-0819",
    project: "Recepcja Nova",
    status: "Wysłane",
    editWindow: "Edycja zablokowana",
    editHint: "minęło 5 dni",
    editable: false,
    delivery: "30 sierpnia",
    deliveryHint: "sobota",
    availability: "Kompletne",
    availabilityTone: "ok",
    value: "12 730,00 zł",
  },
  {
    id: "M-2026-0812",
    project: "Biuro Prestige",
    status: "W realizacji",
    editWindow: "Edycja zablokowana",
    editHint: "minęło 7 dni",
    editable: false,
    delivery: "29 sierpnia",
    deliveryHint: "piątek",
    availability: "1 brak",
    availabilityTone: "warning",
    value: "6 214,40 zł",
  },
  {
    id: "M-2026-0801",
    project: "Łazienka Loft",
    status: "Zakończone",
    editWindow: "Edycja zablokowana",
    editHint: "minęło 12 dni",
    editable: false,
    delivery: "22 sierpnia",
    deliveryHint: "piątek",
    availability: "Brak uwag",
    availabilityTone: "neutral",
    value: "3 821,60 zł",
  },
];

export const orderDetailSections = [
  { id: "plyty", label: "Płyty i rozkrój" },
  { id: "obrzeza", label: "Obrzeża" },
  { id: "okucia", label: "Okucia i akcesoria" },
  { id: "dokumenty", label: "Dokumenty" },
] as const;
