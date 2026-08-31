export type Kategoria = "plyta" | "blat" | "front" | "sklejka" | "obrzeze" | "akcesorium";
export type Dostepnosc = "na-stanie" | "ostatnie-sztuki" | "na-zamowienie";

export type Dekor = {
  id: string;
  /** Kod producenta, np. "K003 PW". */
  kod: string;
  nazwa: string;
  producent: string;
  kategoria: Kategoria;
  /** Opis struktury i dostępnych grubości. */
  opis: string;
  grubosciMm: number[];
  /** Cena katalogowa netto za jednostkę. */
  cenaKatalogowa: number;
  jednostka: "arkusz" | "mb" | "szt";
  dostepnosc: Dostepnosc;
  /** Podgląd powierzchni jako CSS background. Docelowo zastąpi go zdjęcie próbki. */
  probka: string;
  image?: string;
};

const drewno = (a: string, b: string, c: string) =>
  `repeating-linear-gradient(93deg,${a} 0 4px,${b} 4px 9px,${a} 9px 14px,${c} 14px 17px)`;
const gladki = (a: string, b: string) => `linear-gradient(158deg,${a},${b})`;
const kamien = (a: string, b: string) =>
  `radial-gradient(120% 90% at 22% 12%,${b} 0%,transparent 55%),radial-gradient(100% 80% at 78% 88%,${b} 0%,transparent 50%),${a}`;

/**
 * Zalążek katalogu. Kody i nazwy są prawdziwe (Kronospan, Forner, Cleaf),
 * ceny i stany są przykładowe do czasu podpięcia magazynu hurtowni.
 */
