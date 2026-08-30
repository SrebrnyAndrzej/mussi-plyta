import type { PozycjaDokumentu } from "@/lib/fakturowanie";
export type WarehouseOrderStatus = "Nowe" | "Do weryfikacji" | "Przyjęte" | "W produkcji" | "Gotowe" | "Wstrzymane";

export const authCopy = {
  eyebrow: "Portal Mussi B2B",
  title: "Zaloguj się do swojego miejsca pracy",
  description: "Klient kontroluje projekty i zamówienia. Pracownik hurtowni obsługuje realizację, stany i synchronizację danych.",
  email: "Adres e-mail",
  password: "Hasło",
  remember: "Zapamiętaj mnie na tym urządzeniu",
  forgot: "Nie pamiętam hasła",
  submit: "Zaloguj się",
  clientDemo: "Wejdź jako klient demo",
  warehouseDemo: "Wejdź jako pracownik hurtowni",
  demoNotice: "Tryb demonstracyjny. Prawdziwe uwierzytelnianie i odzyskiwanie hasła zostaną podpięte z backendem.",
  safety: "Po 30 minutach bezczynności sesja pracownika hurtowni powinna zostać automatycznie zakończona.",
  loggedOutTitle: "Sesja została zakończona",
  loggedOutDescription: "Wylogowano Cię z portalu Mussi. Dane demonstracyjne nie zostały zapisane w systemie sprzedażowym.",
  loginAgain: "Zaloguj się ponownie",
  home: "Wróć na stronę główną",
} as const;

export const warehouseNavigation = [
  { href: "/hurtownia", label: "Operacje", ikona: "operacje" },
  { href: "/hurtownia/zamowienia", label: "Zamówienia", ikona: "obsluga" },
  { href: "/hurtownia/stany", label: "Stany", ikona: "stany" },
  { href: "/hurtownia/zakupy", label: "Zakupy i dostawy", ikona: "zakupy" },
  { href: "/hurtownia/klienci", label: "Klienci i rabaty", ikona: "klienci" },
  { href: "/hurtownia/produkcja", label: "Produkcja", ikona: "produkcja" },
  { href: "/hurtownia/warunki", label: "Warunki", ikona: "warunki" },
  { href: "/hurtownia/podmioty", label: "Podmioty", ikona: "dokumenty" },
  { href: "/hurtownia/integracje", label: "Integracje", ikona: "integracje" },
] as const;

export const warehouseDashboardCopy = {
  eyebrow: "Panel hurtowni",
  title: "Dzisiaj na produkcji",
  subtitle: "Jedna kolejka od zamówienia klienta do wydania z magazynu.",
  shift: "Zmiana: 8:00 do 16:00",
  newOrders: "Nowe zamówienia",
  verify: "Do weryfikacji",
  production: "W produkcji",
  shortages: "Braki magazynowe",
  attention: "Wymaga decyzji",
  integration: "Stan integracji",
  openQueue: "Otwórz kolejkę",
} as const;

export const warehouseOrders = [
  { id: "M-2026-0848", client: "Stolarnia Dąb", project: "Apartament Parkowa", status: "Nowe" as const, placed: "dzisiaj, 07:42", deadline: "4 września", stock: "Kompletne", value: "11 240,80 zł", valueNet: 11240.8, priority: "standard" },
  { id: "M-2026-0847", client: "Meble Krawiec", project: "Kuchnia Zielona", status: "Do weryfikacji" as const, placed: "dzisiaj, 07:16", deadline: "4 września", stock: "2 niezgodności", value: "7 818,40 zł", valueNet: 7818.4, priority: "uwaga" },
  { id: "M-2026-0842", client: "Stolarnia Nowak", project: "Kuchnia Palmowa", status: "W produkcji" as const, placed: "28 sierpnia, 10:31", deadline: "3 września", stock: "1 brak", value: "8 462,70 zł", valueNet: 8462.7, priority: "uwaga" },
  { id: "M-2026-0839", client: "Forma Studio", project: "Recepcja Klinika", status: "Gotowe" as const, placed: "27 sierpnia, 13:08", deadline: "dzisiaj", stock: "Kompletne", value: "15 029,00 zł", valueNet: 15029, priority: "standard" },
  { id: "M-2026-0835", client: "Stolarstwo Lis", project: "Szafy Hotelowe", status: "Wstrzymane" as const, placed: "26 sierpnia, 15:44", deadline: "do ustalenia", stock: "5 braków", value: "21 684,30 zł", valueNet: 21684.3, priority: "blokada" },
] as const;

