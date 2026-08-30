import type { Czlonek } from "@/lib/organizacja";

/** Zespół jednej stolarni. Kto zamawia i do jakiej kwoty. */
export const zespolDemo: Czlonek[] = [
  { id: "U-1", imie: "Kazimierz Nowak", email: "kazimierz@stolarnia-nowak.pl", rola: "wlasciciel", limitAkceptacji: null, aktywny: true },
  { id: "U-2", imie: "Anna Wrona", email: "anna@stolarnia-nowak.pl", rola: "kupujacy", limitAkceptacji: 5000, aktywny: true },
  { id: "U-3", imie: "Marek Sikora", email: "marek@stolarnia-nowak.pl", rola: "kupujacy", limitAkceptacji: 1500, aktywny: true },
  { id: "U-4", imie: "Piotr Lis", email: "piotr@stolarnia-nowak.pl", rola: "podglad", limitAkceptacji: 0, aktywny: true },
];
