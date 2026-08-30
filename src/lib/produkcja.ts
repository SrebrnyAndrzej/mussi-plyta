/**
 * Kolejka produkcji i plan odbiorów.
 *
 * Najwięcej telefonów do biura dotyczy terminu, więc to tutaj oszczędność
 * czasu jest najbardziej wymierna. Moduł odpowiada na trzy pytania:
 * co jest na jakim etapie, co się nie zdąży, i kiedy klient ma przyjechać.
 *
 * Reguły z `design/004-b2b-crm-erp-spec.md`, sekcja „Panel operacyjny Mussi”.
 */

export type Etap = "ciecie" | "oklejanie" | "kompletacja";

export const etapy: Array<{ id: Etap; nazwa: string; kolejnosc: number }> = [
  { id: "ciecie", nazwa: "Cięcie", kolejnosc: 1 },
  { id: "oklejanie", nazwa: "Oklejanie", kolejnosc: 2 },
  { id: "kompletacja", nazwa: "Kompletacja", kolejnosc: 3 },
];

export type StanEtapu = "oczekuje" | "w-toku" | "gotowy" | "wstrzymany";

export type ZlecenieProdukcyjne = {
  zamowienie: string;
  klient: string;
  /** Termin, na który zamówienie ma być gotowe. */
  termin: string;
  etapy: Record<Etap, StanEtapu>;
  /** Godziny pracy potrzebne na całość, do oceny obciążenia. */
  pracochlonnosc: number;
};

export function nastepnyEtap(z: ZlecenieProdukcyjne): Etap | null {
  const kolejne = etapy
    .slice()
    .sort((a, b) => a.kolejnosc - b.kolejnosc)
    .find((e) => z.etapy[e.id] !== "gotowy");
  return kolejne?.id ?? null;
}

export function czyZakonczone(z: ZlecenieProdukcyjne): boolean {
  return nastepnyEtap(z) === null;
}

export function czyWstrzymane(z: ZlecenieProdukcyjne): boolean {
  return etapy.some((e) => z.etapy[e.id] === "wstrzymany");
}

/** Udział gotowych etapów, od zera do jednego. */
export function postep(z: ZlecenieProdukcyjne): number {
  const gotowe = etapy.filter((e) => z.etapy[e.id] === "gotowy").length;
  return Math.round((gotowe / etapy.length) * 100) / 100;
}

export type PilnoscZlecenia = "spokojnie" | "pilne" | "zagrozone" | "po-terminie";

const DZIEN = 24 * 60 * 60 * 1000;

/**
 * Jak bardzo zlecenie się pali.
 *
 * Zlecenie wstrzymane jest zagrożone niezależnie od kalendarza, bo ktoś
 * musi podjąć decyzję, zanim zegar zdąży cokolwiek zmienić.
 */
export function pilnosc(z: ZlecenieProdukcyjne, dzis: Date = new Date()): PilnoscZlecenia {
  if (czyZakonczone(z)) return "spokojnie";
  const doTerminu = Math.floor((new Date(z.termin).getTime() - dzis.getTime()) / DZIEN);
  if (doTerminu < 0) return "po-terminie";
  if (czyWstrzymane(z)) return "zagrozone";
  if (doTerminu <= 1) return "zagrozone";
  if (doTerminu <= 3) return "pilne";
  return "spokojnie";
}

const wagaPilnosci: Record<PilnoscZlecenia, number> = {
  "po-terminie": 0,
  zagrozone: 1,
  pilne: 2,
  spokojnie: 3,
};

/**
 * Kolejka dla operatora: najpierw to, co się pali, potem wcześniejszy termin.
 * Zlecenia zakończone spadają na koniec.
 */
export function kolejka(
  zlecenia: readonly ZlecenieProdukcyjne[],
  dzis: Date = new Date(),
): ZlecenieProdukcyjne[] {
  return zlecenia.slice().sort((a, b) => {
    const zakonczoneA = czyZakonczone(a) ? 1 : 0;
    const zakonczoneB = czyZakonczone(b) ? 1 : 0;
    if (zakonczoneA !== zakonczoneB) return zakonczoneA - zakonczoneB;
    const roznica = wagaPilnosci[pilnosc(a, dzis)] - wagaPilnosci[pilnosc(b, dzis)];
    if (roznica !== 0) return roznica;
    return a.termin.localeCompare(b.termin);
  });
}

export function naEtapie(zlecenia: readonly ZlecenieProdukcyjne[], etap: Etap): ZlecenieProdukcyjne[] {
  return zlecenia.filter((z) => z.etapy[etap] === "w-toku" || z.etapy[etap] === "oczekuje");
}

export type WynikEtapu =
  | { ok: true; zlecenie: ZlecenieProdukcyjne }
  | { ok: false; blad: string };

