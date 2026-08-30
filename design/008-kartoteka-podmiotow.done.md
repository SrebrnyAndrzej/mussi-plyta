# 008-kartoteka-podmiotow — raport

Domknięcie zadania 007. Codex zbudował sam podział pozycji między trzy podmioty
i sam zapisał, czego nie zrobił. Ten krok realizuje pozostałe wymagania
ze specyfikacji `004-b2b-crm-erp-spec.md`, sekcja „Trzy podmioty i podział fakturowania”.

## Zrobione

- Wydzieliłem silnik `src/lib/fakturowanie.ts`. Logika podziału, VAT, numeracji
  i walidacji wyszła z komponentu klienckiego i jest testowalna.
- Kartoteka podmiotów w `src/config/brief.ts` ma komplet pól rejestrowych:
  nazwa prawna, NIP, REGON, adres, rachunek, serie faktur, korekt i WZ oraz status KSeF.
- Kompletność danych jest liczona, a nie deklarowana. Zniknęło pole `daneFormalne`,
  bo mówiło nieprawdę: podmiot płytowy był oznaczony jako kompletny, mimo że
  w całym repozytorium nie ma ani jednego NIP-u ani numeru rachunku.
- Bramka wystawienia. Dokumentu nie da się wystawić, gdy pozycja nie ma podmiotu
  albo gdy podmiot z pozycjami nie ma kompletu danych. Przycisk jest zablokowany,
  a lista blokad nazywa konkretne brakujące pola.
- Walidacja formatu: suma kontrolna NIP i rachunek sprawdzany mod 97.
  Wypełnione, ale błędne pole blokuje wystawienie tak samo jak brak pola.
- Migawka danych na dokumencie. Późniejsza zmiana kartoteki nie rusza
  już wystawionego dokumentu.
- Numeracja w serii podmiotu, `FV-P/0001/2026`. Bez serii numer nie powstaje,
  zamiast wymyślonego numeru jest informacja „po nadaniu serii”.
- Audyt zmiany podmiotu: pozycja, kierunek zmiany, powód ze słownika,
  operator i data. Historia widoczna pod podziałem.
- Nowy ekran `/hurtownia/podmioty` z kartoteką, licznikiem gotowości,
  edycją pól i przełącznikiem KSeF. Wpis „Podmioty” w nawigacji zaplecza.
- Widok klienta pokazuje komplet dokumentów pod jednym numerem zamówienia,
  z podmiotem wystawiającym, kwotą i statusem.

## Pliki

- `src/lib/fakturowanie.ts` — silnik podziału, walidacji, numeracji i audytu.
- `src/lib/__tests__/fakturowanie.test.ts` — 34 testy.
- `src/config/brief.ts` — pełna kartoteka trzech podmiotów.
- `src/components/kartoteka-podmiotow.tsx` — ekran kartoteki.
- `src/app/hurtownia/podmioty/page.tsx` — trasa kartoteki.
- `src/components/invoice-allocation.tsx` — przepisany na silnik.
- `src/components/orders-center.tsx` — komplet dokumentów u klienta.
- `src/data/warehouse-demo.ts`, `src/data/portal-demo.ts` — pozycje z kategoriami i copy.

## Walidacja

- TypeScript: OK.
- ESLint: OK.
- Vitest: 7 plików, 89 testów, wszystkie zaliczone. Było 55.
- Przeglądarka: kartoteka przechodzi z „0 z 3” na „1 z 3” po uzupełnieniu
  podmiotu płytowego, numer wskakuje na `FV-P/0001/2026`, błędna suma kontrolna
  NIP jest wyłapywana na żywo, bramka wystawienia blokuje z listą trzech powodów,
  audyt zapisuje zmianę obrzeży z podmiotu płytowego na stolarnię.
- Sumy dokumentów odtwarzają wartość zamówienia: 7699,95 + 2135,75 + 1405,10 = 11 240,80 zł.
- Brak poziomego overflow przy 375 px na obu nowych ekranach.

## Czego NIE zrobiłem i dlaczego

- Nie wpisałem prawdziwych NIP-ów, rachunków ani nazw prawnych. Tych danych
  nikt nam nie podał, a wymyślony NIP na fakturze to realna szkoda.
  Kartoteka jest przygotowana na ich wpisanie i sama odblokuje wystawianie.
- Nie zapisuję kartoteki ani podziału w bazie. Stan działa w sesji przeglądarki,
  bo `funkcje.supabase` jest wyłączone.
- Nie integruję z KSeF. Przełącznik pokazuje status, nie nawiązuje połączenia.

## Do ustalenia na spotkaniu

- Pełne dane rejestrowe podmiotu akcesoriowego i Stolarni U Kazia.
- Czy obrzeża zawsze fakturuje podmiot płytowy, czy zależy to od źródła towaru.
  Pytanie zostawił Codex i nadal jest otwarte.
- Format serii numeracji, którego hurtownia używa dziś w swoim systemie.
- Czy klient ma widzieć trzy osobne dokumenty, czy jedno zbiorcze podsumowanie
  z rozbiciem na podmioty.
