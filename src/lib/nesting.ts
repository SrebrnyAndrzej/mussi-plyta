import { rozkroj } from "@/config/brief";

export type Formatka = {
  /** Długość w mm, wzdłuż tej krawędzi biegną słoje, jeśli sloje === true. */
  dlugosc: number;
  /** Szerokość w mm. */
  szerokosc: number;
  /** Obrzeże na czterech krawędziach w kolejności: góra, dół, lewa, prawa. Wartość w mm. */
  obrzeze: [number, number, number, number];
  sztuk: number;
  /** Czy kierunek słojów jest wymuszony. Jeśli tak, formatki nie wolno obrócić. */
  sloje: boolean;
  dekor?: string;
};

export type UlozonaSztuka = {
  x: number;
  y: number;
  dlugosc: number;
  szerokosc: number;
  /** Czy sztuka została obrócona o 90 stopni względem wejścia. */
  obrocona: boolean;
  zrodlo: number;
};

export type Arkusz = {
  sztuki: UlozonaSztuka[];
  /** Udział powierzchni wykorzystanej, od 0 do 1. */
  wykorzystanie: number;
};

export type WynikRozkroju = {
  arkusze: Arkusz[];
  /** Łączna liczba arkuszy do zamówienia. */
  arkuszy: number;
  /** Powierzchnia netto wszystkich formatek w m². */
  powierzchniaM2: number;
  /** Metry bieżące obrzeża do oklejenia. */
  obrzezeMb: number;
  /** Średnie wykorzystanie materiału, od 0 do 1. */
  wykorzystanie: number;
  /** Formatki, które nie mieszczą się na arkuszu. */
  odrzucone: Formatka[];
};

type Polka = { y: number; wysokosc: number; kursor: number };

/**
 * Rozkrój półkowy (shelf packing) z rzazem piły.
 *
 * Świadomie NIE jest to optymalizator gilotynowy klasy przemysłowej.
 * Daje wynik zbieżny z realnym rozkrojem w granicach kilku procent,
 * liczy się w milisekundach i jest deterministyczny, więc nadaje się
 * do wyceny na żywo w przeglądarce. Docelowo można podmienić na
 * solver po stronie serwera bez zmiany tego interfejsu.
 */
