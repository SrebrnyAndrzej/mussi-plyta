import { NextResponse } from "next/server";
import { akcesoria } from "@/data/akcesoria";
import { dekory } from "@/data/dekory";
import { stanDlaDostepnosci } from "@/data/portal-demo";
import { cenniki, cenyIndywidualne, kontrahenci } from "@/data/warunki-demo";
import { zespolDemo } from "@/data/zespol-demo";
import type { KategoriaPozycji } from "@/lib/fakturowanie";
import { wczytajKlucze, zweryfikujKlucz } from "@/lib/klucze-api";
import { dostepnoscAkcesorium } from "@/lib/sklep-akcesoriow";
import { obowiazujacyCennik } from "@/lib/warunki";
import {
  parsujCsvZamowienia,
  zweryfikujWobecKatalogu,
  type PozycjaKatalogu,
} from "@/lib/zamowienie-csv";
import { zlozZamowienie, type PozycjaDoZlozenia } from "@/lib/zlozenie";

/**
 * Złożenie zamówienia plikiem CSV z aplikacji kontrahenta.
 *
 * Plik przechodzi przez ten sam silnik, co koszyk w portalu: wycena według
 * warunków firmy, sprawdzenie pokrycia w magazynie, limit akceptacji osoby
 * składającej, rezerwacja i potwierdzenie. Nie ma tu osobnej ścieżki dla
 * integracji, bo dwie ścieżki prędzej czy później zaczęłyby się różnić.
 *
 * Zasada całości albo nic: jeden błędny wiersz odrzuca cały plik. Zamówienie
 * złożone w połowie jest gorsze niż nieprzyjęte, bo nikt nie wie, co zostało
 * kupione.
 *
 * Uwaga, czego to jeszcze nie robi: **nie zapisuje zamówienia na stałe**.
 * Portal nie ma bazy. Trasa liczy wszystko naprawdę i zwraca komplet
 * dokumentów, ale po restarcie nie zostaje ślad. Odpowiedź mówi o tym
 * wprost polem `zapisane`, żeby aplikacja kontrahenta nie uznała
 * zamówienia za przyjęte do realizacji.
 */

export const dynamic = "force-dynamic";

/** Zamówienie z tysiąca pozycji to pomyłka, nie zamówienie. */
const MAKS_BAJTOW = 1_000_000;

function odmowaKlucza() {
  return NextResponse.json(
    { ok: false, blad: "Brak ważnego klucza API." },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="mussi"' } },
  );
}

function kategoriaPozycji(rodzaj: "plyta" | "akcesorium", kategoria: string): KategoriaPozycji {
  if (kategoria === "obrzeza" || kategoria === "obrzeze") return "obrzeza";
  return rodzaj === "akcesorium" ? "akcesoria" : "materialy";
}