export const invoiceAllocationCopy = {
  eyebrow: "Dokumenty sprzedaży",
  title: "Podział fakturowania",
  description: "Przypisz każdą grupę pozycji do podmiotu, który ma ją zafakturować. Jedno zamówienie może wygenerować kilka dokumentów.",
  suggested: "Przywróć sugerowany podział",
  assignment: "Podmiot wystawiający fakturę",
  summary: "Dokumenty do wystawienia",
  net: "Netto",
  vat: "VAT 23%",
  gross: "Brutto",
  legalReady: "Dane formalne kompletne",
  legalMissing: "Dane formalne do uzupełnienia",
  save: "Zapisz podział fakturowania",
  saved: "Podział zapisany w wersji demonstracyjnej",
  savedHint: "Po integracji przypisania trafią do dokumentów sprzedaży i otrzymają osobne serie numeracji.",
  invoice: "dokument",
  invoicesFew: "dokumenty",
  invoicesMany: "dokumentów",
  demoNotice: "Żaden podmiot nie ma dziś kompletu danych rejestrowych, więc wystawienie dokumentów jest zablokowane.",
  reason: "Powód zmiany podmiotu",
  operator: "Operator",
  issue: "Wystaw dokumenty",
  blockedTitle: "Wystawienie zablokowane",
  blockedHint: "Uzupełnij dane w kartotece podmiotów, aby odblokować wystawienie.",
  registryLink: "Otwórz kartotekę podmiotów",
  number: "Numer dokumentu",
  numberPending: "po nadaniu serii",
  auditTitle: "Historia zmian podmiotu",
  auditEmpty: "Brak zmian. Obowiązuje podział sugerowany przez system.",
  snapshotTitle: "Dane na dokumencie",
} as const;

/**
 * Grupy pozycji jednego zamówienia. Do czasu podpięcia koszyka
 * wartości wynikają proporcjonalnie z wartości netto zamówienia.
 */
export function pozycjeZamowienia(totalNet: number): PozycjaDokumentu[] {
  const zaokr = (v: number) => Math.round(v * 100) / 100;
  const materialy = zaokr(totalNet * 0.61);
  const obrzeza = zaokr(totalNet * 0.075);
  const akcesoria = zaokr(totalNet * 0.19);
  const uslugi = zaokr(totalNet - materialy - obrzeza - akcesoria);

  return [
    { id: "materialy", nazwa: "Płyty, blaty i fronty", kategoria: "materialy", netto: materialy, opis: "Materiały wykorzystane w zamówieniu" },
    { id: "obrzeza", nazwa: "Obrzeża", kategoria: "obrzeza", netto: obrzeza, opis: "Obrzeża przypisane do rozkroju" },
    { id: "akcesoria", nazwa: "Okucia i akcesoria", kategoria: "akcesoria", netto: akcesoria, opis: "Prowadnice, zawiasy i elementy montażowe" },
    { id: "uslugi", nazwa: "Usługi stolarskie", kategoria: "uslugi", netto: uslugi, opis: "Cięcie, oklejanie i przygotowanie zamówienia" },
  ];
}

export const warehouseMetrics = [
  { label: warehouseDashboardCopy.newOrders, value: "7", hint: "3 od ostatniej synchronizacji" },
  { label: warehouseDashboardCopy.verify, value: "4", hint: "2 z niezgodnością cen" },
  { label: warehouseDashboardCopy.production, value: "18", hint: "6 do wydania dzisiaj" },
  { label: warehouseDashboardCopy.shortages, value: "9", hint: "w 5 zamówieniach" },
] as const;

export const inventoryRows = [
  { sku: "KR-5981-BS-18", name: "Płyta 5981 BS Dąb Palmowy 18 mm", system: "24 ark.", reserved: "7 ark.", available: "17 ark.", state: "zgodne", synced: "10:42" },
  { sku: "OB-5981-ABS2", name: "Obrzeże ABS 2 mm 5981", system: "148,0 mb", reserved: "95,6 mb", available: "52,4 mb", state: "zgodne", synced: "10:42" },
  { sku: "BL-500-TANDEM", name: "Prowadnica Blum Tandem 500 mm", system: "0 szt.", reserved: "4 szt.", available: "-4 szt.", state: "brak", synced: "10:41" },
  { sku: "GTV-ZM-ECHC09", name: "Zawias GTV cichy domyk", system: "82 szt.", reserved: "35 szt.", available: "47 szt.", state: "zgodne", synced: "10:41" },
  { sku: "HDF-BIA-3", name: "HDF biały 3 mm", system: "31 ark.", reserved: "9 ark.", available: "22 ark.", state: "różnica", synced: "09:58" },
] as const;