export function policzRozkroj(formatki: Formatka[]): WynikRozkroju {
  const { plyta, rzaz, minFormatka } = rozkroj;

  const odrzucone: Formatka[] = [];
  const sztuki: Array<{ d: number; s: number; sloje: boolean; zrodlo: number }> = [];

  formatki.forEach((f, i) => {
    // Formatka mieści się, jeśli wchodzi w arkusz w którejkolwiek orientacji.
    // Przy wymuszonych słojach wolno sprawdzić tylko orientację zadaną,
    // bo obracanie zmieniłoby kierunek usłojenia.
    const wchodziWprost = f.dlugosc <= plyta.szerokosc && f.szerokosc <= plyta.wysokosc;
    const wchodziObrocona = f.szerokosc <= plyta.szerokosc && f.dlugosc <= plyta.wysokosc;
    const zaDuza = f.sloje ? !wchodziWprost : !(wchodziWprost || wchodziObrocona);

    // Okleiniarka ma dolny limit na obu bokach: krótszy nie mniej niż 70 mm,
    // dłuższy nie mniej niż 150 mm. Wcześniej sprawdzany był tylko krótszy bok.
    const krotszy = Math.min(f.dlugosc, f.szerokosc);
    const dluzszy = Math.max(f.dlugosc, f.szerokosc);
    const zaMala = krotszy < minFormatka.szerokosc || dluzszy < minFormatka.wysokosc;
    if (zaDuza || zaMala || f.sztuk < 1) {
      odrzucone.push(f);
      return;
    }
    for (let n = 0; n < f.sztuk; n++) {
      sztuki.push({ d: f.dlugosc, s: f.szerokosc, sloje: f.sloje, zrodlo: i });
    }
  });

  // Najwyższe najpierw. Przy równej wysokości szersze najpierw.
  const kolejka = sztuki
    .map((s) => {
      // Bez wymuszonych słojów kładziemy sztukę dłuższym bokiem w poziom,
      // co daje niższe półki i mniej odpadu.
      if (!s.sloje && s.s > s.d) {
        return { ...s, d: s.s, s: s.d, obrocona: true };
      }
      return { ...s, obrocona: false };
    })
    .sort((a, b) => b.s - a.s || b.d - a.d);

  const arkusze: Array<{ polki: Polka[]; sztuki: UlozonaSztuka[] }> = [
    { polki: [], sztuki: [] },
  ];

  for (const sz of kolejka) {
    let ulozona = false;

    for (const ark of arkusze) {
      for (const polka of ark.polki) {
        if (sz.s <= polka.wysokosc && polka.kursor + sz.d <= plyta.szerokosc) {
          ark.sztuki.push({
            x: polka.kursor,
            y: polka.y,
            dlugosc: sz.d,
            szerokosc: sz.s,
            obrocona: sz.obrocona,
            zrodlo: sz.zrodlo,
          });
          polka.kursor += sz.d + rzaz;
          ulozona = true;
          break;
        }
      }
      if (ulozona) break;

      const ostatnia = ark.polki[ark.polki.length - 1];
      const gora = ostatnia ? ostatnia.y + ostatnia.wysokosc + rzaz : 0;
      if (gora + sz.s <= plyta.wysokosc && sz.d <= plyta.szerokosc) {
        ark.polki.push({ y: gora, wysokosc: sz.s, kursor: sz.d + rzaz });
        ark.sztuki.push({
          x: 0,
          y: gora,
          dlugosc: sz.d,
          szerokosc: sz.s,
          obrocona: sz.obrocona,
          zrodlo: sz.zrodlo,
        });
        ulozona = true;
        break;
      }
    }

    if (!ulozona) {
      arkusze.push({
        polki: [{ y: 0, wysokosc: sz.s, kursor: sz.d + rzaz }],
        sztuki: [
          {
            x: 0,
            y: 0,
            dlugosc: sz.d,
            szerokosc: sz.s,
            obrocona: sz.obrocona,
            zrodlo: sz.zrodlo,
          },
        ],
      });
    }
  }

  const polePlyty = plyta.szerokosc * plyta.wysokosc;
  const gotowe: Arkusz[] = arkusze
    .filter((a) => a.sztuki.length > 0)
    .map((a) => ({
      sztuki: a.sztuki,
      wykorzystanie:
        a.sztuki.reduce((s, p) => s + p.dlugosc * p.szerokosc, 0) / polePlyty,
    }));

  const powierzchniaMm2 = gotowe.reduce(
    (sum, a) => sum + a.sztuki.reduce((s, p) => s + p.dlugosc * p.szerokosc, 0),
    0,
  );

  return {
    arkusze: gotowe,
    arkuszy: gotowe.length,
    powierzchniaM2: powierzchniaMm2 / 1_000_000,
    obrzezeMb: policzObrzeze(formatki),
    wykorzystanie: gotowe.length ? powierzchniaMm2 / (gotowe.length * polePlyty) : 0,
    odrzucone,
  };
}

/** Metry bieżące obrzeża. Kolejność krawędzi: góra, dół, lewa, prawa. */
export function policzObrzeze(formatki: Formatka[]): number {
  return formatki.reduce((sum, f) => {
    const [gora, dol, lewa, prawa] = f.obrzeze;
    const mm =
      (gora > 0 ? f.dlugosc : 0) +
      (dol > 0 ? f.dlugosc : 0) +
      (lewa > 0 ? f.szerokosc : 0) +
      (prawa > 0 ? f.szerokosc : 0);
    return sum + (mm * f.sztuk) / 1000;
  }, 0);
}

/** Zapis obrzeża w notacji, której hurtownia używa dzisiaj na druku: np. "1-1-1-0". */
export function zapisObrzeza(obrzeze: Formatka["obrzeze"]): string {
  return obrzeze.join("-");
}