/**
 * Zmiana stanu etapu. Etapu nie da się zacząć, dopóki poprzedni nie jest gotowy,
 * bo nie da się okleić formatki, której jeszcze nie wycięto.
 */
export function ustawEtap(
  z: ZlecenieProdukcyjne,
  etap: Etap,
  stan: StanEtapu,
  autor: string,
): WynikEtapu {
  if (!autor.trim()) return { ok: false, blad: "Zmiana etapu wymaga wskazania operatora." };
  if (z.etapy[etap] === stan) return { ok: false, blad: "Etap jest już w tym stanie." };

  const opis = etapy.find((e) => e.id === etap)!;
  const poprzedni = etapy.find((e) => e.kolejnosc === opis.kolejnosc - 1);

  if ((stan === "w-toku" || stan === "gotowy") && poprzedni && z.etapy[poprzedni.id] !== "gotowy") {
    return { ok: false, blad: `Najpierw trzeba zamknąć etap „${poprzedni.nazwa}”.` };
  }

  return { ok: true, zlecenie: { ...z, etapy: { ...z.etapy, [etap]: stan } } };
}

export type SlotOdbioru = {
  id: string;
  /** Dzień w formacie RRRR-MM-DD. */
  dzien: string;
  od: string;
  do: string;
  /** Ile odbiorów rampa obsłuży w tym oknie. */
  pojemnosc: number;
  zajete: string[];
};

export function wolneMiejsca(slot: SlotOdbioru): number {
  return slot.pojemnosc - slot.zajete.length;
}

export type WynikRezerwacjiOdbioru =
  | { ok: true; sloty: SlotOdbioru[] }
  | { ok: false; blad: string };

/** Zapisanie zamówienia na okno odbioru. */
export function zarezerwujOdbior(
  sloty: readonly SlotOdbioru[],
  slotId: string,
  zamowienie: string,
): WynikRezerwacjiOdbioru {
  const slot = sloty.find((s) => s.id === slotId);
  if (!slot) return { ok: false, blad: "Nie znaleziono okna odbioru." };
  if (slot.zajete.includes(zamowienie)) {
    return { ok: false, blad: "To zamówienie jest już zapisane na ten odbiór." };
  }
  if (wolneMiejsca(slot) <= 0) {
    return { ok: false, blad: "Okno odbioru jest pełne." };
  }
  if (sloty.some((s) => s.id !== slotId && s.zajete.includes(zamowienie))) {
    return { ok: false, blad: "Zamówienie ma już zapisany inny odbiór." };
  }
  return {
    ok: true,
    sloty: sloty.map((s) => (s.id === slotId ? { ...s, zajete: [...s.zajete, zamowienie] } : s)),
  };
}

export function odwolajOdbior(sloty: readonly SlotOdbioru[], zamowienie: string): SlotOdbioru[] {
  return sloty.map((s) =>
    s.zajete.includes(zamowienie) ? { ...s, zajete: s.zajete.filter((z) => z !== zamowienie) } : s,
  );
}

export type PozycjaWydania = {
  sku: string;
  nazwa: string;
  zamowiono: number;
  wydano: number;
};

export type StanRealizacji = "pelna" | "czesciowa" | "brak";

/**
 * Realizacja częściowa. Klient odbiera to, co gotowe, a reszta zostaje
 * na zamówieniu, zamiast blokować cały odbiór z powodu jednej prowadnicy.
 */
export function stanRealizacji(pozycje: readonly PozycjaWydania[]): StanRealizacji {
  if (pozycje.length === 0) return "brak";
  const wydaneWszystko = pozycje.every((p) => p.wydano >= p.zamowiono);
  if (wydaneWszystko) return "pelna";
  return pozycje.some((p) => p.wydano > 0) ? "czesciowa" : "brak";
}

export function doWydania(pozycje: readonly PozycjaWydania[]): PozycjaWydania[] {
  return pozycje.filter((p) => p.wydano < p.zamowiono);
}

export type ObciazenieDnia = {
  dzien: string;
  godziny: number;
  zlecenia: number;
};

/** Ile pracy stoi na dany termin. Pozwala zobaczyć spiętrzenie, zanim nastąpi. */
export function obciazenie(
  zlecenia: readonly ZlecenieProdukcyjne[],
): ObciazenieDnia[] {
  const wg = new Map<string, ObciazenieDnia>();
  for (const z of zlecenia) {
    if (czyZakonczone(z)) continue;
    const dotad = wg.get(z.termin) ?? { dzien: z.termin, godziny: 0, zlecenia: 0 };
    wg.set(z.termin, {
      dzien: z.termin,
      godziny: Math.round((dotad.godziny + z.pracochlonnosc) * 10) / 10,
      zlecenia: dotad.zlecenia + 1,
    });
  }
  return [...wg.values()].sort((a, b) => a.dzien.localeCompare(b.dzien));
}
