/**
 * Dzień kalendarzowy hurtowni.
 *
 * Wszystkie terminy w portalu są dniami, nie chwilami: cennik obowiązuje od
 * pierwszego września, promocja kończy się trzydziestego, klucz API jest ważny
 * do końca roku. Taki dzień trzeba liczyć w strefie hurtowni.
 *
 * `toISOString()` podaje dzień w UTC. Polska jest godzinę przed UTC zimą
 * i dwie latem, więc między północą a pierwszą lub drugą w nocy UTC pokazuje
 * jeszcze wczoraj. Cennik wchodziłby wtedy w życie z opóźnieniem, a promocja
 * żyłaby o dwie godziny za długo. Nikt by tego nie zauważył poza klientem,
 * który akurat składa zamówienie po północy.
 */

export const STREFA_HURTOWNI = "Europe/Warsaw";

/* Szwedzki format daty to dokładnie RRRR-MM-DD, więc nie musimy sklejać
   dnia z kawałków ani zgadywać kolejności pól. */
const FORMAT_DNIA = new Intl.DateTimeFormat("sv-SE", { timeZone: STREFA_HURTOWNI });

/** Dzień w formacie RRRR-MM-DD, liczony w strefie hurtowni. */
export function dzienHurtowni(chwila: Date = new Date()): string {
  return FORMAT_DNIA.format(chwila);
}

/**
 * Różnica w dniach kalendarzowych, a nie w dobach.
 *
 * Od wtorku 23:00 do środy 01:00 są dwie godziny, ale to już następny dzień.
 * Liczenie po milisekundach dałoby tu zero i „ostatni dzień oferty” nigdy
 * by się nie pokazał.
 */
export function dniMiedzy(od: string, do_: string): number {
  const a = Date.UTC(
    Number(od.slice(0, 4)),
    Number(od.slice(5, 7)) - 1,
    Number(od.slice(8, 10)),
  );
  const b = Date.UTC(
    Number(do_.slice(0, 4)),
    Number(do_.slice(5, 7)) - 1,
    Number(do_.slice(8, 10)),
  );
  return Math.round((b - a) / 86_400_000);
}
