# 006-mussi-cart — raport

## Zrobione

- Dodałem działający ekran `/koszyk` w istniejącej powłoce portalu B2B.
- Koszyk łączy płyty, obrzeża, usługi oraz okucia i akcesoria w jednej wycenie.
- Dodałem cztery demonstracyjne produkty okuć i akcesoriów do katalogu.
- Produkty z kategorii obrzeża i akcesoria można dodać do koszyka bezpośrednio z katalogu.
- Ilości można zwiększać, zmniejszać i usuwać, a ceny przeliczają się natychmiast.
- Podsumowanie pokazuje wyłącznie cenę kontrahenta: netto, VAT 23% i brutto.
- Stan magazynowy wpływa na komunikat o terminie realizacji.
- Dodałem demonstracyjny stan złożenia zamówienia oraz informację o 48 godzinach na zmiany.
- Dodałem koszyk do nawigacji desktopowej oraz osobny skrót w nagłówku mobilnym.
- Zastąpiłem lokalną ikonę strzałki ikoną z używanej w projekcie rodziny Phosphor.
- Zachowałem flagę `funkcje.koszyk` i warstwę repozytorium gotową do późniejszej integracji.

## Pliki

- `src/app/koszyk/page.tsx` — trasa i pobranie danych katalogowych.
- `src/app/koszyk/layout.tsx` — bramka funkcji modułu koszyka.
- `src/components/cart.tsx` — interaktywny koszyk, stany i wycena.
- `src/components/catalog.tsx` — wejście do koszyka dla obrzeży i akcesoriów.
- `src/components/app-shell.tsx` — nawigacja i obsługa trasy portalu.
- `src/components/ikona.tsx` — ikony koszyka, ilości, usuwania i przejścia.
- `src/data/dekory.ts` — demonstracyjne okucia i akcesoria.
- `src/data/portal-demo.ts` — copy, nawigacja i dane usługi demonstracyjnej.
- `src/config/brief.ts` — konfigurowalne etykiety katalogu.

## Walidacja

- TypeScript: OK.
- ESLint: OK.
- Vitest: 6 plików, 55 testów, wszystkie zaliczone.
- `git diff --check`: OK.
- Przeglądarka: katalog → akcesoria → dodanie produktu → koszyk → zmiana ilości → przeliczenie ceny → ostrzeżenie magazynowe → złożenie zamówienia: OK.
- Brak poziomego overflow w kontrolowanym podglądzie 928 px.

## Czego NIE zrobiłem i dlaczego

- Nie podłączałem backendu, magazynu ani systemu sprzedażowego. Ten etap zgodnie z zakresem działa na danych demonstracyjnych.
- Nie wykonywałem commit, push ani deploy. Repozytorium i Vercel pozostają pod kontrolą właściciela integracji.
- Nie modyfikowałem `src/lib/pricing.ts`, `src/lib/repo.ts` ani `src/lib/nesting.ts`. Ekran korzysta z istniejących kontraktów.

## Pytania / Ryzyka

- Kody, ceny i stany nowych okuć są demonstracyjne. Przed integracją trzeba je zastąpić danymi z systemu magazynowo-sprzedażowego.
- Dostępność jest obecnie oceniana per produkt, bez rezerwacji stanów i bez podziału na magazyny.

## Propozycja następnego kroku

- Połączyć pozycje koszyka z projektem Palmowa tak, aby wybór okuć w etapie „Okucia” oraz wycena projektu korzystały z tego samego stanu frontowego.
