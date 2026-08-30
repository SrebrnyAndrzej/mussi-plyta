# 009-audyt-frontendu-erp — czego brakuje do frontendu ERP/CRM

Audyt stanu na 30 sierpnia 2026, po domknięciu fakturowania (zadanie 008).
Punkt odniesienia: `004-b2b-crm-erp-spec.md`, czyli nasza własna specyfikacja domenowa.
Każdy brak jest sprawdzony w kodzie, nie wywnioskowany z teorii.

## Co już stoi

15 tras, 8 silników w `src/lib`, 89 testów jednostkowych, build produkcyjny przechodzi.

Działa: katalog, kreator formatek z prawdziwym rozkrojem i rzazem 4 mm, koszyk,
panel klienta, zaplecze hurtowni, stany magazynowe z ręczną korektą i audytem,
import XLSX/CSV, progi rabatowe od obrotu, kontrakt integracji, podział
fakturowania na trzy podmioty z bramką wystawienia.

## Braki domenowe, w kolejności wartości

### 1. Prywatny kalkulator marży stolarza — zero śladu w kodzie

Specyfikacja opisuje go w sekcji „Prywatny kalkulator marży stolarza”. W kodzie
nie ma ani jednego wystąpienia marży czy narzutu.

To jedyny moduł w całym systemie, który pracuje **na rzecz stolarza, a nie Mussi**:
koszt zakupu, robocizna, transport, montaż, materiał od innych dostawców, bufor
odpadu, narzut albo marża, cena dla klienta końcowego. Dane prywatne dla jego
organizacji, niewidoczne dla handlowców Mussi. Eksport oferty bez ujawniania cen zakupu.

Reszta portalu ułatwia stolarzowi kupowanie w Mussi. Ten moduł daje mu coś,
czego dziś nie ma nigdzie. To argument, który sprzedaje portal, a nie tylko go opisuje.

Narzut i marża muszą być liczone osobno, bo to nie jest ten sam wskaźnik.
Narzut liczy się od kosztu, marża od ceny sprzedaży. Pomylenie ich to typowy
błąd arkuszy, na których stolarze pracują dzisiaj, i dobry moment na pokazanie,
że system liczy poprawnie.

### 2. Konto organizacji i role — zero śladu w kodzie

Wszystkie 20 trafień na „role” to atrybut ARIA w JSX. Nie ma pojęcia użytkownika
poza `operatorHurtowni.login`.

Specyfikacja wymaga: wielu osób w jednej stolarni, ról właściciel, kupujący,
kosztorysant i podgląd, limitów akceptacji zamówień, historii logowań i sesji.
Bez tego portal jest jednoosobowy, a to nie jest CRM. To także warunek sensu
punktu 1: marża stolarza ma być prywatna dla jego organizacji, więc najpierw
musi istnieć organizacja.

### 3. Dokument jako obiekt — jest podział, nie ma dokumentów

Zadanie 008 dało podział wartości między podmioty, numerację w serii, migawkę
danych rejestrowych i bramkę wystawienia. Nie ma samych dokumentów: potwierdzenia
zamówienia zapisującego wersję i cenę, WZ powiązanego z wydaniem, faktury,
korekty. Nie ma listy dokumentów klienta ani pobierania.

### 4. Wersjonowanie zamówienia — zero śladu w kodzie

Specyfikacja mówi o „ostatniej zaakceptowanej wersji” i o ponownym przeliczeniu
terminu po każdej zmianie wersji. Dziś zamówienie jest jednym stanem. Okno edycji
48 godzin istnieje w UI, ale nie ma czego wersjonować.

### 5. Warunki handlowe głębsze niż próg obrotu

Jest `cenaDlaKontrahenta` i progi od obrotu rocznego. Nie ma: cenników z datami
obowiązywania, cen indywidualnie negocjowanych, limitu kupieckiego, form płatności,
blokad handlowych. To rdzeń panelu operacyjnego Mussi.

### 6. Rezerwacje na poziomie systemu, nie liczby

`rezerwacje` to dziś pole liczbowe akcesorium. Brakuje: twardej rezerwacji przy
złożeniu zamówienia, wygasania rezerwacji dla niepotwierdzonych, ochrony przed
podwójną sprzedażą, rezerwacji resztek i metrów obrzeża, daty dostawy dla braku,
polityki zamienników. Część z tego to backend, ale ekrany muszą pokazywać różnicę
między stanem fizycznym, dostępnym, zarezerwowanym i oczekiwanym.

### 7. Plan odbiorów, kolejka produkcji, częściowe realizacje

Kolejka zamówień jest. Nie ma osobnego widoku kolejki cięcia, oklejania
i kompletacji, planu odbiorów i dostaw ani obsługi realizacji częściowej.

## Braki warsztatowe

