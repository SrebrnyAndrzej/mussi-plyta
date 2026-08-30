import type { PozycjaWydania, SlotOdbioru, ZlecenieProdukcyjne } from "@/lib/produkcja";

export const zleceniaDemo: ZlecenieProdukcyjne[] = [
  { zamowienie: "M-2026-0835", klient: "Stolarstwo Lis", termin: "2026-08-28", etapy: { ciecie: "gotowy", oklejanie: "wstrzymany", kompletacja: "oczekuje" }, pracochlonnosc: 11 },
  { zamowienie: "M-2026-0842", klient: "Stolarnia Nowak", termin: "2026-09-03", etapy: { ciecie: "gotowy", oklejanie: "w-toku", kompletacja: "oczekuje" }, pracochlonnosc: 6 },
  { zamowienie: "M-2026-0847", klient: "Meble Krawiec", termin: "2026-09-04", etapy: { ciecie: "w-toku", oklejanie: "oczekuje", kompletacja: "oczekuje" }, pracochlonnosc: 4.5 },
  { zamowienie: "M-2026-0848", klient: "Stolarnia Dąb", termin: "2026-09-04", etapy: { ciecie: "oczekuje", oklejanie: "oczekuje", kompletacja: "oczekuje" }, pracochlonnosc: 8 },
  { zamowienie: "M-2026-0839", klient: "Forma Studio", termin: "2026-09-10", etapy: { ciecie: "gotowy", oklejanie: "gotowy", kompletacja: "gotowy" }, pracochlonnosc: 9 },
];

export const slotyDemo: SlotOdbioru[] = [
  { id: "s-0903-1", dzien: "2026-09-03", od: "08:00", do: "10:00", pojemnosc: 2, zajete: ["M-2026-0839"] },
  { id: "s-0903-2", dzien: "2026-09-03", od: "10:00", do: "12:00", pojemnosc: 2, zajete: [] },
  { id: "s-0903-3", dzien: "2026-09-03", od: "13:00", do: "15:00", pojemnosc: 1, zajete: [] },
  { id: "s-0904-1", dzien: "2026-09-04", od: "08:00", do: "10:00", pojemnosc: 2, zajete: [] },
  { id: "s-0904-2", dzien: "2026-09-04", od: "10:00", do: "12:00", pojemnosc: 2, zajete: [] },
];

export const wydanieDemo: PozycjaWydania[] = [
  { sku: "KR-5981-BS-18", nazwa: "Płyta 5981 BS Dąb Palmowy 18 mm", zamowiono: 6, wydano: 6 },
  { sku: "OB-5981-ABS2", nazwa: "Obrzeże ABS 2 mm 5981", zamowiono: 42, wydano: 42 },
  { sku: "BLU-TAND-500", nazwa: "Prowadnica Blum Tandem 500 mm", zamowiono: 4, wydano: 0 },
];
