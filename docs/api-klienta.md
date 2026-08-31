# API dla aplikacji kontrahenta

Odczyt cen własnej firmy i dostępności asortymentu z portalu Mussi-Płyta.
Przeznaczone dla oprogramowania kontrahenta, nie dla przeglądarki.

Wersja 1. Adres bazowy: `https://<portal>/api/v1`.

## Uwierzytelnienie

Klucz w nagłówku `Authorization`:

```
Authorization: Bearer mussi_a6e59a66_Q4j8DaeQow-g_bzFj2IL6OwotNdWT7pE
```

Klucz jest przypisany do **jednej firmy**. Portal bierze kontrahenta z klucza
i nigdy z parametru żądania, więc nie da się podmienić firmy w adresie
i zobaczyć cudzych rabatów.

Sekret jest u nas przechowywany wyłącznie jako skrót. Zgubionego klucza nie
odzyskamy, wydajemy nowy. Klucz da się unieważnić bez zmiany czegokolwiek
po stronie kontrahenta.

Każda odmowa uwierzytelnienia zwraca to samo `401` z tą samą treścią,
niezależnie od powodu. To celowe: inaczej po odpowiedziach dałoby się
sprawdzać, które klucze istnieją.

## `GET /api/v1/cennik`

Ceny netto dla firmy przypisanej do klucza, wraz z etykietą dostępności.

### Parametry

| Parametr | Wartości | Znaczenie |
|---|---|---|
| `rodzaj` | `plyta`, `akcesorium` | Zawęża listę. Pominięty zwraca całość. |

### Odpowiedź

```json
{
  "ok": true,
  "wersja": 1,
  "wygenerowano": "2026-09-01T00:18:44.512Z",
  "kontrahent": { "id": "K-00128", "nazwa": "Stolarnia Nowak", "kodProgu": "B2", "status": "aktywny" },
  "cennikHandlowy": { "id": "2026-wrzesien", "nazwa": "Cennik od września", "obowiazujeDo": null },
  "waluta": "PLN",
  "ceny": "netto",
  "pozycje": [
    {
      "indeks": "BLU-TAND-500",
      "nazwa": "Prowadnica Blum Tandem 500 mm",
      "producent": "Blum",
      "rodzaj": "akcesorium",
      "kategoria": "okucia",
      "jednostka": "kpl",
      "cenaNetto": 74.5,
      "cenaKatalogowaNetto": 89,
      "rabat": 0,
      "zrodloCeny": "indywidualna",
      "dostepnosc": "na-zamowienie"
    }
  ]
}
```

### Pola pozycji

- **`indeks`** — symbol, po którym się zamawia. Dla akcesoriów SKU, dla płyt kod producenta. Jest stały i to po nim należy dopasowywać pozycje między odczytami.
- **`cenaNetto`** — cena dla tej firmy, po rabacie.
- **`cenaKatalogowaNetto`** — cena przed rabatem, do porównania. `null`, gdy indeksu nie ma w żadnym cenniku.
- **`rabat`** — użyty rabat jako ułamek (`0.11` to 11%). Zero przy cenie uzgodnionej indywidualnie.
- **`zrodloCeny`** — skąd wzięła się cena:
  - `indywidualna` — cena uzgodniona dla tej firmy, ma pierwszeństwo przed progiem,
  - `prog` — cena katalogowa pomniejszona o rabat progu kontrahenta,
  - `katalogowa` — bez rabatu,
  - `brak` — indeksu nie ma w cenniku.
- **`dostepnosc`** — `na-stanie`, `ostatnie-sztuki` albo `na-zamowienie`.

### Czego API nie zwraca

**Liczb ze stanu magazynowego.** Dostępność wychodzi wyłącznie jako etykieta.
Dokładny stan zmienia się w ciągu dnia wraz z rezerwacjami innych firm, więc
liczba sprzed minuty i tak wprowadzałaby w błąd.

Jeśli aplikacja potrzebuje wiedzieć, czy starczy na całe zlecenie, właściwą
drogą jest zapytanie o konkretną ilość, a nie odczyt stanu. To osobna operacja,
jeszcze niezbudowana.

### `cennikHandlowy` może być `null`

Znaczy to, że na dziś żaden cennik handlowy nie obowiązuje i ceny pochodzą
z kart produktów. Ceny są wtedy poprawne, ale warto to zgłosić opiekunowi
handlowemu, bo zwykle oznacza cennik, którego nikt nie przedłużył.

## Kody odpowiedzi

| Kod | Znaczenie | Co zrobić |
|---|---|---|
| `200` | Cennik w treści. | — |
| `400` | Zły parametr, na przykład nieznany `rodzaj`. | Poprawić żądanie. |
| `401` | Brak ważnego klucza. | Sprawdzić nagłówek, ważność i zakres klucza. |
| `409` | Klucz wskazuje firmę spoza kartoteki. | Zgłosić hurtowni, to błąd po naszej stronie. |
| `503` | Zła konfiguracja kluczy po stronie portalu. | Zgłosić hurtowni. |

## Jak często pytać

Ceny zmieniają się rzadko, dostępność często. Rozsądny odczyt to raz na godzinę,
a przed złożeniem zamówienia dodatkowo doraźnie. Odpowiedź jest oznaczona
`Cache-Control: private, no-store`, bo to dane handlowe jednej firmy i nie wolno
ich trzymać w pamięci podręcznej po drodze. Po stronie aplikacji kontrahenta
można je oczywiście zapisać.

## Wydanie klucza (po stronie hurtowni)

```bash
npm run klucz-api -- K-00128
```

Polecenie wypisuje dwie rzeczy: tekst klucza do przekazania kontrahentowi
i wpis do dopisania w zmiennej środowiskowej `KLUCZE_API`. Sekret pokazuje się
jeden raz.

Wpis ma pola: `id`, `kontrahent`, `skrot`, `zakresy`, `aktywny` oraz
opcjonalne `wazneDo` (dzień w formacie `RRRR-MM-DD`). Ustawienie
`"aktywny": false` unieważnia klucz natychmiast.

## Czego jeszcze nie ma

- Składania zamówień przez API.
- Odczytu statusu złożonych zamówień.
- Pytania o dostępność konkretnej ilości.
- Ograniczania liczby zapytań. Do czasu wdrożenia limitu prosimy o rozsądek
  po stronie aplikacji.
