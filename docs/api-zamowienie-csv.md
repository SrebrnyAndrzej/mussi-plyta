# Zamówienie plikiem CSV

Format wymiany między aplikacją kontrahenta a portalem Mussi-Płyta oraz trasa,
która takie zamówienie przyjmuje.

Ten dokument jest **specyfikacją do zaimplementowania po obu stronach**.
Aplikacja w Swift generuje i sprawdza plik lokalnie, portal robi to samo
u siebie. Obie implementacje mają przechodzić te same wektory testowe:
[`docs/wektory/zamowienie-csv.json`](wektory/zamowienie-csv.json).

Wersja formatu: **1**.

## Format pliku

### Ogólne

| Cecha | Zasada |
|---|---|
| Kodowanie | UTF-8. Znacznik BOM na początku jest dopuszczalny i pomijany. |
| Separator | `;`, `,` albo tabulator. Wykrywany z pierwszego niepustego wiersza. Do zapisu używaj `;`. |
| Końce linii | `\n` albo `\r\n`. |
| Cudzysłowy | Według RFC 4180. Pole z separatorem, cudzysłowem albo znakiem nowej linii otocz `"`. Cudzysłów w środku pola podwój: `""`. |
| Puste wiersze | Pomijane. Nie przesuwają numeracji widocznej w błędach. |
| Nagłówek | Wymagany, w pierwszym niepustym wierszu. |
| Limit | 1000 wierszy danych, 1 MB pliku. |

### Kolumny

Kolejność dowolna, nieznane kolumny są pomijane. Nazwy porównujemy bez
ogonków, spacji i wielkości liter, więc `Ilość`, `ILOSC` i `ilosc` to to samo.

| Kolumna | Wymagana | Przyjmowane nazwy | Zasada |
|---|---|---|---|
| Indeks | tak | `indeks`, `sku`, `symbol`, `kod`, `index` | Dokładnie taki, jak pole `indeks` z `/api/v1/cennik`. |
| Ilość | tak | `ilosc`, `liczba`, `sztuk`, `qty`, `quantity` | Liczba większa od zera. Przecinek albo kropka dziesiętna. Spacje w środku są pomijane. |
| Jednostka | nie | `jednostka`, `jm`, `unit` | Jeśli podana, musi zgadzać się z asortymentem. Porównanie bez wielkości liter. |
| Uwagi | nie | `uwagi`, `uwaga`, `opis`, `notes` | Tekst dowolny. |

Podawanie jednostki jest nieobowiązkowe, ale **zalecane**: to jedyny
mechanizm, który wychwyci zamówienie pięciu kompletów tam, gdzie sprzedajemy
na sztuki.

### Przykład

```csv
indeks;ilosc;jednostka;uwagi
BLU-CLIP-110;24;szt;
AMX-HS-0-EURO;100;szt;
OBR-ABS-1180;150;mb;"dobrać do dekoru 5981"
```

### Powtórzony indeks

Ten sam indeks w kilku wierszach **jest sumowany**, a odpowiedź wymienia takie
przypadki w polu `scalone`. Nie jest to błąd, ale zwykle oznacza błąd
w aplikacji, która wygenerowała plik, więc warto to pokazać użytkownikowi.

## Zasada całości albo nic

Jeden błędny wiersz odrzuca **cały plik**. Nic nie zostaje zamówione, żaden
stan nie zostaje pomniejszony. Zamówienie złożone w połowie jest gorsze niż
nieprzyjęte, bo nikt nie wie, co zostało kupione.

## Kody błędów

Kody są stałe i przeznaczone do porównywania w kodzie. Komunikat jest dla
człowieka i może się zmienić, kod nie.

| Kod | Zakres | Znaczenie |
|---|---|---|
| `pusty-plik` | plik | Plik nie ma treści. |
| `brak-naglowka` | plik | Jest sam nagłówek, bez wierszy danych. |
| `brak-kolumny-indeks` | plik | Nagłówek nie ma kolumny z indeksem. |
| `brak-kolumny-ilosc` | plik | Nagłówek nie ma kolumny z ilością. |
| `za-duzo-wierszy` | plik | Powyżej 1000 wierszy danych. |
| `pusty-indeks` | wiersz | Wiersz bez indeksu. |
| `ilosc-niepoprawna` | wiersz | Ilość nie jest liczbą. |
| `ilosc-niedodatnia` | wiersz | Ilość zerowa albo ujemna. |
| `nieznany-indeks` | wiersz | Indeksu nie ma w asortymencie. |
| `jednostka-niezgodna` | wiersz | Jednostka w pliku nie zgadza się z asortymentem. |

Błąd wiersza niesie `wiersz` — numer liczony od 1 **wraz z nagłówkiem**, czyli
tak, jak widzi go użytkownik w arkuszu. Błąd całego pliku ma `wiersz: null`
albo `1`, gdy dotyczy nagłówka.

## `POST /api/v1/zamowienia`

```
POST /api/v1/zamowienia
Authorization: Bearer mussi_<id>_<sekret>
Content-Type: text/csv

indeks;ilosc
BLU-CLIP-110;24
```

