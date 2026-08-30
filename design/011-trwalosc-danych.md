# 011-trwalosc-danych — schemat bazy i co dalej

## Po co

Wszystko, co dziś zapisujemy, żyje w sesji przeglądarki. Odświeżenie strony
gubi zamówienie, rezerwację i dokumenty. Na demonstracji to wystarcza,
w rozmowie o wdrożeniu już nie.

`src/lib/repo.ts` ma gotowy szew: interfejs jest asynchroniczny, choć dziś nic
nie czeka na sieć, a `funkcje.supabase` przełącza implementację. Ta migracja
jest drugą połową tego szwu.

## Co jest

- `supabase/migrations/0001_schemat.sql` — tabele odwzorowujące typy z `src/lib`
- `supabase/migrations/0002_izolacja.sql` — Row Level Security

Nazewnictwo kolumn trzyma się polskich nazw z kodu, żeby podpięcie było
podmianą implementacji, a nie tłumaczeniem pojęć.

## Trzy reguły, które przeszły z aplikacji do bazy

Silniki pilnują ich dziś w TypeScripcie. W bazie stają się warunkami, których
nie da się obejść przy równoczesnych zapisach.

**Jedna żywa rezerwacja na indeks w zamówieniu.** Indeks częściowy
`rezerwacje_zywe` jest właściwą ochroną przed podwójną sprzedażą. Aplikacja
liczy dostępność, ale to baza nie pozwoli jej złamać, gdy dwa zamówienia
trafią w tej samej chwili.

**Powód wymagany od drugiej wersji.** `powod_wymagany_od_drugiej` w
`wersje_zamowien`. Pierwsza wersja powstaje przy złożeniu i powodu nie ma,
każda kolejna musi go mieć.

**Limit nie schodzi poniżej wykorzystania.** `limit_nie_ponizej_wykorzystania`
w `kontrahenci`, ten sam warunek, który sprawdza `zmienWarunki`.

Do tego wyzwalacz `czlonkowie_wlasciciel`: konto nie może zostać bez aktywnego
właściciela. To warunek na zbiorze wierszy, więc nie da się go zapisać jako
`check`.

## Izolacja

Model zakłada, że token niesie `kontrahent_id` i `rola`. Kontrahent widzi
wyłącznie swoje dane, pracownik hurtowni widzi wszystko.

Dwie decyzje warte uwagi:

**Rezerwacje i audyt czyta tylko hurtownia.** Klient ma znać skutek, czyli
termin i komunikat dostępności, a nie cudze blokady magazynowe ani powody
decyzji handlowych.

**Brak polityk INSERT, UPDATE i DELETE jest celowy.** Domyślnie odmawiają,
a zapisy mają iść przez funkcje serwerowe, nie wprost z przeglądarki.
Inaczej reguły z silników dałoby się ominąć zapytaniem z klienta.

## Czego brakuje

- **Migracje nie zostały uruchomione.** Nie mamy projektu Supabase, więc nie ma
  na czym. Składnia nie jest zweryfikowana lokalnie, bo na maszynie nie ma `psql`.
- **Katalog dekorów i akcesoriów** nie ma jeszcze tabel. Dziś czyta go `repo.ts`
  z plików i to jedyne miejsce, gdzie szew już działa.
- **Uwierzytelnianie.** Sesja w przeglądarce jest zasłoną na interfejsie,
  nie kontrolą dostępu. Prawdziwe logowanie wchodzi razem z bazą.
- **Migracja danych zalążkowych** do tabel, żeby demonstracja działała na bazie.

## Następny krok

Potrzebne jest konto Supabase klienta albo decyzja o innej bazie. Po utworzeniu
projektu: uruchomić obie migracje, przenieść dane zalążkowe, dopisać
implementację `supabaseRepo` i przełączyć `funkcje.supabase`.
