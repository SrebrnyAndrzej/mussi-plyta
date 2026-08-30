# 007-multi-entity-invoicing — raport

## Zrobione

- Dodałem trzy konfigurowalne podmioty fakturujące: płyty, akcesoria i Stolarnię U Kazia.
- Pełna nazwa `P.H.U. Mussi-Płyta S.C.` jest używana dla podmiotu płytowego.
- Podmiot akcesoriowy i stolarnia są wyraźnie oznaczone jako wymagające uzupełnienia danych formalnych.
- Dodałem sekcję „Podział fakturowania” do wybranego zamówienia w panelu pracowniczym.
- Każda grupa pozycji ma osobny wybór podmiotu wystawiającego fakturę.
- Domyślny podział przypisuje materiały i obrzeża do podmiotu płytowego, akcesoria do podmiotu akcesoriowego, a usługi do Stolarni U Kazia.
- Operator może zmienić każde przypisanie oraz przywrócić podział sugerowany.
- Ekran liczy osobne netto, VAT 23% i brutto dla każdego podmiotu.
- Liczba dokumentów zmienia się zależnie od liczby podmiotów mających pozycje.
- Podział jest pamiętany oddzielnie dla każdego zamówienia w bieżącej sesji demonstracyjnej.
- Dodałem stan zapisu oraz informację o docelowych osobnych seriach dokumentów.
- Uzupełniłem główną specyfikację CRM/ERP o reguły wielopodmiotowego fakturowania.

## Pliki

- `src/components/invoice-allocation.tsx` — interaktywny podział pozycji i podsumowania dokumentów.
- `src/components/warehouse-screens.tsx` — osadzenie modułu w kolejce zamówień.
- `src/config/brief.ts` — definicje trzech podmiotów i status ich danych formalnych.
- `src/data/warehouse-demo.ts` — wartości liczbowe zamówień i copy modułu.
- `design/004-b2b-crm-erp-spec.md` — wymagania domenowe dla trzech podmiotów.

## Walidacja

- TypeScript: OK.
- ESLint: OK.
- Vitest: 6 plików, 55 testów, wszystkie zaliczone.
- `git diff --check`: OK.
- Przeglądarka: trzy dokumenty, zmiana przypisania, przeliczenie netto/VAT/brutto, zapis i brak poziomego overflow: OK.

## Czego NIE zrobiłem i dlaczego

- Nie wpisałem nieznanych nazw prawnych, NIP, adresów, rachunków ani serii dokumentów dla podmiotu akcesoriowego i stolarni.
- Nie wystawiam prawdziwych faktur ani dokumentów KSeF. Moduł pozostaje przygotowaniem frontendu i kontraktu integracyjnego.
- Nie zapisuję zmian w backendzie. Stan demonstracyjny działa w bieżącej sesji.

## Pytania / Ryzyka

- Przed integracją potrzebne są pełne dane prawne dwóch brakujących podmiotów.
- Należy ustalić, czy obrzeża zawsze fakturuje podmiot płytowy, czy zależy to od źródła konkretnego produktu.
- Każdy podmiot będzie potrzebował osobnej numeracji dokumentów i konfiguracji KSeF.

## Propozycja następnego kroku

- Dodać kartotekę podmiotów z danymi prawnymi, numeracją dokumentów, rachunkami i statusem połączenia KSeF.