Klucz musi mieć zakres `zamowienia`. Uwierzytelnienie idzie **przed** czytaniem
pliku, więc odpowiedziami o błędach nie da się badać asortymentu.

### Parametry

| Parametr | Znaczenie |
|---|---|
| `probny=1` | Bieg próbny: pełne sprawdzenie i wycena, oznaczone w odpowiedzi polem `probny`. |

### Odpowiedź `200`

```json
{
  "ok": true,
  "wersja": 1,
  "probny": false,
  "zapisane": false,
  "zamowienie": { "id": "M-2026-6127", "status": "okno-zmian", "wersje": [] },
  "potwierdzenie": { "numer": "PZ/M-2026-6127/1" },
  "pozycje": [{ "sku": "BLU-CLIP-110", "ilosc": 24, "cenaJednostkowa": 13.26, "zrodloCeny": "prog", "netto": 318.24 }],
  "netto": 1363.74,
  "vat": 313.66,
  "brutto": 1677.4,
  "termin": "2026-09-07T22:35:36.127Z",
  "wymagaAkceptacji": false,
  "akceptujacy": [],
  "scalone": [],
  "komunikat": "..."
}
```

**Pole `zapisane` jest dziś zawsze fałszem.** Portal nie ma jeszcze bazy:
trasa liczy wycenę, pokrycie, limity i dokumenty naprawdę, ale po restarcie
nie zostaje ślad. Aplikacja nie powinna uznawać zamówienia za przyjęte do
realizacji, dopóki to pole nie będzie prawdą. Z tego samego powodu `probny=1`
i wysłanie na serio zachowują się dziś tak samo; różnica zacznie mieć
znaczenie po wdrożeniu bazy.

`wymagaAkceptacji` oznacza, że wartość zamówienia przekracza limit osoby,
w imieniu której działa klucz. Zamówienie istnieje, ale czeka na zatwierdzenie
przez kogoś z listy `akceptujacy`.

### Kody odpowiedzi

| Kod | Znaczenie | Treść |
|---|---|---|
| `200` | Przyjęte. | Jak wyżej. |
| `401` | Brak ważnego klucza albo klucz bez zakresu `zamowienia`. | — |
| `405` | Ta trasa przyjmuje tylko `POST`. | — |
| `409` | Silnik odmówił: brak pokrycia, przekroczony limit kupiecki, blokada handlowa. | `etap`, `blad`, `braki`. |
| `413` | Plik powyżej 1 MB. | — |
| `422` | Plik nie przeszedł sprawdzenia. | `bledy` z numerami wierszy. |
| `503` | Zła konfiguracja kluczy po stronie portalu. | Zgłosić hurtowni. |

Różnica między `422` a `409` jest istotna dla aplikacji: `422` to błąd pliku,
który poprawia użytkownik u siebie. `409` znaczy, że plik był poprawny, ale
zamówienia nie da się teraz zrealizować.

## Implementacja w Swift

Kolejność prac, która nie zostawia niespodzianek:

1. **Zapis.** Napisz generator CSV. Separator `;`, ułamki z **kropką** (przecinek zderzyłby się z separatorem poza polskim ustawieniem regionalnym), pola z `;` `"` lub nową linią w cudzysłowie z podwojeniem.
2. **Odczyt.** Napisz parser według tabeli wyżej. Uwaga na trzy pułapki: znacznik BOM z eksportu, `\r\n`, oraz cudzysłowy — pole `"a;b"` to jedno pole.
3. **Wektory.** Uruchom [`docs/wektory/zamowienie-csv.json`](wektory/zamowienie-csv.json) jako testy. Plik ma pola `przypadki` (sam parser) i `przypadkiKatalogowe` (sprawdzenie wobec asortymentu z pola `katalog`). Zgodność ma być co do kodu błędu i numeru wiersza.
4. **Sprawdzenie lokalne.** Aplikacja ma katalog z `/api/v1/cennik`, więc może wykryć nieznany indeks i niezgodną jednostkę **bez wysyłania czegokolwiek**. Zrób to: użytkownik zobaczy błąd od razu, a nie po wysłaniu.
5. **Wysyłka.** Dopiero teraz `POST`. Serwer powtarza całe sprawdzenie, bo katalog w aplikacji bywa nieaktualny — nie traktuj tego jako duplikatu pracy, tylko jako warstwę, która wyłapie różnicę.

Odpowiedniki typów po stronie Swift wynikają wprost z pól opisanych wyżej.
Ilość trzymaj jako `Decimal`, nie `Double`: `Float`/`Double` nie zapisze
dokładnie ilości takich jak `12.5` przy sumowaniu duplikatów, a różnice
grosza w wycenie wracają jako reklamacje.

Jeśli dopisujesz przypadek brzegowy, dopisz go do wektorów, a nie tylko do
własnych testów. Wektory są jedynym miejscem, w którym obie implementacje
się spotykają.

## Czego jeszcze nie ma

- Zapisu zamówienia do bazy, patrz pole `zapisane`.
- Formatek ciętych na wymiar w tym pliku. Listę rozkroju wgrywa się dziś w kreatorze i to osobna ścieżka.
- Odczytu statusu złożonego zamówienia.
