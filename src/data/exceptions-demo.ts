import type { ZlecenieProdukcyjne } from "@/lib/produkcja";
import type { PozycjaDoRezerwacji, Rezerwacja } from "@/lib/rezerwacje";
import type { Kontrahent } from "@/lib/warunki";
import type { Zamowienie } from "@/lib/zamowienia";

export type ExceptionDomain = "Magazyn" | "Produkcja" | "Sprzedaż" | "Dokumenty" | "Integracja" | "Zakupy";
export type ExceptionSeverity = "Krytyczne" | "Pilne" | "Standard";
export type ExceptionStatus = "Nowe" | "W toku" | "Oczekuje" | "Zamknięte";

export type ExceptionEngineState =
  | {
      kind: "reservation";
      reservations: Rezerwacja[];
      orderId: string;
      positions: PozycjaDoRezerwacji[];
      stocks: Record<string, number>;
    }
  | {
      kind: "production";
      job: ZlecenieProdukcyjne;
      order: Zamowienie;
      today: string;
    }
  | {
      kind: "commercial";
      contractor: Kontrahent;
      grossValue: number;
    };

export type OperationalException = {
  id: string;
  title: string;
  description: string;
  domain: ExceptionDomain;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  owner: string;
  createdAt: string;
  ageMinutes: number;
  slaMinutes: number;
  sourceLabel: string;
  sourceHref: string;
  orderIds: string[];
  recommendedAction: string;
  blocking: boolean;
  engineState?: ExceptionEngineState;
};

export const exceptionOwners = [
  "Nieprzypisane",
  "Magazyn · Operator",
  "Produkcja · Brygadzista",
  "Sprzedaż · Opiekun",
  "Księgowość",
  "Administrator integracji",
] as const;

