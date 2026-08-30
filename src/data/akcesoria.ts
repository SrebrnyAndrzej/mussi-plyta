/**
 * Asortyment akcesoriów hurtowni.
 *
 * Kategorie i marki odwzorowują to, co Mussi-Płyta wymienia na swojej stronie:
 * uchwyty i gałki, wieszaki, nogi, zawiasy, prowadnice, podnośniki, wkłady na
 * sztućce, wkręty, konfirmaty, bity, kleje, silikony, akryle, woski, kosze cargo,
 * ociekarki, kosze na śmieci, szkła i lustra, oświetlenie LED, ramki aluminiowe,
 * systemy szuflad oraz obrzeża.
 *
 * Stany są liczbami, a nie tekstem, bo panel hurtowni musi na nich liczyć.
 */

export type KategoriaAkcesorium =
  | "okucia"
  | "szuflady"
  | "oswietlenie"
  | "zlaczki"
  | "chemia"
  | "kosze"
  | "uchwyty"
  | "szklo"
  | "obrzeza";

export type Jednostka = "szt" | "kpl" | "mb" | "m2" | "opak";

export type Akcesorium = {
  sku: string;
  nazwa: string;
  producent: string;
  kategoria: KategoriaAkcesorium;
  jednostka: Jednostka;
  /** Cena katalogowa netto za jednostkę. */
  cena: number;
  /** Ilość wynikająca z dokumentów. */
  stanSystemowy: number;
  /** Ilość zarezerwowana pod przyjęte zamówienia. */
  rezerwacje: number;
  /** Poziom, poniżej którego zamawiamy u dostawcy. */
  stanMinimalny: number;
  image?: string;
};

export const kategorieAkcesoriow: Array<{ id: KategoriaAkcesorium; nazwa: string }> = [
  { id: "okucia", nazwa: "Okucia" },
  { id: "szuflady", nazwa: "Systemy szuflad" },
  { id: "oswietlenie", nazwa: "Oświetlenie" },
  { id: "zlaczki", nazwa: "Złączki i wkręty" },
  { id: "chemia", nazwa: "Kleje i chemia" },
  { id: "kosze", nazwa: "Kosze i organizacja" },
  { id: "uchwyty", nazwa: "Uchwyty i nogi" },
  { id: "szklo", nazwa: "Szkło i lustra" },
  { id: "obrzeza", nazwa: "Obrzeża" },
];

