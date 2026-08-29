# Kontrakt estetyczny, Mussi-Płyta

**Ten dokument jest wiążący dla wszystkich, którzy dotykają UI: Claude Code, Codexa
i każdego kolejnego wykonawcy. Nie wolno wyjść poza ten język wizualny bez pisemnej
zgody właściciela projektu.**

Powód nie jest widzimisię. Klient zaakceptował już makietę w tym kierunku i na jej
podstawie podejmuje decyzję o wdrożeniu. Każde odejście od niego oznacza, że na
spotkaniu pokazujemy coś innego, niż uzgodniliśmy.

Wzorzec źródłowy: `../mussi-landing.html` i `../mussi-deck.html`. W razie wątpliwości
otwórz je i porównaj.

## Zasady twarde

### 1. Jeden motyw, jasny
Aplikacja nie ma trybu ciemnego i nie ma przełącznika motywu. Tło `--color-paper`
`#F3F4F6`, powierzchnie białe. Ciemne bloki (`bg-ink`) są dozwolone jako akcent
kompozycyjny, ale nie jako motyw.

### 2. Jeden akcent na całą aplikację
Karmin `#9F0832` z logotypu. Nie ma drugiego koloru marki. Kolory semantyczne
(sukces, ostrzeżenie) są dopuszczone wyłącznie tam, gdzie niosą realny stan,
i nigdy nie konkurują z akcentem o uwagę.

### 3. Jedna skala promieni
Powłoka 28 px (`rounded-shell`), rdzeń 22 px (`rounded-core`), kontrolka 12 px
(`rounded-ctl`), elementy klikalne pełna pigułka. Nic pomiędzy.

### 4. Typografia
`Bricolage Grotesque` na nagłówki, ciasny tracking, ujemny na dużych stopniach.
`Geist` na interfejs. `Geist Mono` na dane, wymiary, kody i ceny.
Liczby w kolumnach zawsze `tabular-nums`. Nie dokładamy czwartego kroju.

### 5. Nagłówek to pływająca wyspa, nie pasek
Nagłówek jest odklejony od górnej krawędzi (`fixed top-4`), ma pełną pigułkę,
półprzezroczyste tło z `backdrop-blur` i jasną krawędź. **Nie wolno wracać do
paska przyklejonego do góry z obwódką na dole.** Tak samo pasek sterowania na dole
w prezentacji.

### 6. Cienie miękkie i podbarwione
`--lift-sm` i `--lift` z `globals.css`. Cienie są rozmyte, o niskiej sile i mają
odcień tła. **Nigdy czarne, nigdy twarde.** Karty stosują podwójną ramkę:
zewnętrzna powłoka `bg-shell` z `ring-1 ring-hair`, wewnątrz rdzeń `bg-surface`.

### 7. Motion
Jedna krzywa na cały dokument: `--ease-fluid` `cubic-bezier(.32,.72,0,1)`.
Bez `linear` i bez `ease-in-out`. Animujemy wyłącznie `transform` i `opacity`.
`prefers-reduced-motion` jest respektowane globalnie i nie wolno tego obchodzić.
Każda animacja musi dać się uzasadnić jednym zdaniem: hierarchia, narracja,
reakcja na akcję albo zmiana stanu. „Bo ładnie wygląda" nie jest uzasadnieniem.

### 8. Zdjęcia
Używamy zdjęć hurtowni z `public/zdjecia/`, po korekcji ekspozycji i balansu bieli.
Manifest z wymiarami i opisami alt jest w `src/data/media.ts` i **to jedyne
źródło prawdy o zdjęciach**. Zawsze przez `next/image` z podanymi wymiarami,
żeby nie było przeskoku układu.

Logotypy producentów jadą w karuzeli, w skali szarości na 62% krycia, kolor wraca
pod kursorem. Karuzela zatrzymuje się pod kursorem i zamienia w zwykły scroll
przy `prefers-reduced-motion`.

### 9. Ikony: jedna rodzina, Phosphor
`@phosphor-icons/react`, waga `regular`, rozmiar 18 px w nawigacji.
Wszystkie ikony przechodzą przez `src/components/ikona.tsx`, gdzie
zestaw jest zamknięty i typowany. **Nie dokładamy drugiej biblioteki ikon
i nie rysujemy własnych ścieżek SVG.** Brakuje glifu? Dopisz go do zestawu
w `ikona.tsx`, nie importuj bezpośrednio w komponencie.

Nawigacja nie używa numerków `01`, `02`, `03` jako markerów. To ślad
generatora, a nie system.

### 10. Zdjęcia produktowe: nie fabrykujemy ich
Hurtownia nie ma fotografii poszczególnych dekorów. Próbki w katalogu to
gradienty CSS w polu `probka`, które przybliżają laminat, i tak zostaje,
dopóki klient nie dostarczy zdjęć. **Nie wstawiamy stockowych zamienników
ani rysowanych imitacji próbek.** Prawdziwe zdjęcia hurtowni z `public/zdjecia/`
służą do budowania kontekstu, nie do udawania kart produktowych.

## Czego nie robimy nigdy

- Gradientowych blobów, mesh gradientów, aury i poświat
- Fioletu i niebieskiego jako akcentu, czyli domyślnej palety generatorów
- Stockowych ilustracji i rysunkowych maskotek
- Trzech równych kart w rzędzie jako domyślnego układu sekcji
- Emoji w interfejsie i w treści
- **Myślnika em w treści widocznej dla użytkownika. Zero, bez wyjątków.**
  Zamiast niego kropka, przecinek, dwukropek albo nawias.
- Etykiet nad każdą sekcją. Maksymalnie jedna na trzy sekcje.
- Podpowiedzi „przewiń niżej" i strzałek zachęcających do scrolla
- Pasków z lokalizacją, pogodą i czasem
- Numerków wersji i „v1.4.2" w stopce strony sprzedażowej
- Czarnych, twardych cieni i obwódek 1 px w szarości domyślnej

## Dostępność, poziom minimalny

WCAG AA. Kontrast tekstu 4.5, dużego tekstu 3.0. Widoczny stan `:focus-visible`
na każdym elemencie interaktywnym. Pole dotykowe minimum 44 px.
Każdy `next/image` ma sensowny `alt`, a dekoracyjne powtórzenia mają `alt=""`
i `aria-hidden`.

## Treść

**Wykonawca nie pisze treści.** Copy dostarcza właściciel projektu.
Teksty mieszkają w `src/config/brief.ts` i w plikach `src/data/`.
Brakujące copy oznaczamy `{/* COPY: ... */}` i zgłaszamy, nie wymyślamy.

## Wartości liczbowe

Ceny, progi rabatowe, parametry arkusza i rzazu pochodzą z `src/config/brief.ts`
albo z silnika. **Zaszycie takiej liczby w komponencie jest błędem**, bo po
korekcie cennika interfejs zacznie kłamać. Dotyczy to również sekcji
marketingowych i przykładów.

## Jak to sprawdzić przed oddaniem pracy

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Do tego: obejrzyj stronę na 1440 i na 375 px, sprawdź brak przewijania w poziomie,
przejdź `Tab`-em przez nawigację i formularze, i włącz „ogranicz ruch"
w systemie, żeby zobaczyć wersję bez animacji.
