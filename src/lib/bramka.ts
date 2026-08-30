import { notFound } from "next/navigation";
import { funkcje } from "@/config/brief";

/**
 * Bramka trasy oparta o flagę funkcji.
 *
 * Flaga, która niczego nie blokuje, jest gorsza niż jej brak, bo daje
 * złudzenie kontroli. Każda trasa objęta flagą przechodzi przez tę bramkę,
 * więc wyłączenie modułu w `brief.ts` naprawdę go odcina.
 */
export function bramka(wlaczona: boolean): void {
  if (!wlaczona) notFound();
}

/** Skrót dla layoutów: zwraca komponent bramkujący dzieci. */
export function osloniete(wlaczona: boolean, dzieci: React.ReactNode) {
  bramka(wlaczona);
  return dzieci;
}

export { funkcje };
