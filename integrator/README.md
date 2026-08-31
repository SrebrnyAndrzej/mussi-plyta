# Integrator stanów magazynowych

Agent czytający stany ze Streamsoft Pro i wypychający je do portalu B2B.

## Dlaczego tak, a nie inaczej

**Agent stoi u hurtowni, nie w chmurze.** Portal działa na Vercelu i nie dosięgnie
bazy w ich sieci lokalnej. Odwrócenie kierunku, czyli wystawienie Firebirda na
internet, byłoby najgorszym z możliwych rozwiązań: baza ERP z cenami i danymi
kontrahentów nie powinna mieć publicznego portu.

Agent łączy się wychodząco po HTTPS. Hurtownia nie otwiera żadnego portu
przychodzącego, a agenta da się zatrzymać w każdej chwili.

**Czytamy, nie piszemy.** Agent nie zapisuje niczego do bazy hurtowni.
Pilnują tego dwie rzeczy: konto bazodanowe ma być tylko do odczytu, a `zapytanie`
jest sprawdzane i musi być samym `SELECT`-em. Zamówienia z portalu wejdą
do Streamsofta osobną drogą, ich własną, żeby nie omijać numeracji dokumentów
i reguł magazynowych.

## Co jest gotowe, a co czeka na dostęp

Gotowe i przetestowane: konfiguracja z walidacją, tłumaczenie wierszy na nasz
format, liczenie identyfikatora partii, wysyłka, obsługa błędów, tryb próbny.

Czeka na dostęp do serwera: **nazwy tabel i kolumn**. To jedyna rzecz, której
nie da się zgadnąć. Zapytanie w `konfiguracja.przyklad.json` jest przykładem
kształtu, a nie wiedzą o ich instalacji.

## Uruchomienie

```bash
cd integrator
npm install
cp konfiguracja.przyklad.json konfiguracja.json
```

Uzupełnij `konfiguracja.json`, a sekrety podaj przez środowisko:

```bash
export SF_HASLO='haslo-konta-tylko-do-odczytu'
export INTEGRATOR_TOKEN='token-uzgodniony-z-portalem'
```

Pierwsze uruchomienie zawsze próbne. Nic nie wysyła, pokazuje, co odczytał:

```bash
npm run proba
```

Dopiero gdy odczyt się zgadza:

```bash
npm start
```

## Harmonogram

Cykliczność zapewnia system, nie pętla w procesie. Łatwiej to nadzorować,
a między przebiegami nic nie wisi w pamięci.

Windows, Harmonogram zadań: uruchamiaj `npm start` co `coMinut` minut,
w katalogu integratora.

Linux, cron co 15 minut:

```
*/15 * * * * cd /opt/mussi-integrator && /usr/bin/npm start >> /var/log/mussi-integrator.log 2>&1
```

## Kody wyjścia

| Kod | Znaczenie | Co robić |
|---|---|---|
| 0 | Paczka przyjęta albo tryb próbny | nic |
| 1 | Portal odrzucił paczkę, na przykład jako obciętą albo już przyjętą | zajrzeć w dziennik, nie ponawiać w kółko |
| 2 | Błąd odczytu, sieci albo konfiguracji | ponowienie ma sens, ale sprawdź dziennik |

Rozróżnienie jest celowe: kod 1 znaczy, że dane dotarły i zostały świadomie
odrzucone, więc ponawianie niczego nie zmieni.

## Zabezpieczenia przed cichą awarią

Najgroźniejszy scenariusz to nie wywalony agent, tylko taki, który działa
i podaje złe dane. Zepsute zapytanie zwykle nie kończy się błędem, tylko
pustym albo obciętym wynikiem.

Dlatego:

- **zero pozycji kończy się błędem**, bo pusty magazyn jest znacznie mniej
  prawdopodobny niż zepsute zapytanie,
- **portal odrzuca paczkę pokrywającą mniej niż połowę znanych indeksów**,
  zamiast wyzerować stany,
- **identyfikator partii liczy się z treści**, więc powtórzone uruchomienie
  na niezmienionych danych nie robi nic,
- **wiersze, których nie dało się przetłumaczyć, trafiają do dziennika**
  jako uwaga, zamiast zniknąć.

## Do ustalenia z hurtownią i ze Streamsoftem

1. Nazwy tabel i kolumn dla towarów, stanów i rezerwacji.
2. Konto bazodanowe **tylko do odczytu** dla integratora.
3. Czy Streamsoft dopuszcza odczyt z bazy bez utraty wsparcia.
4. Na czym uruchomić agenta: serwer bazy czy osobna maszyna w tej samej sieci.
5. Jak wprowadzać zamówienia z portalu do Streamsofta, bo to osobny temat
   i nie robi tego ten agent.