export async function POST(request: Request) {
  let klucze;
  try {
    klucze = wczytajKlucze();
  } catch (blad) {
    return NextResponse.json(
      { ok: false, blad: blad instanceof Error ? blad.message : "Zła konfiguracja kluczy." },
      { status: 503 },
    );
  }

  const straz = zweryfikujKlucz(request.headers.get("authorization"), klucze, "zamowienia");
  if (!straz.ok) {
    console.warn(`[api/v1/zamowienia] odmowa: ${straz.powod}`);
    return odmowaKlucza();
  }

  const kontrahent = kontrahenci.find((k) => k.id === straz.klucz.kontrahent);
  if (!kontrahent) {
    return NextResponse.json(
      { ok: false, blad: "Klucz wskazuje firmę spoza kartoteki." },
      { status: 409 },
    );
  }

  /* Integracja działa w imieniu wskazanej osoby, więc limity akceptacji
     obowiązują ją tak samo jak zamówienie złożone ręcznie. */
  const skladajacy =
    zespolDemo.find((c) => c.id === straz.klucz.skladajacy) ??
    zespolDemo.find((c) => c.limitAkceptacji === null && c.aktywny) ??
    zespolDemo[0];

  const tekst = await request.text();
  if (Buffer.byteLength(tekst, "utf8") > MAKS_BAJTOW) {
    return NextResponse.json(
      { ok: false, blad: `Plik przekracza ${MAKS_BAJTOW} bajtów.` },
      { status: 413 },
    );
  }

  const wynik = parsujCsvZamowienia(tekst);

  /* Asortyment z indeksami takimi, jakie widzi klient w `/api/v1/cennik`. */
  const katalog: PozycjaKatalogu[] = [
    ...dekory.map((d) => ({ indeks: d.kod, jednostka: d.jednostka })),
    ...akcesoria.map((a) => ({ indeks: a.sku, jednostka: a.jednostka })),
  ];
  const bledyKatalogu = wynik.ok ? zweryfikujWobecKatalogu(wynik.pozycje, katalog) : [];
  const bledy = [...wynik.bledy, ...bledyKatalogu];

  if (bledy.length) {
    return NextResponse.json(
      {
        ok: false,
        etap: "plik",
        blad: "Plik nie został przyjęty. Żaden indeks nie został zamówiony.",
        bledy,
      },
      { status: 422 },
    );
  }

  const pozycje: PozycjaDoZlozenia[] = wynik.pozycje.map((p) => {
    const plyta = dekory.find((d) => d.kod === p.indeks);
    if (plyta) {
      return {
        id: plyta.id,
        sku: plyta.kod,
        nazwa: plyta.nazwa,
        ilosc: p.ilosc,
        jednostka: plyta.jednostka,
        cenaKatalogowa: plyta.cenaKatalogowa,
        kategoria: kategoriaPozycji("plyta", plyta.kategoria),
      };
    }
    const a = akcesoria.find((x) => x.sku === p.indeks)!;
    return {
      id: a.sku,
      sku: a.sku,
      nazwa: a.nazwa,
      ilosc: p.ilosc,
      jednostka: a.jednostka,
      cenaKatalogowa: a.cena,
      kategoria: kategoriaPozycji("akcesorium", a.kategoria),
    };
  });

  const stany: Record<string, number> = {};
  for (const p of wynik.pozycje) {
    const plyta = dekory.find((d) => d.kod === p.indeks);
    /* Płyty mają w danych zalążkowych samą etykietę dostępności,
       akcesoria prawdziwy stan i rezerwacje. */
    stany[p.indeks] = plyta
      ? stanDlaDostepnosci(plyta.dostepnosc)
      : stanDlaDostepnosci(dostepnoscAkcesorium(akcesoria.find((x) => x.sku === p.indeks)!));
  }

  const naDzis = obowiazujacyCennik(cenniki, new Date());
  const zlozenie = zlozZamowienie({
    zamowienie: `M-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    kontrahent,
    skladajacy,
    zespol: zespolDemo,
    pozycje,
    stany,
    rezerwacje: [],
    /* Ta sama zasada, co w koszyku: podstawą są ceny z kart produktów,
       nadpisuje je cennik obowiązujący na dziś. */
    cenniki: [
      {
        id: naDzis?.id ?? "katalogowy",
        nazwa: naDzis?.nazwa ?? "Ceny katalogowe",
        obowiazujeOd: "1970-01-01",
        obowiazujeDo: null,
        ceny: {
          ...Object.fromEntries(pozycje.map((p) => [p.sku, p.cenaKatalogowa])),
          ...(naDzis?.ceny ?? {}),
        },
      },
    ],
    indywidualne: cenyIndywidualne,
  });

  if (!zlozenie.ok) {
    return NextResponse.json(
      { ok: false, etap: zlozenie.etap, blad: zlozenie.blad, braki: zlozenie.braki },
      { status: 409 },
    );
  }

  const probny = new URL(request.url).searchParams.get("probny") === "1";

  return NextResponse.json(
    {
      ok: true,
      wersja: 1,
      /* Bieg próbny liczy wszystko tak samo, ale jest wprost oznaczony,
         żeby aplikacja mogła sprawdzić plik przed wysłaniem na serio. */
      probny,
      /* Portal nie ma jeszcze bazy. Dopóki to pole jest fałszem,
         zamówienie nie trafia do realizacji. */
      zapisane: false,
      zamowienie: zlozenie.zamowienie,
      potwierdzenie: zlozenie.potwierdzenie,
      pozycje: zlozenie.pozycje,
      netto: zlozenie.netto,
      vat: zlozenie.vat,
      brutto: zlozenie.brutto,
      termin: zlozenie.termin.toISOString(),
      wymagaAkceptacji: zlozenie.wymagaAkceptacji,
      akceptujacy: zlozenie.akceptujacy.map((c) => ({ id: c.id, imie: c.imie })),
      /* Indeksy powtórzone w pliku i zsumowane. Aplikacja ma to zobaczyć,
         bo zwykle oznacza błąd w tym, co ją wygenerowało. */
      scalone: wynik.scalone,
      komunikat: zlozenie.komunikat,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
