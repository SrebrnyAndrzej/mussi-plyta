/**
 * Zdjęcia hurtowni i logotypy producentów.
 * Pliki pochodzą z serwera Mussi-Płyta, przeszły korekcję ekspozycji
 * i balansu bieli, leżą w `public/`. Wymiary są potrzebne next/image,
 * żeby nie było przeskoku układu przy ładowaniu.
 */
export type Zdjecie = { src: string; szer: number; wys: number; alt: string };

export const zdjecia = {
  hala: {
    src: "/zdjecia/hala.webp", szer: 1100, wys: 458,
    alt: "Hala hurtowni Mussi-Płyta przy ulicy Działkowej 19 w Zielonej Górze",
  },
  dekory: {
    src: "/zdjecia/decors.webp", szer: 1300, wys: 1083,
    alt: "Regał z próbkami dekorów płyt meblowych w hurtowni",
  },
  probki: {
    src: "/zdjecia/samples.webp", szer: 1200, wys: 1200,
    alt: "Ekspozycja próbek frontów i płyt klejonych",
  },
  showroom: {
    src: "/zdjecia/showroom.webp", szer: 1200, wys: 1200,
    alt: "Ekspozycja akcesoriów meblowych w hurtowni",
  },
  auto: {
    src: "/zdjecia/truck.webp", szer: 1500, wys: 968,
    alt: "Samochód dostawczy Mussi-Płyta z ofertą hurtowni",
  },
  kuchniaCiemna: {
    src: "/zdjecia/kitchen1.webp", szer: 1400, wys: 933,
    alt: "Ciemna kuchnia z miedzianym panelem i frontami bezuchwytowymi",
  },
  kuchniaJasna: {
    src: "/zdjecia/kitchen2.webp", szer: 880, wys: 1100,
    alt: "Jasna kuchnia z drewnianym blatem wyspy i przeszkleniem w czarnej ramie",
  },
} as const satisfies Record<string, Zdjecie>;

/**
 * Logotypy producentów w kolejności paska partnerów.
 * Wyświetlamy je w skali szarości, kolor wraca pod kursorem.
 */
export const logotypy = [
  "AMIX", "Kash", "Rehau", "Peka", "Biuro-Styl", "Kronospan", "Domino",
  "Drewpol", "GTV", "Laguna", "Hranipex", "Restol", "Hafele", "Fest",
  "Frontpol", "Sta-Put", "Bosetti-Marella", "CDO", "Elcavo",
].map((nazwa) => ({
  nazwa: nazwa.replace(/-/g, " "),
  src: `/logotypy/${nazwa}.webp`,
}));

/** Podpisy pod realizacjami. Zdjęcia noszą znak wodny pracowni, która je wykonała. */
export const realizacje = [
  { zdjecie: zdjecia.kuchniaCiemna, podpis: "Fronty bezuchwytowe na czarnej płycie, panel w dekorze kamiennym." },
  { zdjecie: zdjecia.kuchniaJasna, podpis: "Biała zabudowa z drewnianym blatem wyspy i przeszkleniem w czarnej ramie." },
] as const;
