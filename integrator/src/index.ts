import { wczytajKonfiguracje } from "./konfiguracja.ts";
import { pobierzPaczke, type Paczka } from "./zrodlo.ts";

/**
 * Integrator stanów magazynowych.
 *
 * Uruchamiany na serwerze hurtowni, w tej samej sieci co Streamsoft Pro.
 * Czyta stany, wysyła je do portalu wychodzącym połączeniem HTTPS i kończy.
 * Cykliczność zapewnia harmonogram systemu, a nie pętla w procesie: łatwiej
 * to nadzorować i nic nie wisi w pamięci między przebiegami.
 *
 * Domyślnie działa w trybie próbnym. Wysyłkę trzeba włączyć świadomie,
 * żeby pierwsze uruchomienie u klienta nie zmieniło niczego przez pomyłkę.
 */

const PROBA = process.argv.includes("--proba") || process.env.INTEGRATOR_PROBA === "1";
const SCIEZKA_KONFIGURACJI = process.env.INTEGRATOR_KONFIG ?? "./konfiguracja.json";

function loguj(poziom: "info" | "uwaga" | "blad", wiadomosc: string, dane?: unknown) {
  const wpis = {
    czas: new Date().toISOString(),
    poziom,
    wiadomosc,
    ...(dane === undefined ? {} : { dane }),
  };
  /* Jedna linia JSON na zdarzenie, żeby dało się to zebrać czymkolwiek. */
  const kanal = poziom === "blad" ? console.error : console.log;
  kanal(JSON.stringify(wpis));
}

async function wyslij(paczka: Paczka, url: string, token: string) {
  const odpowiedz = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(paczka),
  });

  const tresc = await odpowiedz.text();
  let wynik: unknown;
  try {
    wynik = JSON.parse(tresc);
  } catch {
    wynik = { surowa: tresc.slice(0, 400) };
  }

  return { status: odpowiedz.status, wynik };
}

async function main() {
  const konfiguracja = wczytajKonfiguracje(SCIEZKA_KONFIGURACJI);
  loguj("info", "Start synchronizacji", { zrodlo: konfiguracja.zrodlo.rodzaj, proba: PROBA });

  const { paczka, pominiete } = await pobierzPaczke(konfiguracja);

  if (pominiete.length > 0) {
    /* Pominięte wiersze są uwagą, nie błędem: paczka nadal ma sens,
       ale ktoś musi zobaczyć, że mapowanie kolumn nie pokrywa wszystkiego. */
    loguj("uwaga", `Pominięto ${pominiete.length} wierszy przy tłumaczeniu`, pominiete.slice(0, 5));
  }

  loguj("info", "Odczytano stany", {
    pozycji: paczka.pozycje.length,
    partia: paczka.partia,
  });

  if (paczka.pozycje.length === 0) {
    /* Zero pozycji prawie nigdy nie znaczy pustego magazynu. Zwykle to
       zepsute zapytanie albo złe mapowanie kolumn. Kończymy błędem,
       żeby harmonogram to odnotował. */
    loguj("blad", "Odczyt nie zwrócił żadnej pozycji. Sprawdź zapytanie i mapowanie kolumn.");
    process.exitCode = 2;
    return;
  }

  if (PROBA) {
    loguj("info", "Tryb próbny, nic nie wysyłam", {
      przyklad: paczka.pozycje.slice(0, 3),
    });
    return;
  }

  const { status, wynik } = await wyslij(paczka, konfiguracja.cel.url, konfiguracja.cel.token);

  if (status === 200) {
    loguj("info", "Portal przyjął paczkę", wynik);
    return;
  }

  if (status === 409) {
    /* Portal odrzucił paczkę jako niewiarygodną albo już przyjętą.
       To nie jest awaria sieci, więc ponawianie nic nie da. */
    loguj("uwaga", "Portal odrzucił paczkę", wynik);
    process.exitCode = 1;
    return;
  }

  loguj("blad", `Portal odpowiedział kodem ${status}`, wynik);
  process.exitCode = 2;
}

main().catch((blad: unknown) => {
  loguj("blad", blad instanceof Error ? blad.message : String(blad));
  process.exitCode = 2;
});