Te nie są widoczne dla klienta, ale decydują, czy pierwsze siedem da się zbudować
bez tonięcia w regresji.

### Formularze i walidacja

`package.json` nie ma biblioteki formularzy. ERP to w praktyce formularze:
kartoteka podmiotów, warunki handlowe, dane organizacji, kalkulator marży.
Dziś każdy input to ręczny `useState` i ręczna walidacja.

Rekomendacja: React Hook Form z Zod. Jeden schemat waliduje klienta i serwer,
a `z.infer` daje typy bez duplikatu. Zod przyda się od razu w drugim miejscu:
specyfikacja w sekcji „Bezpieczeństwo” wymaga walidacji zawartości plików
XLSX i CSV, a `src/lib/import-formats.ts` robi to dziś ręcznie.

### Siatka danych

Tabele są dziś ręcznymi gridami CSS. Przy pełnym katalogu dekorów, tysiącach SKU
akcesoriów i historii zamówień potrzebne jest sortowanie, filtrowanie fasetowe,
wirtualizacja i stan filtrów w URL.

Uwaga do wykonania: gotowe zestawy w tym obszarze są oparte na shadcn i wnoszą
własny system tokenów CSS. `DESIGN.md` zakazuje wychodzenia poza obecną estetykę,
więc bierzemy z nich architekturę, a nie warstwę wizualną. Rdzeniem jest i tak
TanStack Table, którego można użyć bez shadcn.

### Stan serwera

Dane są dziś statyczne, a `src/lib/repo.ts` ma gotowy szew na Supabase. W chwili
podpięcia bazy potrzebny będzie cache, unieważnianie i aktualizacje optymistyczne.
Do rozstrzygnięcia: React Query czy Server Actions Next.js. Przy Supabase
i App Routerze skłaniam się do Server Actions plus punktowo React Query
w miejscach z realnym odświeżaniem, czyli kolejka zamówień i stany.

### Testy powyżej warstwy silników

89 testów, wszystkie w `src/lib`. Zero testów komponentów, zero E2E. Reguły,
które najbardziej bolą przy pomyłce, są dziś nieprzetestowane od strony
użytkownika: bramka wystawienia dokumentów, okno edycji 48 godzin, blokada
zamówienia poniżej rezerwacji, ścieżka od koszyka do zamówienia.

Specyfikacja ma osobną sekcję „Testy bez niekończącej się regresji”. Dziś
spełniamy ją tylko w warstwie obliczeń.

### Dostępność w procesie

Robimy a11y ręcznie i doraźnie. Przy panelu, w którym operator pracuje osiem
godzin dziennie i często z klawiatury, potrzebny jest powtarzalny audyt WCAG,
a nie pojedyncze poprawki po fakcie.

### Daty

Brak biblioteki dat, a domena jest pełna terminów: okno edycji, termin
potwierdzony i prognozowany, daty obowiązywania cenników, wygasanie rezerwacji.

## Skille dograne pod te braki

Do `~/.agents/skills`, czyli wspólnego źródła dla obu agentów:

| Skill | Po co | Kto używa |
| --- | --- | --- |
| `react-hook-form-zod` | formularze ERP i walidacja importu | Codex, ja przy imporcie |
| `data-table-filters` | architektura siatki danych, filtry, wirtualizacja | Codex |
| `wcag-accessibility-audit` | powtarzalny audyt WCAG 2.1/2.2 | Codex |
| `playwright-e2e-init` | E2E dla ścieżek krytycznych | ja |

Trzy pierwsze podpięte także do `~/.codex/skills`, bo UI i poprawki a11y są
w lanie Codexa. Playwright zostaje po mojej stronie, razem z resztą infrastruktury testowej.

## Co proponuję zrobić przed poniedziałkiem

Nic z listy domenowej poza jednym: **kalkulator marży**. Demo ma już dużą
szerokość, a każdy kolejny ekran Mussi to więcej tego samego. Kalkulator jest
jedyną rzeczą, która na spotkaniu mówi do stolarza, a nie do hurtowni.

Reszta to materiał na etapy po spotkaniu, bo połowa z niej zależy od decyzji,
których jeszcze nie mamy.

## Czego potrzebujemy od klienta

- Dane rejestrowe trzech podmiotów: nazwa prawna, NIP, adres, rachunek, serie numeracji.
- Czy obrzeża zawsze fakturuje podmiot płytowy, czy zależy to od źródła towaru.
- Role w stolarniach: kto zamawia, kto akceptuje, do jakiej kwoty.
- Czy limit kupiecki i zaległości mają być widoczne dla klienta.
- Zgoda na Supabase albo wskazanie własnej bazy.
- Decyzja o ścianie logowania Vercel: wyłączyć albo podpiąć własną domenę,
  bo dziś klient nie otworzy linku `.vercel.app`.
