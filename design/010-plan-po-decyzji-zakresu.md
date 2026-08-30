# 010-plan-po-decyzji-zakresu — co budujemy po zawężeniu zakresu

## Decyzja klienta, 30 sierpnia 2026

Klient odrzucił prywatny kalkulator marży stolarza. Portal ma robić dwie rzeczy:
odciążać biuro hurtowni i przyjmować zamówienia online. Nie budujemy narzędzia
pracy dla stolarza ani pełnego CRM.

Zapisane w kodzie jako `zakresProduktu` w `src/config/brief.ts`. Sekcja o kalkulatorze
w `004-b2b-crm-erp-spec.md` jest oznaczona jako nieaktualna, ale zostaje dla historii.

**Reguła szeregowania od teraz:** moduł wchodzi, jeżeli skraca pracę biura albo
domyka ścieżkę zamówienia online. Moduł, którego jedynym beneficjentem jest stolarz,
nie wchodzi.

## Nowe uszeregowanie

Audyt 009 szeregował braki wartością dla stolarza. Po zawężeniu zakresu kolejność
się zmienia, bo liczy się droga zamówienia i czas biura.

| Kolejność | Obszar | Dlaczego tu |
| --- | --- | --- |
| 1 | Cykl życia zamówienia i rezerwacje | Bez tego zamówienia online sprzedają ten sam arkusz dwa razy, a okno zmian nie ma czego wersjonować |
| 2 | Dokumenty jako obiekty | Potwierdzenie zamówienia zapisujące wersję i cenę zdejmuje z biura ręczne pilnowanie ustaleń |
| 3 | Warunki handlowe | Biuro liczy dziś rabaty i limity ręcznie przy każdym zamówieniu |
| 4 | Kolejka produkcji i plan odbiorów | Bezpośrednie odciążenie biura, najwięcej telefonów dotyczy terminu |
| 5 | Konto organizacji i role | Zawężone do pytania „kto w stolarni może złożyć zamówienie i do jakiej kwoty” |

Kalkulator marży wypada z listy. Reszta braków z audytu 009 zostaje, zmienia się
tylko kolejność i uzasadnienie.

## Partia 1, zrobiona

### Cykl życia zamówienia, `src/lib/zamowienia.ts`

Dziesięć statusów ze specyfikacji, każdy z opisem tego, co widzi klient, trybem
edycji i informacją, czy trzyma rezerwację. Mapa dozwolonych przejść odrzuca skróty,
na przykład ze szkicu prosto do produkcji.

Okno zmian liczone od przyjęcia zamówienia przez system, nie od rozpoczęcia szkicu.
Po upływie okna tryb edycji spada z „nowa wersja” na „wniosek o zmianę”, a wniosek
nie modyfikuje zamówienia, tylko czeka na decyzję hurtowni.

Każda zmiana tworzy nową wersję. Poprzednia zostaje w historii, wartość i prognoza
terminu liczą się od nowa. Zmiana wymaga powodu i osoby, obie trafiają do audytu.

Trzy terminy trzymane osobno: oczekiwany ze standardowych dni realizacji, potwierdzony
po rezerwacji stanów i aktualna prognoza z ostatniej wersji. Komunikat przed złożeniem
zamówienia nie obiecuje terminu, jeżeli koszyk nie ma pełnego pokrycia.

### Rezerwacje, `src/lib/rezerwacje.ts`

Rezerwacja jest zapisem, nie licznikiem, więc wiadomo kto, ile i do kiedy.
Koszyk rezerwuje się w całości albo wcale: częściowa rezerwacja daje klientowi
obietnicę terminu na część zamówienia i blokuje towar pod coś, czego hurtownia
i tak nie zrealizuje w komplecie. Braki wracają w wyniku, z podziałem na to,
czego i ile zabrakło.

Rezerwacja przy złożeniu jest miękka i wygasa bez potwierdzenia. Potwierdzenie
zamówienia ją utwardza, wydanie i anulowanie zamykają. Każde zamknięcie zostawia wpis.

### Konfiguracja

`terminy` i `rezerwacje` w `src/config/brief.ts`. Wartości dni realizacji, godziny
granicznej i czasu do wygaśnięcia są **naszą propozycją, nie ustaleniem**.
Specyfikacja zostawia otwarte pytanie o dni robocze kontra kalendarzowe i kalendarz
świąt. Dziś pomijamy tylko soboty i niedziele.

## Partia 2, zrobiona

Wpięcie silników w interfejs. Licznik okna zmian liczy z silnika i pokazuje
konkretną datę zamknięcia, zmiana ilości tworzy wersję, po zamknięciu okna
zostaje wniosek. Rezerwacje widoczne w kolejce hurtowni, z jawnym komunikatem,
że przy braku pokrycia stan żadnego indeksu nie został pomniejszony.

## Partia 3, zrobiona

### Dokumenty jako obiekty, `src/lib/dokumenty.ts`

Potwierdzenie zamówienia zamraża wersję i cenę, i jako dokument niefiskalny
nie wymaga danych rejestrowych. WZ powstaje dopiero przy wydaniu i niesie
migawkę podmiotu. Faktury przechodzą przez bramkę z zadania 008, więc podmiot
bez kompletu danych nadal nic nie wystawi. Korekta niesie różnicę wobec faktury,
nie wartość docelową, i odwołuje się do jej numeru.

Adapter KSeF jest osobny i celowo nie blokuje magazynu. `czyBlokujeMagazyn`
zwraca zawsze fałsz i istnieje po to, żeby ten warunek dało się przetestować,
a `sciezkaAwaryjna` mówi operatorowi wprost, że wydanie towaru jest możliwe
mimo nieudanej wysyłki.

Panel hurtowni pokazuje całą ścieżkę pod jednym numerem zamówienia, razem z tym,
czego jeszcze brakuje.

## Partie następne

4. Warunki handlowe: cenniki z datami obowiązywania, ceny indywidualne,
   limit kupiecki, formy płatności, blokady handlowe.
5. Kolejka produkcji i plan odbiorów.
6. Organizacja i role w zawężonym zakresie.

## Do potwierdzenia z hurtownią

- Czy pięć dni realizacji to dni robocze czy kalendarzowe.
- Jaka jest godzina graniczna przyjęcia zamówienia na dany dzień.
- Który kalendarz świąt obowiązuje.
- Po jakim czasie przepada rezerwacja niepotwierdzonego zamówienia.
- Czy okno zmian to nadal 48 godzin.