export const initialOperationalExceptions: OperationalException[] = [
  {
    id: "WX-1048",
    title: "Brak prowadnicy Blum Tandem 500 mm",
    description: "Rezerwacje przekraczają stan o 4 komplety. Dwa zamówienia nie mają pełnego kompletu okuć.",
    domain: "Magazyn",
    severity: "Krytyczne",
    status: "Nowe",
    owner: "Magazyn · Operator",
    createdAt: "dzisiaj, 10:41",
    ageMinutes: 74,
    slaMinutes: 45,
    sourceLabel: "Otwórz stany magazynowe",
    sourceHref: "/hurtownia/stany",
    orderIds: ["M-2026-0842", "M-2026-0835"],
    recommendedAction: "Sprawdź dostawę ZD-2026-0316 i zdecyduj, czy realizować zamówienia częściowo.",
    blocking: true,
    engineState: {
      kind: "reservation",
      reservations: [],
      orderId: "M-2026-0842",
      positions: [{ sku: "BLU-TAND-500", nazwa: "Prowadnica Blum Tandem 500 mm", ilosc: 8 }],
      stocks: { "BLU-TAND-500": 4 },
    },
  },
  {
    id: "WX-1047",
    title: "Oklejanie wstrzymane — brak obrzeża 5981 ABS 2 mm",
    description: "Cięcie zostało zakończone, ale 42 mb krawędzi czeka na materiał. Formatki zajmują miejsce w buforze produkcji.",
    domain: "Produkcja",
    severity: "Krytyczne",
    status: "W toku",
    owner: "Produkcja · Brygadzista",
    createdAt: "dzisiaj, 09:58",
    ageMinutes: 117,
    slaMinutes: 60,
    sourceLabel: "Otwórz kolejkę produkcji",
    sourceHref: "/hurtownia/produkcja",
    orderIds: ["M-2026-0842"],
    recommendedAction: "Potwierdź przyjęcie obrzeża od Hranipex albo przesuń termin odbioru przed kontaktem z klientem.",
    blocking: true,
    engineState: {
      kind: "production",
      today: "2026-08-31T10:55:00.000Z",
      job: {
        zamowienie: "M-2026-0842",
        klient: "Stolarnia Nowak",
        termin: "2026-09-03T12:00:00.000Z",
        etapy: { ciecie: "gotowy", oklejanie: "wstrzymany", kompletacja: "oczekuje" },
        pracochlonnosc: 8,
      },
      order: {
        id: "M-2026-0842",
        status: "w-produkcji",
        przyjeteO: new Date("2026-08-28T10:31:00.000Z"),
        terminOczekiwany: new Date("2026-09-03T12:00:00.000Z"),
        terminPotwierdzony: new Date("2026-09-03T12:00:00.000Z"),
        wersje: [{
          numer: 1,
          pozycje: [{ id: "obrzeze", nazwa: "Obrzeże ABS 2 mm 5981", ilosc: 42, netto: 151.2 }],
          wartoscNetto: 151.2,
          prognoza: new Date("2026-09-04T12:00:00.000Z"),
          utworzona: new Date("2026-08-28T10:31:00.000Z"),
          autor: "biuro",
          powod: null,
        }],
      },
    },
  },
  {
    id: "WX-1046",
    title: "Miękka rezerwacja wygaśnie za 26 minut",
    description: "Towar dla Kuchni Zielonej wróci do puli dostępnej, jeżeli zamówienie nie zostanie przyjęte.",
    domain: "Magazyn",
    severity: "Pilne",
    status: "Nowe",
    owner: "Nieprzypisane",
    createdAt: "dzisiaj, 10:15",
    ageMinutes: 100,
    slaMinutes: 120,
    sourceLabel: "Otwórz zamówienie",
    sourceHref: "/hurtownia/zamowienia",
    orderIds: ["M-2026-0847"],
    recommendedAction: "Przyjmij zamówienie, przedłuż rezerwację z powodem albo zwolnij towar świadomie.",
    blocking: false,
  },
  {
    id: "WX-1045",
    title: "Dwa indeksy okuć bez mapowania",
    description: "Zamówienie nie może zostać wysłane do systemu sprzedażowego, ponieważ indeksy portalu nie mają odpowiedników ERP.",
    domain: "Integracja",
    severity: "Pilne",
    status: "Oczekuje",
    owner: "Administrator integracji",
    createdAt: "dzisiaj, 10:41",
    ageMinutes: 74,
    slaMinutes: 180,
    sourceLabel: "Otwórz centrum integracji",
    sourceHref: "/hurtownia/integracje",
    orderIds: ["M-2026-0847"],
    recommendedAction: "Przypisz SKU systemu sprzedażowego i ponów wyłącznie zdarzenie tego zamówienia.",
    blocking: true,
  },
  {
    id: "WX-1044",
    title: "Brak kompletu danych trzech podmiotów fakturujących",
    description: "Nie można nadać numerów faktur ani wysłać dokumentów do KSeF. Produkcja może trwać, ale wydanie pozostaje zablokowane.",
    domain: "Dokumenty",
    severity: "Pilne",
    status: "W toku",
    owner: "Księgowość",
    createdAt: "wczoraj, 15:20",
    ageMinutes: 1185,
    slaMinutes: 1440,
    sourceLabel: "Otwórz kartotekę podmiotów",
    sourceHref: "/hurtownia/podmioty",
    orderIds: ["M-2026-0848", "M-2026-0847", "M-2026-0842"],
    recommendedAction: "Uzupełnij dane prawne, rachunki i serie numeracji osobno dla każdego podmiotu.",
    blocking: true,
  },
  {
    id: "WX-1043",
    title: "Niezgodność ceny dwóch pozycji",
    description: "Cena zapisana w zamówieniu różni się od aktualnych warunków klienta. Migawka zamówienia nie została automatycznie zmieniona.",
    domain: "Sprzedaż",
    severity: "Standard",
    status: "Nowe",
    owner: "Sprzedaż · Opiekun",
    createdAt: "dzisiaj, 07:16",
    ageMinutes: 279,
    slaMinutes: 480,
    sourceLabel: "Otwórz klientów i rabaty",
    sourceHref: "/hurtownia/klienci",
    orderIds: ["M-2026-0847"],
    recommendedAction: "Porównaj migawkę ceny z warunkami B1 i zaakceptuj starą cenę albo utwórz zmianę wymagającą akceptacji klienta.",
    blocking: false,
    engineState: {
      kind: "commercial",
      grossValue: 7818.4,
      contractor: {
        id: "K-00142",
        nazwa: "Meble Krawiec",
        kodProgu: "B1",
        formaPlatnosci: "przelew-7",
        limitPrzyznany: 0,
        limitWykorzystany: 0,
        obrotRoczny: 6240,
        status: "weryfikacja",
      },
    },
  },
  {
    id: "WX-1042",
    title: "Dostawca nie potwierdził terminu płyt 5981 BS",
    description: "Zamówienie zakupowe zostało wysłane, ale oczekiwany dzień dostawy nadal jest wyliczeniem systemowym.",
    domain: "Zakupy",
    severity: "Standard",
    status: "Oczekuje",
    owner: "Magazyn · Operator",
    createdAt: "wczoraj, 10:22",
    ageMinutes: 1483,
    slaMinutes: 2880,
    sourceLabel: "Otwórz zakupy i dostawy",
    sourceHref: "/hurtownia/zakupy",
    orderIds: ["M-2026-0847", "M-2026-0848"],
    recommendedAction: "Skontaktuj się z dostawcą i zapisz potwierdzony termin wraz z osobą potwierdzającą.",
    blocking: false,
  },
];
