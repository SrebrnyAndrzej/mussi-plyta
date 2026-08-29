import { wycenUslugi, zloty, liczba } from "@/lib/pricing";
import { katalog } from "@/lib/repo";
import { firma, rozkroj } from "@/config/brief";
import type { Formatka } from "@/lib/nesting";

/**
 * Strona kontrolna zalążka silnika.
 * Warstwa wizualna jest zadaniem Codexa. To ma tylko dowodzić,
 * że rozkrój i wycena liczą się po stronie serwera na prawdziwych danych.
 */
const przykladowaKuchnia: Formatka[] = [
  { dlugosc: 720, szerokosc: 560, obrzeze: [1, 1, 1, 0], sztuk: 8, sloje: true },
  { dlugosc: 564, szerokosc: 500, obrzeze: [1, 0, 0, 0], sztuk: 6, sloje: false },
  { dlugosc: 600, szerokosc: 560, obrzeze: [2, 2, 2, 2], sztuk: 4, sloje: false },
];

export default async function Home() {
  const wycena = wycenUslugi(przykladowaKuchnia, 18);
  const dekory = await katalog.wszystkie();
  const { plyta } = rozkroj;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-ink">
        Zalążek silnika
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink">
        {firma.nazwa}, portal B2B
      </h1>
      <p className="mt-3 max-w-prose text-mute">
        Warstwa wizualna powstaje osobno. Poniżej wynik rozkroju i wyceny
        policzony na serwerze, na cenniku z <code className="font-mono">src/config/brief.ts</code>.
      </p>

      <dl className="mt-10 grid gap-px overflow-hidden rounded-core bg-hair text-sm sm:grid-cols-2">
        {[
          ["Arkusz", `${plyta.szerokosc} × ${plyta.wysokosc} mm`],
          ["Formatek w liście", String(przykladowaKuchnia.reduce((s, f) => s + f.sztuk, 0))],
          ["Arkuszy do zamówienia", String(wycena.arkuszy)],
          ["Wykorzystanie materiału", `${liczba.format(wycena.rozkroj.wykorzystanie * 100)}%`],
          ["Obrzeże", `${liczba.format(wycena.obrzezeMb)} mb`],
          ["Cięcie", zloty.format(wycena.kosztCiecia)],
          ["Oklejanie", zloty.format(wycena.kosztOklejania)],
          ["Usługi netto", zloty.format(wycena.razemNetto)],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface px-4 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-mute">{k}</dt>
            <dd className="mt-1 font-mono tabular-nums text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-8 text-sm text-mute">
        Katalog zalążkowy: <strong className="text-ink">{dekory.length}</strong> pozycji.
      </p>
    </main>
  );
}
