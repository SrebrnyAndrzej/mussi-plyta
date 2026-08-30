import type { Cennik, CenaIndywidualna, Kontrahent } from "@/lib/warunki";

/** Kontrahenci hurtowni. Wartości zalążkowe do czasu podpięcia bazy. */
export const kontrahenci: Kontrahent[] = [
  { id: "K-00128", nazwa: "Stolarnia Nowak", kodProgu: "B2", formaPlatnosci: "przelew-14", limitPrzyznany: 25000, limitWykorzystany: 6580, obrotRoczny: 18420, status: "aktywny" },
  { id: "K-00074", nazwa: "Forma Studio", kodProgu: "B3", formaPlatnosci: "przelew-21", limitPrzyznany: 45000, limitWykorzystany: 38900, obrotRoczny: 31880, status: "aktywny" },
  { id: "K-00142", nazwa: "Meble Krawiec", kodProgu: "B1", formaPlatnosci: "przedplata", limitPrzyznany: 0, limitWykorzystany: 0, obrotRoczny: 6240, status: "weryfikacja" },
  { id: "K-00039", nazwa: "Stolarstwo Lis", kodProgu: "B2", formaPlatnosci: "przelew-7", limitPrzyznany: 15000, limitWykorzystany: 14200, obrotRoczny: 12960, status: "blokada" },
];

export const cenniki: Cennik[] = [
  {
    id: "2026-podstawowy",
    nazwa: "Cennik podstawowy 2026",
    obowiazujeOd: "2026-01-01",
    obowiazujeDo: "2026-08-31",
    ceny: { "KR-5981-BS-18": 210, "OB-5981-ABS2": 4.5, "HDF-BIA-3": 62, "BLU-TAND-500": 89 },
  },
  {
    id: "2026-wrzesien",
    nazwa: "Cennik od września",
    obowiazujeOd: "2026-09-01",
    obowiazujeDo: null,
    ceny: { "KR-5981-BS-18": 232, "OB-5981-ABS2": 4.9, "HDF-BIA-3": 68, "BLU-TAND-500": 94 },
  },
];

export const cenyIndywidualne: CenaIndywidualna[] = [
  { kontrahent: "K-00074", sku: "KR-5981-BS-18", cena: 178, obowiazujeOd: "2026-03-01", obowiazujeDo: null },
  { kontrahent: "K-00128", sku: "BLU-TAND-500", cena: 74.5, obowiazujeOd: "2026-06-01", obowiazujeDo: "2026-12-31" },
];

export const indeksyDemo = [
  { sku: "KR-5981-BS-18", nazwa: "Płyta 5981 BS Dąb Palmowy 18 mm", jednostka: "ark." },
  { sku: "OB-5981-ABS2", nazwa: "Obrzeże ABS 2 mm 5981", jednostka: "mb" },
  { sku: "HDF-BIA-3", nazwa: "HDF biały 3 mm", jednostka: "ark." },
  { sku: "BLU-TAND-500", nazwa: "Prowadnica Blum Tandem 500 mm", jednostka: "kpl." },
] as const;