export const dekory: Dekor[] = [
  { id: "e-h1180", kod: "H1180 ST37", nazwa: "Dąb Halifax Naturalny", producent: "Egger", kategoria: "plyta",
    opis: "Struktura szczotkowanego drewna", grubosciMm: [18, 25], cenaKatalogowa: 268, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: drewno("#B08B5E", "#9E7A4C", "#7F5D34") },
  { id: "e-h1145", kod: "H1145 ST10", nazwa: "Dąb Bardolino Naturalny", producent: "Egger", kategoria: "plyta",
    opis: "Jasne drewno o wyraźnym rysunku", grubosciMm: [18], cenaKatalogowa: 254, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: drewno("#C4A87C", "#B39868", "#96794C") },
  { id: "e-h3303", kod: "H3303 ST10", nazwa: "Dąb Hamilton Naturalny", producent: "Egger", kategoria: "plyta",
    opis: "Ciepły odcień z podłużnym słojem", grubosciMm: [18], cenaKatalogowa: 262, jednostka: "arkusz",
    dostepnosc: "ostatnie-sztuki", probka: drewno("#AD8756", "#997444", "#7C5A30") },
  { id: "e-w1000", kod: "W1000 ST9", nazwa: "Biały Premium", producent: "Egger", kategoria: "plyta",
    opis: "Jednolita biel, struktura głęboka matowa", grubosciMm: [18], cenaKatalogowa: 231, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: gladki("#FCFCFB", "#EFEFEC") },
  { id: "e-u999", kod: "U999 ST2", nazwa: "Czarny", producent: "Egger", kategoria: "plyta",
    opis: "Głęboka czerń, struktura drobna", grubosciMm: [18], cenaKatalogowa: 245, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: gladki("#232326", "#131315") },
  { id: "e-u732", kod: "U732 ST9", nazwa: "Szary Pyłkowy", producent: "Egger", kategoria: "plyta",
    opis: "Chłodny szary, struktura głęboka matowa", grubosciMm: [18], cenaKatalogowa: 238, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: gladki("#A9A9A6", "#918F8C") },
  { id: "e-u104", kod: "U104 ST9", nazwa: "Biel Alpejska", producent: "Egger", kategoria: "plyta",
    opis: "Ciepła biel do frontów i korpusów", grubosciMm: [18], cenaKatalogowa: 229, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: gladki("#F7F5F0", "#E8E5DE") },
  { id: "e-f186", kod: "F186 ST9", nazwa: "Beton Chicago Jasnoszary", producent: "Egger", kategoria: "plyta",
    opis: "Imitacja betonu architektonicznego", grubosciMm: [18], cenaKatalogowa: 256, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: kamien("#B7B5B0", "#CFCDC8") },
  { id: "k350", kod: "K350 PW", nazwa: "Beton Chicago Jasny", producent: "Kronospan", kategoria: "plyta",
    opis: "Surowa struktura betonu", grubosciMm: [18], cenaKatalogowa: 244, jednostka: "arkusz",
    dostepnosc: "na-zamowienie", probka: kamien("#BCBAB5", "#D3D1CC") },
  { id: "k089", kod: "K089 PW", nazwa: "Dąb Halifax Tabac", producent: "Kronospan", kategoria: "plyta",
    opis: "Ciemny dąb o wyraźnych porach", grubosciMm: [18], cenaKatalogowa: 259, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: drewno("#7C5B3C", "#68492E", "#4E351F") },
  { id: "e-f812", kod: "F812 ST9", nazwa: "Marmur Levanto Biały", producent: "Egger", kategoria: "blat",
    opis: "Blat roboczy, marmur z ciemnym żyłkowaniem", grubosciMm: [38], cenaKatalogowa: 412, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: kamien("#F2F1EE", "#D6D4CF") },
  { id: "e-f205", kod: "F205 ST9", nazwa: "Marmur Candela Ciemnoszary", producent: "Egger", kategoria: "blat",
    opis: "Blat roboczy, ciemny kamień", grubosciMm: [38], cenaKatalogowa: 428, jednostka: "arkusz",
    dostepnosc: "ostatnie-sztuki", probka: kamien("#55545A", "#6E6D74") },
  { id: "c-fenix-bianco", kod: "FENIX 0032", nazwa: "Bianco Kos", producent: "Cleaf", kategoria: "front",
    opis: "Powierzchnia supermatowa, odporna na odciski", grubosciMm: [18], cenaKatalogowa: 486, jednostka: "arkusz",
    dostepnosc: "na-zamowienie", probka: gladki("#F4F3F1", "#E2E0DC") },
  { id: "c-fenix-nero", kod: "FENIX 0720", nazwa: "Nero Ingo", producent: "Cleaf", kategoria: "front",
    opis: "Czerń supermatowa z regeneracją mikrorys", grubosciMm: [18], cenaKatalogowa: 498, jednostka: "arkusz",
    dostepnosc: "na-zamowienie", probka: gladki("#26262A", "#161619") },
  { id: "ob-h1180", kod: "ABS 22x1 H1180", nazwa: "Obrzeże ABS Dąb Halifax", producent: "Hranipex", kategoria: "obrzeze",
    opis: "Obrzeże dopasowane do dekoru H1180", grubosciMm: [1], cenaKatalogowa: 3.9, jednostka: "mb",
    dostepnosc: "na-stanie", probka: drewno("#B08B5E", "#9E7A4C", "#7F5D34") },
  { id: "ob-u999", kod: "ABS 22x2 U999", nazwa: "Obrzeże ABS Czarne", producent: "Rehau", kategoria: "obrzeze",
    opis: "Obrzeże 2 mm do frontów i blatów", grubosciMm: [2], cenaKatalogowa: 5.1, jednostka: "mb",
    dostepnosc: "na-stanie", probka: gladki("#232326", "#131315") },
  { id: "k003", kod: "K003 PW", nazwa: "Dąb Craft Złoty", producent: "Kronospan", kategoria: "plyta",
    opis: "Struktura porów drewna", grubosciMm: [18], cenaKatalogowa: 248, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: drewno("#B98A52", "#A87840", "#8C5F2E") },
  { id: "k002", kod: "K002 PW", nazwa: "Dąb Craft Biały", producent: "Kronospan", kategoria: "plyta",
    opis: "Struktura porów drewna", grubosciMm: [18], cenaKatalogowa: 252, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: drewno("#D9CBB6", "#CBB99F", "#B7A184") },
  { id: "k105", kod: "K105 PW", nazwa: "Dąb Halifax Naturalny", producent: "Kronospan", kategoria: "plyta",
    opis: "Struktura porów drewna", grubosciMm: [18], cenaKatalogowa: 269, jednostka: "arkusz",
    dostepnosc: "na-zamowienie", probka: drewno("#A9835A", "#916B45", "#75512F") },
  { id: "k101", kod: "K101 PE", nazwa: "Biały Premium", producent: "Kronospan", kategoria: "plyta",
    opis: "Powierzchnia gładka", grubosciMm: [18, 10, 3], cenaKatalogowa: 209, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: "linear-gradient(158deg,#FDFDFC,#ECECE9)" },
  { id: "u999", kod: "U999 ST2", nazwa: "Czarny", producent: "Kronospan", kategoria: "plyta",
    opis: "Struktura drobna", grubosciMm: [18], cenaKatalogowa: 231, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: "linear-gradient(158deg,#2F2E30,#131214)" },
  { id: "u702", kod: "U702 ST9", nazwa: "Kaszmir", producent: "Kronospan", kategoria: "plyta",
    opis: "Struktura krzyżowa", grubosciMm: [18], cenaKatalogowa: 222, jednostka: "arkusz",
    dostepnosc: "ostatnie-sztuki", probka: "linear-gradient(158deg,#DAD3C8,#C0B8AB)" },
  { id: "k350", kod: "K350 SN", nazwa: "Beton Jasny", producent: "Kronospan", kategoria: "plyta",
    opis: "Struktura kamienia", grubosciMm: [18], cenaKatalogowa: 263, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: kamien("#BEBBB7", "#D9D6D2") },
  { id: "k540", kod: "K540 SU", nazwa: "Marmur Levanto", producent: "Kronospan", kategoria: "blat",
    opis: "Postforming R3, długość do 4100 mm", grubosciMm: [38], cenaKatalogowa: 374, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: kamien("#E6E4DF", "#FCFCFB") },
  { id: "k511", kod: "K511 SN", nazwa: "Dąb Denver", producent: "Kronospan", kategoria: "blat",
    opis: "Postforming R6, długość 3050 mm", grubosciMm: [38], cenaKatalogowa: 348, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: drewno("#9C7A55", "#8A6944", "#6E5132") },
  { id: "cleaf59", kod: "CLEAF 59", nazwa: "Kolekcja 59 by Cleaf", producent: "Forner", kategoria: "front",
    opis: "Melamina o głębokiej strukturze, 16 wariantów", grubosciMm: [18], cenaKatalogowa: 458, jednostka: "arkusz",
    dostepnosc: "na-stanie", probka: drewno("#7E6752", "#6B5643", "#523F30") },
  { id: "akrpx", kod: "AKR-PX", nazwa: "Akryl Premium X połysk", producent: "Niemann", kategoria: "front",
    opis: "Format do 2780 na 1230 mm", grubosciMm: [18], cenaKatalogowa: 485, jednostka: "arkusz",
    dostepnosc: "ostatnie-sztuki",
    probka: "linear-gradient(140deg,#F4F6F8 0%,#CBD3DA 45%,#F9FAFB 60%,#B9C3CB 100%)" },
  { id: "sklwd", kod: "SKL-WD", nazwa: "Sklejka wodoodporna", producent: "Sklejka-Pisz", kategoria: "sklejka",
    opis: "Antypoślizgowa, grubości od 9 do 21 mm", grubosciMm: [9, 12, 15, 18, 21], cenaKatalogowa: 315,
    jednostka: "arkusz", dostepnosc: "na-stanie", probka: drewno("#C9A878", "#B99562", "#9E7B4A") },
  { id: "skls", kod: "SKL-LS", nazwa: "Sklejka liściasta", producent: "Sklejka-Pisz", kategoria: "sklejka",
    opis: "Grubości od 3 do 24 mm, gięta 3 i 5 mm", grubosciMm: [3, 5, 12, 18, 24], cenaKatalogowa: 219,
    jednostka: "arkusz", dostepnosc: "ostatnie-sztuki", probka: drewno("#DCC49B", "#CDB388", "#B79B6E") },
  { id: "osb18", kod: "OSB-18", nazwa: "OSB 3", producent: "Kronospan", kategoria: "sklejka",
    opis: "Grubości od 10 do 25 mm", grubosciMm: [10, 12, 15, 18, 22, 25], cenaKatalogowa: 111,
    jednostka: "arkusz", dostepnosc: "na-stanie", probka: kamien("#C2A472", "#DDC79A") },
  { id: "abs22", kod: "ABS 22x1", nazwa: "Obrzeże ABS w kolorze płyty", producent: "Hranipex", kategoria: "obrzeze",
    opis: "Dobierane do dekoru, grubość 1 i 2 mm", grubosciMm: [1, 2], cenaKatalogowa: 2.4,
    jednostka: "mb", dostepnosc: "na-stanie", probka: drewno("#B98A52", "#A87840", "#8C5F2E") },
];

/** Marki, z którymi hurtownia współpracuje. Kolejność jak na pasku partnerów. */
export const producenci = [
  "Kronospan", "Blum", "Häfele", "Forner", "Cleaf", "Drewpol", "Restol", "Naturano",
  "Laguna", "Amix", "Peka", "Wireli", "Domino", "Kash", "Niemann", "Biuro Styl",
  "GTV", "Hranipex", "Rehau", "Fest", "Frontpol", "Sta-Put", "Bosetti Marella", "CDO", "Elcavo",
] as const;
