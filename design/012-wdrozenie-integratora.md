# 012-wdrozenie-integratora — plan wdrożenia stanów magazynowych

## Co jest gotowe dzisiaj

Integrator działa od końca do końca na danych próbnych, bez dostępu do serwera
hurtowni. Sprawdzone realnym przebiegiem:

- odczyt 78 pozycji, wykrycie dokładnie tych zmian, które w danych były,
- odrzucenie paczki pokrywającej 2 z 78 indeksów, kodem 409 i komunikatem
  wskazującym obcięty odczyt,
- odrzucenie żądania bez tokenu i z tokenem błędnym, kodem 401,
- tłumaczenie wierszy odporne na wielkość liter w kluczach, liczby podane
  jako tekst i przecinek dziesiętny,
- pusty indeks zgłoszony jako uwaga w dzienniku, a nie pominięty po cichu.

Kod: `integrator/` oraz `src/lib/stany-przyjecie.ts` i `src/app/api/stany/route.ts`.
26 testów, 17 po stronie portalu i 9 po stronie agenta.

## Czego brakuje, i to jest jedyna prawdziwa przeszkoda

**Nazw tabel i kolumn w bazie hurtowni.** Wszystko inne jest napisane. Zapytanie
w `integrator/konfiguracja.przyklad.json` to przykład kształtu, nie wiedza o ich
instalacji.

Nie da się tego zgadnąć ani obejść. Dopóki tego nie mamy, wdrożenie stoi.

## Plan, dzień po dniu

Numeracja liczy się od dnia, w którym dostaniemy odpowiedzi, nie od dziś.

### Dzień 0, po naszej stronie, zrobione

Agent, punkt odbioru, walidacja, testy, dokumentacja uruchomieniowa.

### Dzień 1, pytania do hurtowni i do Streamsofta

Cztery rzeczy, wszystkie krótkie, ale każda blokuje:

1. **Zrzut listy tabel i kolumn** dla towarów, stanów i rezerwacji.
   Wystarczy wynik zapytania o metadane albo zrzut ekranu z ich narzędzia.
2. **Konto bazodanowe tylko do odczytu** dla integratora.
3. **Zgoda Streamsofta na odczyt z bazy** bez utraty wsparcia. To pytanie
   do ich opiekuna, nie do informatyka hurtowni.
4. **Gdzie postawić agenta**: serwer bazy czy osobna maszyna w tej samej sieci.

### Dzień 2, dopasowanie zapytania

Piszemy `zapytanie` i `kolumny` w konfiguracji, uruchamiamy `npm run proba`
na ich serwerze. Nic nie jest wysyłane, agent tylko pokazuje, co odczytał.

Porównujemy odczyt z tym, co widać w Streamsofcie na kilku indeksach.
Ten krok jest krótki, jeśli metadane są poprawne, i długi, jeśli nie są.

### Dzień 3, pierwsza wysyłka

Token w środowisku po obu stronach, jedno uruchomienie ręczne, sprawdzenie
odpowiedzi portalu. Spodziewamy się dużej liczby zmian, bo to pierwsze
zderzenie danych zalążkowych z rzeczywistością.

**Tu potrzebna jest decyzja**: czy pierwszą paczkę zastosować w całości,
czy przejrzeć ją ręcznie. Przy pierwszym imporcie skłaniam się do przeglądu.

### Dzień 4, harmonogram

Wpis w Harmonogramie zadań albo cronie, co 15 minut. Obserwacja dziennika
przez dobę. Sprawdzenie, czy kod wyjścia 1 i 2 trafiają tam, gdzie ktoś
je zobaczy.

## Zależność, o której trzeba pamiętać

**Portal nie zapisuje jeszcze stanów na stałe.** Punkt odbioru sprawdza paczkę
i zwraca, co by się zmieniło, ale nie ma gdzie tego utrwalić, bo nie ma bazy.
Odpowiedź mówi to wprost polem `zastosowano: false`.

To nie blokuje wdrożenia agenta: możemy go uruchomić, dopasować zapytanie
i obserwować, czy dane się zgadzają. Ale **żeby stany faktycznie pojawiły się
w portalu, musi wejść baza**, czyli migracje z `011-trwalosc-danych.md`.

Kolejność bez znaczenia, obie prace idą równolegle. Ważne, żeby nikt nie
oczekiwał, że sam agent wystarczy.

## Ryzyka

**Schemat zmienia się przy aktualizacji Streamsofta.** Dlatego mapowanie jest
w konfiguracji, a nie w kodzie, a agent kończy błędem, gdy zapytanie przestanie
działać. Po każdej aktualizacji ich systemu trzeba sprawdzić przebieg.

**Streamsoft może nie zgodzić się na odczyt z bazy.** Wtedy zostaje droga
przez ich moduł wymiany, ale ten jest opisany tylko dla linii Prestiż i płatny
osobno. To zmienia rozmowę z technicznej na kosztową.

**Wydajność przy dużym katalogu.** 78 indeksów to nic. Przy kilku tysiącach
trzeba sprawdzić czas zapytania i rozważyć odczyt różnicowy zamiast pełnego.
Do zmierzenia na ich danych, nie do zgadywania.

## Czego ten agent nie robi

Nie wprowadza zamówień z portalu do Streamsofta. To osobny temat i osobna
droga, ich własna, żeby nie omijać numeracji dokumentów i reguł magazynowych.
Warto o tym pamiętać, bo w rozmowie łatwo skleić oba tematy w jeden.