export const customerRows = [
  { id: "K-00128", name: "Stolarnia Nowak", group: "B2", discount: 11, payment: "Przelew 14 dni", limit: "25 000 zł", turnover: "18 420 zł", status: "Aktywny" },
  { id: "K-00074", name: "Forma Studio", group: "B3", discount: 13, payment: "Przelew 21 dni", limit: "45 000 zł", turnover: "31 880 zł", status: "Aktywny" },
  { id: "K-00142", name: "Meble Krawiec", group: "B1", discount: 7, payment: "Przedpłata", limit: "0 zł", turnover: "6 240 zł", status: "Weryfikacja" },
  { id: "K-00039", name: "Stolarstwo Lis", group: "B2", discount: 11, payment: "Przelew 7 dni", limit: "15 000 zł", turnover: "12 960 zł", status: "Blokada" },
] as const;

export const integrationCopy = {
  eyebrow: "System magazynowo-sprzedażowy",
  title: "Centrum integracji",
  subtitle: "Kontrola połączenia, mapowania i kolejek bez ukrywania błędów przed operatorem.",
  disconnected: "Tryb demonstracyjny, brak aktywnego połączenia",
  test: "Testuj połączenie",
  testing: "Sprawdzam połączenie",
  testResult: "Kontrakt poprawny. Do uruchomienia potrzebne są dane dostępowe i adres API.",
  syncNow: "Uruchom synchronizację",
  syncDemo: "Synchronizacja demonstracyjna zakończona: 84 rekordy, 2 wymagają uwagi.",
  mapping: "Mapowanie danych",
  queue: "Kolejka zdarzeń",
  history: "Historia synchronizacji",
  safeguards: "Zabezpieczenia operacyjne",
} as const;

export const integrationDomains = [
  { name: "Towary i warianty", direction: "System → portal", key: "SKU / indeks towaru", status: "Gotowe do mapowania", records: "1 284" },
  { name: "Stany magazynowe", direction: "System → portal", key: "Magazyn + SKU", status: "Gotowe do mapowania", records: "1 284" },
  { name: "Kontrahenci i rabaty", direction: "System → portal", key: "ID kontrahenta", status: "Wymaga decyzji", records: "148" },
  { name: "Zamówienia sprzedaży", direction: "Portal → system", key: "Numer Mussi + idempotency key", status: "Kontrakt gotowy", records: "kolejka" },
  { name: "Statusy realizacji", direction: "System → portal", key: "Numer dokumentu", status: "Kontrakt gotowy", records: "6 statusów" },
  { name: "Dokumenty handlowe", direction: "System → portal", key: "ID dokumentu", status: "Etap 2", records: "PDF" },
] as const;

export const syncEvents = [
  { time: "10:42:18", type: "Stan", entity: "KR-5981-BS-18", result: "Zaktualizowano", detail: "24 arkusze, 7 zarezerwowanych" },
  { time: "10:42:11", type: "Cena", entity: "K-00128 / KR-5981-BS-18", result: "Zaktualizowano", detail: "Cena kontrahenta przeliczona" },
  { time: "10:41:54", type: "Stan", entity: "BL-500-TANDEM", result: "Błąd biznesowy", detail: "Rezerwacja przekracza stan o 4 sztuki" },
  { time: "10:41:31", type: "Zamówienie", entity: "M-2026-0847", result: "Oczekuje", detail: "Brak mapowania dwóch indeksów okuć" },
] as const;

export const integrationSafeguards = [
  "Każde zamówienie ma klucz idempotencji, więc ponowienie nie utworzy duplikatu.",
  "Ceny zapisujemy w zamówieniu jako migawkę, późniejsza zmiana cennika nie zmieni złożonego zamówienia.",
  "Stan dostępny jest pomniejszany o rezerwacje portalu przed potwierdzeniem terminu.",
  "Błędy synchronizacji trafiają do kolejki operatora i nie są automatycznie ignorowane.",
  "Pełny dziennik zmian przechowuje autora, czas, stare i nowe wartości.",
] as const;

export type SalesSystemContract = {
  version: "1.0";
  productKey: "sku";
  customerKey: "externalCustomerId";
  orderKey: "mussiOrderNumber";
  requiredOperations: readonly [
    "pullProducts",
    "pullStock",
    "pullCustomerTerms",
    "pushSalesOrder",
    "pullOrderStatus",
    "pullDocuments",
  ];
};

export const salesSystemContract: SalesSystemContract = {
  version: "1.0",
  productKey: "sku",
  customerKey: "externalCustomerId",
  orderKey: "mussiOrderNumber",
  requiredOperations: ["pullProducts", "pullStock", "pullCustomerTerms", "pushSalesOrder", "pullOrderStatus", "pullDocuments"],
};

/** Identyfikatory wywiedzione z danych, żeby stan wyboru w UI nie zawężał się do jednego literału. */
export type WarehouseOrderId = (typeof warehouseOrders)[number]["id"];
export type CustomerRowId = (typeof customerRows)[number]["id"];