export const akcesoria: Akcesorium[] = [
  // ── okucia ──
  { sku: "BLU-CLIP-110", nazwa: "Zawias Blum Clip Top 110 stopni", producent: "Blum", kategoria: "okucia", jednostka: "szt", cena: 14.9, stanSystemowy: 420, rezerwacje: 86, stanMinimalny: 120 },
  { sku: "GTV-ZM-ECHC09", nazwa: "Zawias GTV cichy domyk", producent: "GTV", kategoria: "okucia", jednostka: "szt", cena: 6.4, stanSystemowy: 82, rezerwacje: 35, stanMinimalny: 60 },
  { sku: "BLU-TAND-500", nazwa: "Prowadnica Blum Tandem 500 mm", producent: "Blum", kategoria: "okucia", jednostka: "kpl", cena: 62.0, stanSystemowy: 0, rezerwacje: 4, stanMinimalny: 20 },
  { sku: "HAF-PROW-450", nazwa: "Prowadnica kulkowa Häfele 450 mm", producent: "Häfele", kategoria: "okucia", jednostka: "kpl", cena: 24.5, stanSystemowy: 96, rezerwacje: 12, stanMinimalny: 30 },
  { sku: "BLU-AVENT-HK", nazwa: "Podnośnik Blum Aventos HK", producent: "Blum", kategoria: "okucia", jednostka: "kpl", cena: 189.0, stanSystemowy: 18, rezerwacje: 6, stanMinimalny: 8 },
  { sku: "AMX-PODN-GS", nazwa: "Podnośnik gazowy Amix 100 N", producent: "Amix", kategoria: "okucia", jednostka: "szt", cena: 18.9, stanSystemowy: 140, rezerwacje: 20, stanMinimalny: 40 },

  // ── systemy szuflad ──
  { sku: "BLU-TBOX-M450", nazwa: "Blum Tandembox M 450 mm", producent: "Blum", kategoria: "szuflady", jednostka: "kpl", cena: 96.0, stanSystemowy: 64, rezerwacje: 24, stanMinimalny: 20 },
  { sku: "BLU-LBOX-C500", nazwa: "Blum Legrabox C 500 mm", producent: "Blum", kategoria: "szuflady", jednostka: "kpl", cena: 178.0, stanSystemowy: 22, rezerwacje: 10, stanMinimalny: 12 },
  { sku: "GTV-MODERN-400", nazwa: "GTV Modern Box 400 mm", producent: "GTV", kategoria: "szuflady", jednostka: "kpl", cena: 48.0, stanSystemowy: 110, rezerwacje: 18, stanMinimalny: 30 },
  { sku: "PEK-WKL-STU-500", nazwa: "Wkład na sztućce Peka 500 mm", producent: "Peka", kategoria: "szuflady", jednostka: "szt", cena: 74.0, stanSystemowy: 34, rezerwacje: 5, stanMinimalny: 15 },

  // ── oświetlenie ──
  { sku: "WIR-LED-4000", nazwa: "Taśma LED 12 V 4000 K, rolka 5 m", producent: "Wireli", kategoria: "oswietlenie", jednostka: "szt", cena: 58.0, stanSystemowy: 46, rezerwacje: 8, stanMinimalny: 15 },
  { sku: "WIR-ZAS-60W", nazwa: "Zasilacz LED 60 W 12 V", producent: "Wireli", kategoria: "oswietlenie", jednostka: "szt", cena: 72.0, stanSystemowy: 28, rezerwacje: 6, stanMinimalny: 12 },
  { sku: "DOM-OPR-COB", nazwa: "Oprawa nawierzchniowa COB, aluminium", producent: "Domino", kategoria: "oswietlenie", jednostka: "szt", cena: 39.0, stanSystemowy: 88, rezerwacje: 14, stanMinimalny: 25 },
  { sku: "DOM-WYL-IR", nazwa: "Włącznik bezdotykowy podczerwień", producent: "Domino", kategoria: "oswietlenie", jednostka: "szt", cena: 44.0, stanSystemowy: 52, rezerwacje: 4, stanMinimalny: 20 },
  { sku: "WIR-PROF-NAW", nazwa: "Profil aluminiowy nawierzchniowy 2 m", producent: "Wireli", kategoria: "oswietlenie", jednostka: "szt", cena: 26.0, stanSystemowy: 120, rezerwacje: 30, stanMinimalny: 40 },

  // ── złączki i wkręty ──
  { sku: "WKR-KONF-6350", nazwa: "Konfirmat 6,3 x 50 mm, opak. 200 szt.", producent: "Kash", kategoria: "zlaczki", jednostka: "opak", cena: 42.0, stanSystemowy: 74, rezerwacje: 12, stanMinimalny: 25 },
  { sku: "WKR-4x30-OP", nazwa: "Wkręt do płyty 4 x 30 mm, opak. 500 szt.", producent: "Kash", kategoria: "zlaczki", jednostka: "opak", cena: 38.0, stanSystemowy: 96, rezerwacje: 18, stanMinimalny: 30 },
  { sku: "BIT-T20-10", nazwa: "Bit Torx T20, komplet 10 szt.", producent: "Kash", kategoria: "zlaczki", jednostka: "kpl", cena: 24.0, stanSystemowy: 40, rezerwacje: 3, stanMinimalny: 15 },
  { sku: "ZLA-MIMOS-15", nazwa: "Złącze mimośrodowe 15 mm, opak. 100 szt.", producent: "Amix", kategoria: "zlaczki", jednostka: "opak", cena: 56.0, stanSystemowy: 30, rezerwacje: 9, stanMinimalny: 12 },

  // ── kleje i chemia ──
  { sku: "CHE-KLEJ-D3", nazwa: "Klej montażowy D3, 750 g", producent: "Bosetti Marella", kategoria: "chemia", jednostka: "szt", cena: 28.0, stanSystemowy: 62, rezerwacje: 7, stanMinimalny: 20 },
  { sku: "CHE-SIL-NEU", nazwa: "Silikon neutralny bezbarwny 300 ml", producent: "Bosetti Marella", kategoria: "chemia", jednostka: "szt", cena: 22.0, stanSystemowy: 84, rezerwacje: 11, stanMinimalny: 25 },
  { sku: "CHE-AKR-BIA", nazwa: "Akryl malarski biały 300 ml", producent: "Bosetti Marella", kategoria: "chemia", jednostka: "szt", cena: 14.0, stanSystemowy: 58, rezerwacje: 6, stanMinimalny: 20 },
  { sku: "CHE-WOSK-RET", nazwa: "Wosk retuszowy, zestaw 10 kolorów", producent: "Amix", kategoria: "chemia", jednostka: "kpl", cena: 46.0, stanSystemowy: 16, rezerwacje: 2, stanMinimalny: 8 },

  // ── kosze i organizacja ──
  { sku: "PEK-CARGO-150", nazwa: "Kosz cargo mini Peka 150 mm", producent: "Peka", kategoria: "kosze", jednostka: "kpl", cena: 268.0, stanSystemowy: 12, rezerwacje: 4, stanMinimalny: 6 },
  { sku: "PEK-CARGO-400", nazwa: "Kosz cargo Peka 400 mm, pełny wysuw", producent: "Peka", kategoria: "kosze", jednostka: "kpl", cena: 412.0, stanSystemowy: 7, rezerwacje: 3, stanMinimalny: 5 },
  { sku: "GTV-OCIEK-600", nazwa: "Ociekarka do szafki 600 mm", producent: "GTV", kategoria: "kosze", jednostka: "kpl", cena: 64.0, stanSystemowy: 44, rezerwacje: 6, stanMinimalny: 15 },
  { sku: "AMX-KOSZ-2X18", nazwa: "Kosz na śmieci podwójny 2 x 18 l", producent: "Amix", kategoria: "kosze", jednostka: "kpl", cena: 128.0, stanSystemowy: 19, rezerwacje: 5, stanMinimalny: 8 },

  // ── uchwyty i nogi ──
  { sku: "UCH-RELING-160", nazwa: "Uchwyt reling 160 mm, stal szczotkowana", producent: "GTV", kategoria: "uchwyty", jednostka: "szt", cena: 12.5, stanSystemowy: 260, rezerwacje: 40, stanMinimalny: 80 },
  { sku: "UCH-KRAW-CZ", nazwa: "Uchwyt krawędziowy czarny mat 320 mm", producent: "Wireli", kategoria: "uchwyty", jednostka: "szt", cena: 19.0, stanSystemowy: 148, rezerwacje: 36, stanMinimalny: 50 },
  { sku: "GAL-OKR-32", nazwa: "Gałka okrągła 32 mm, mosiądz", producent: "Domino", kategoria: "uchwyty", jednostka: "szt", cena: 9.8, stanSystemowy: 90, rezerwacje: 10, stanMinimalny: 40 },
  { sku: "NOG-REG-100", nazwa: "Noga regulowana 100 mm, komplet 4 szt.", producent: "Amix", kategoria: "uchwyty", jednostka: "kpl", cena: 21.0, stanSystemowy: 76, rezerwacje: 14, stanMinimalny: 25 },
  { sku: "WIE-SZAF-800", nazwa: "Wieszak szafowy wysuwany 800 mm", producent: "GTV", kategoria: "uchwyty", jednostka: "szt", cena: 54.0, stanSystemowy: 22, rezerwacje: 3, stanMinimalny: 10 },

  // ── szkło i lustra ──
  { sku: "SZK-LAC-4", nazwa: "Szkło lakobel czarne 4 mm", producent: "Rehau", kategoria: "szklo", jednostka: "m2", cena: 186.0, stanSystemowy: 24, rezerwacje: 6, stanMinimalny: 8 },
  { sku: "LUS-SREB-4", nazwa: "Lustro srebrne 4 mm", producent: "Rehau", kategoria: "szklo", jednostka: "m2", cena: 142.0, stanSystemowy: 31, rezerwacje: 4, stanMinimalny: 10 },
  { sku: "RAM-ALU-SZK", nazwa: "Ramka aluminiowa do frontu ze szkłem", producent: "Sta-Put", kategoria: "szklo", jednostka: "mb", cena: 48.0, stanSystemowy: 62, rezerwacje: 18, stanMinimalny: 20 },

  // ── obrzeża ──
  { sku: "OB-ABS-22x1", nazwa: "Obrzeże ABS 22 x 1 mm, dobierane do dekoru", producent: "Hranipex", kategoria: "obrzeza", jednostka: "mb", cena: 2.4, stanSystemowy: 1840, rezerwacje: 420, stanMinimalny: 600 },
  { sku: "OB-ABS-22x2", nazwa: "Obrzeże ABS 22 x 2 mm", producent: "Hranipex", kategoria: "obrzeza", jednostka: "mb", cena: 3.6, stanSystemowy: 148, rezerwacje: 96, stanMinimalny: 200 },
  { sku: "OB-DUO-SZK", nazwa: "Obrzeże DUO imitujące szkło", producent: "Hranipex", kategoria: "obrzeza", jednostka: "mb", cena: 6.8, stanSystemowy: 92, rezerwacje: 12, stanMinimalny: 40 },

  // ── scraped from website ──
  { sku: "SCR-UCH-1", nazwa: "Uchwyty meblowe", producent: "Mussi", kategoria: "uchwyty", jednostka: "szt", cena: 10.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://dominobrass.com.au/wp-content/uploads/photos/L112+R02-P.jpg" },
  { sku: "SCR-GAL-2", nazwa: "Gałki meblowe", producent: "Mussi", kategoria: "uchwyty", jednostka: "szt", cena: 8.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://dominobrass.com.au/wp-content/uploads/photos/L112+R02-B.jpg" },
  { sku: "SCR-NOG-3", nazwa: "Nogi meblowe", producent: "Mussi", kategoria: "uchwyty", jednostka: "szt", cena: 25.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://www.hafele.si/prod-live/static/WFS/Haefele-HAD-Site/-/Haefele/en_SI/pim/images/default/ppic-00604356.jpg" },
  { sku: "SCR-WIE-5", nazwa: "Wieszaki małe", producent: "Mussi", kategoria: "uchwyty", jednostka: "szt", cena: 12.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://amix.pl/img/logo-1767875590.jpg" },
  { sku: "SCR-SZU-7", nazwa: "Szuflady z cichym domykiem", producent: "Mussi", kategoria: "szuflady", jednostka: "kpl", cena: 45.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://cdn.globalso.com/junbond/gp2.png" },
  { sku: "SCR-CAR-8", nazwa: "Cargo", producent: "Mussi", kategoria: "kosze", jednostka: "kpl", cena: 150.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://manuals.plus/wp-content/uploads/2022/11/00-55-1568x1078.png" },
  { sku: "SCR-WKR-1", nazwa: "Wkręty", producent: "Mussi", kategoria: "zlaczki", jednostka: "opak", cena: 15.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://image.bjjsgy.com/a0/a8/3f8ef5f294cd/product/205197849_s-w400xh400.jpg" },
  { sku: "SCR-OSW-3", nazwa: "Oświetlenie", producent: "Mussi", kategoria: "oswietlenie", jednostka: "szt", cena: 30.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://frankolsenfurniture.com.au/wp-content/uploads/2024/10/FO35-602A-CONSOLE-TABLE-M-ISO-DETAIL.jpg" },
  { sku: "SCR-RAM-5", nazwa: "Ramki aluminiowe", producent: "Mussi", kategoria: "szklo", jednostka: "mb", cena: 40.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://www.hafele.si/prod-live/static/WFS/Haefele-HAD-Site/-/Haefele/en_SI/pim/images/default/ppic-00604356.jpg" },
  { sku: "SCR-POJ-8", nazwa: "Pojemniki na odpady", producent: "Mussi", kategoria: "kosze", jednostka: "kpl", cena: 60.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://images.lasoo.com.au/assets/product/1511433/R00bwaalIPUyoxlKhsNL7mVSA.jpg.e2ceeb3f081f1b72e437a629ac1dee4c.webp" },
  { sku: "SCR-Szk-6", nazwa: "Szkło", producent: "Mussi", kategoria: "szklo", jednostka: "m2", cena: 120.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://propertyfurniture.com/wp-content/uploads/2016/02/pixel-glass-cabinet_f.jpg" },
  { sku: "SCR-Blt-2", nazwa: "Akcesoria Blum", producent: "Blum", kategoria: "okucia", jednostka: "szt", cena: 20.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://www.blum.com/file/clp0012-ep-177_ep_dok_bau?country=sg&language=en" },
  { sku: "SCR-Klej-4", nazwa: "Kleje i rozpuszczalniki", producent: "Mussi", kategoria: "chemia", jednostka: "szt", cena: 12.0, stanSystemowy: 100, rezerwacje: 0, stanMinimalny: 20, image: "https://cdn.globalso.com/junbond/gp2.png" },
];
