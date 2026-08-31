import { NextResponse } from "next/server";
import { cenniki, cenyIndywidualne, kontrahenci } from "@/data/warunki-demo";
import { pobierzToken, wymagajSesji } from "@/lib/sesja-serwer";
import { dostepnyLimit, doWyzszegoProgu, obowiazujacyCennik } from "@/lib/warunki";

/**
 * Warunki handlowe kontrahenta, operacja `pullCustomerTerms` z kontraktu
 * integracji.
 *
 * Pierwsza trasa, która realnie sprawdza uprawnienia po stronie serwera.
 * Wzorzec dla pozostałych: straż na wejściu, zakres danych wynikający z roli,
 * a nie z tego, o co poprosił klient.
 *
 * Kontrahent widzi wyłącznie swoje warunki. Pracownik hurtowni widzi wszystkie,
 * bo to jego praca. Identyfikator firmy bierzemy z podpisanej sesji, nie
 * z parametru żądania: inaczej wystarczyłoby podmienić parametr, żeby
 * zobaczyć cudze rabaty.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const straz = wymagajSesji(pobierzToken(request));
  if (!straz.ok) {
    return NextResponse.json({ ok: false, blad: straz.blad }, { status: straz.status });
  }

  const { sesja } = straz;
  const dzis = new Date();
  const cennik = obowiazujacyCennik(cenniki, dzis);

  if (sesja.rola === "hurtownia") {
    return NextResponse.json({
      ok: true,
      zakres: "wszyscy",
      cennik: cennik ? { id: cennik.id, nazwa: cennik.nazwa } : null,
      kontrahenci: kontrahenci.map((k) => ({
        id: k.id,
        nazwa: k.nazwa,
        kodProgu: k.kodProgu,
        formaPlatnosci: k.formaPlatnosci,
        limitPrzyznany: k.limitPrzyznany,
        limitDostepny: dostepnyLimit(k),
        status: k.status,
      })),
    });
  }

  const moj = kontrahenci.find((k) => k.id === sesja.kontrahent);
  if (!moj) {
    /* Sesja wskazuje firmę, której nie ma w kartotece. To błąd danych,
       nie żądania, więc mówimy o tym wprost zamiast zwracać pustkę. */
    return NextResponse.json(
      { ok: false, blad: "Sesja wskazuje kontrahenta spoza kartoteki." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    zakres: "wlasny",
    cennik: cennik ? { id: cennik.id, nazwa: cennik.nazwa } : null,
    kontrahent: {
      id: moj.id,
      nazwa: moj.nazwa,
      kodProgu: moj.kodProgu,
      formaPlatnosci: moj.formaPlatnosci,
      limitPrzyznany: moj.limitPrzyznany,
      limitDostepny: dostepnyLimit(moj),
      status: moj.status,
      doWyzszegoProgu: doWyzszegoProgu(moj.obrotRoczny),
    },
    /* Ceny indywidualne to dane handlowe jednej firmy, więc filtrujemy
       je sesją, a nie zaufaniem do klienta. */
    cenyIndywidualne: cenyIndywidualne.filter((c) => c.kontrahent === moj.id),
  });
}
