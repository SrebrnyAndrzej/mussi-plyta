import { NextResponse } from "next/server";
import { kontrahentDemo } from "@/config/brief";
import type { RolaSesji } from "@/lib/sesja";
import {
  NAZWA_CIASTECZKA,
  WAZNOSC_SEKUND,
  odczytajToken,
  pobierzToken,
  utworzToken,
} from "@/lib/sesja-serwer";

/**
 * Sesja po stronie serwera.
 *
 * Logowanie jest nadal demonstracyjne: nie ma bazy użytkowników ani haseł,
 * więc przyjmujemy rolę z żądania. Zmienia się natomiast to, co najważniejsze:
 * **sesję podpisuje serwer**, a przeglądarka dostaje ciasteczko HttpOnly,
 * którego nie odczyta ani nie podrobi kod na stronie.
 *
 * Dzięki temu trasy API mogą już teraz sprawdzać uprawnienia naprawdę,
 * a podmiana logowania na prawdziwe nie zmieni niczego powyżej tej warstwy.
 */

export const dynamic = "force-dynamic";

function ciasteczko(token: string) {
  return {
    name: NAZWA_CIASTECZKA,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WAZNOSC_SEKUND,
  };
}

export async function POST(request: Request) {
  let rola: RolaSesji;
  try {
    const tresc = (await request.json()) as { rola?: string };
    if (tresc.rola !== "klient" && tresc.rola !== "hurtownia") {
      return NextResponse.json({ ok: false, blad: "Nieznana rola." }, { status: 400 });
    }
    rola = tresc.rola;
  } catch {
    return NextResponse.json({ ok: false, blad: "Treść żądania nie jest JSON-em." }, { status: 400 });
  }

  let token: string;
  try {
    /* Kontrahent tylko dla klienta. Pracownik hurtowni widzi wszystkie firmy,
       więc przypisanie go do jednej byłoby mylące. */
    token = utworzToken(rola, rola === "klient" ? kontrahentDemo.id : null);
  } catch (blad) {
    /* Brak sekretu w środowisku to błąd wdrożenia, nie żądania. */
    return NextResponse.json(
      { ok: false, blad: blad instanceof Error ? blad.message : "Nie mogę podpisać sesji." },
      { status: 503 },
    );
  }

  const odpowiedz = NextResponse.json({ ok: true, rola });
  odpowiedz.cookies.set(ciasteczko(token));
  return odpowiedz;
}

export async function GET(request: Request) {
  const token = pobierzToken(request);
  const wynik = odczytajToken(token);
  if (!wynik.ok) {
    return NextResponse.json({ zalogowany: false, powod: wynik.powod });
  }
  return NextResponse.json({
    zalogowany: true,
    rola: wynik.sesja.rola,
    kontrahent: wynik.sesja.kontrahent,
    wygasa: wynik.sesja.wygasa,
  });
}

export async function DELETE() {
  const odpowiedz = NextResponse.json({ ok: true });
  odpowiedz.cookies.set({ ...ciasteczko(""), maxAge: 0 });
  return odpowiedz;
}
