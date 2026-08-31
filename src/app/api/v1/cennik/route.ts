import { NextResponse } from "next/server";
import { akcesoria } from "@/data/akcesoria";
import { dekory } from "@/data/dekory";
import { cenniki, cenyIndywidualne, kontrahenci } from "@/data/warunki-demo";
import { cennikDlaKontrahenta } from "@/lib/api-cennik";
import { wczytajKlucze, zweryfikujKlucz } from "@/lib/klucze-api";

/**
 * Cennik kontrahenta dla aplikacji zewnętrznej.
 *
 * Pierwsza trasa API przeznaczona dla cudzego oprogramowania, a nie dla
 * naszej przeglądarki. Stąd klucz w nagłówku zamiast sesji w ciasteczku
 * i wersja w adresie: `/api/v1/`. Kontrahenci wpięci w to API nie mogą
 * stracić dostępu przez zmianę, którą wprowadzimy u siebie.
 *
 * Firmę bierzemy z klucza, nigdy z parametru żądania. Parametr dałoby się
 * podmienić i zobaczyć cudze rabaty.
 *
 * Stan magazynu wychodzi jako etykieta dostępności, bez liczb.
 */

export const dynamic = "force-dynamic";

/** Jedna odpowiedź na każdą odmowę uwierzytelnienia. */
function odmowa() {
  return NextResponse.json(
    { ok: false, blad: "Brak ważnego klucza API." },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="mussi"' } },
  );
}

export async function GET(request: Request) {
  let klucze;
  try {
    klucze = wczytajKlucze();
  } catch (blad) {
    /* Zepsuta konfiguracja to błąd wdrożenia, nie żądania. Mówimy o tym
       wprost, zamiast udawać, że klucz klienta jest zły. */
    return NextResponse.json(
      { ok: false, blad: blad instanceof Error ? blad.message : "Zła konfiguracja kluczy." },
      { status: 503 },
    );
  }

  const wynik = zweryfikujKlucz(request.headers.get("authorization"), klucze, "cennik");
  if (!wynik.ok) {
    /* Powód zostaje w logach serwera. Klientowi mówimy tylko tyle,
       żeby nie dało się po odpowiedziach zgadywać istniejących kluczy. */
    console.warn(`[api/v1/cennik] odmowa: ${wynik.powod}`);
    return odmowa();
  }

  const kontrahent = kontrahenci.find((k) => k.id === wynik.klucz.kontrahent);
  if (!kontrahent) {
    return NextResponse.json(
      { ok: false, blad: "Klucz wskazuje firmę spoza kartoteki." },
      { status: 409 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rodzaj = searchParams.get("rodzaj");
  if (rodzaj && rodzaj !== "plyta" && rodzaj !== "akcesorium") {
    return NextResponse.json(
      { ok: false, blad: "Parametr rodzaj przyjmuje wartości plyta albo akcesorium." },
      { status: 400 },
    );
  }

  const { cennikHandlowy, pozycje } = cennikDlaKontrahenta(kontrahent, {
    plyty: dekory,
    akcesoria,
    cenniki,
    indywidualne: cenyIndywidualne,
  });

  return NextResponse.json(
    {
      ok: true,
      wersja: 1,
      wygenerowano: new Date().toISOString(),
      kontrahent: {
        id: kontrahent.id,
        nazwa: kontrahent.nazwa,
        kodProgu: kontrahent.kodProgu,
        status: kontrahent.status,
      },
      /* Null znaczy, że żaden cennik handlowy nie obowiązuje na dziś
         i ceny pochodzą z kart produktów. Klient ma to widzieć. */
      cennikHandlowy,
      waluta: "PLN",
      ceny: "netto",
      pozycje: rodzaj ? pozycje.filter((p) => p.rodzaj === rodzaj) : pozycje,
    },
    /* Ceny są danymi jednej firmy, więc nie wolno ich trzymać
       w żadnej pamięci podręcznej po drodze. */
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
