import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { akcesoria } from "@/data/akcesoria";
import {
  podsumujPrzyjecie,
  przyjmijStany,
  type PaczkaStanow,
} from "@/lib/stany-przyjecie";

/**
 * Punkt odbioru stanów magazynowych z integratora.
 *
 * Integrator działa w sieci hurtowni, czyta bazę systemu sprzedażowego
 * i wypycha tutaj paczkę. Ruch idzie tylko w jedną stronę, wychodzącym
 * połączeniem od nich, więc baza ERP nie musi być wystawiona na świat.
 *
 * Uwaga, czego to jeszcze nie robi: **nie zapisuje zmian na stałe**.
 * Portal nie ma bazy, stany żyją w danych zalążkowych. Trasa sprawdza paczkę
 * i zwraca, co by się zmieniło. To wystarcza, żeby uruchomić i przetestować
 * integrator u klienta, zanim wejdzie baza.
 */

export const dynamic = "force-dynamic";

/* Zwykłe `===` przerywa na pierwszej różnej literze, więc z czasu odpowiedzi
   da się token odgadywać znak po znaku. Porównujemy stałoczasowo. */
function rowneStaloczasowo(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function odmowa(status: number, blad: string, dodatkowe: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, blad, ...dodatkowe }, { status });
}

export async function POST(request: Request) {
  const oczekiwany = process.env.INTEGRATOR_TOKEN;
  if (!oczekiwany) {
    /* Brak tokenu w środowisku to błąd wdrożenia, nie żądania.
       Lepiej odmówić wszystkiego niż przyjmować bez sprawdzenia. */
    return odmowa(503, "Punkt odbioru nie ma skonfigurowanego tokenu.");
  }

  const podany = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!podany || !rowneStaloczasowo(podany, oczekiwany)) {
    return odmowa(401, "Brak poprawnego tokenu integratora.");
  }

  let paczka: PaczkaStanow;
  try {
    paczka = (await request.json()) as PaczkaStanow;
  } catch {
    return odmowa(400, "Treść żądania nie jest poprawnym JSON-em.");
  }

  const obecne = akcesoria.map((a) => ({
    sku: a.sku,
    stanSystemowy: a.stanSystemowy,
    rezerwacje: a.rezerwacje,
  }));

  const wynik = przyjmijStany(paczka, obecne);

  if (!wynik.ok) {
    /* 409, a nie 400: paczka bywa poprawna składniowo, ale niewiarygodna,
       na przykład obcięta. Integrator ma to odróżnić od błędu formatu. */
    return odmowa(409, wynik.blad, { odrzucone: wynik.odrzucone });
  }

  return NextResponse.json({
    ok: true,
    partia: paczka.partia,
    /* Zapis wejdzie razem z bazą. Do tego czasu mówimy wprost, że to podgląd. */
    zastosowano: false,
    podsumowanie: podsumujPrzyjecie(wynik),
    zmiany: wynik.zmiany,
    odrzucone: wynik.odrzucone,
    nieznane: wynik.nieznane,
  });
}
