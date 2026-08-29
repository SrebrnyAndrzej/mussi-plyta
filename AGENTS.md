# Mussi-Płyta, portal B2B — kontekst projektu

Ten plik czytasz automatycznie, gdy pracujesz w tym katalogu. Zawiera wszystko,
czego potrzebujesz, żeby kontynuować pracę bez dopytywania.

## Kto jest klientem i po co to robimy

**Mussi-Płyta** to hurtownia płyt meblowych i akcesoriów w Zielonej Górze,
ul. Działkowa 19, działa od 2013 roku. Sprzedaje płytę, blaty, fronty, obrzeża
i okucia, ma własną stolarnię „U Kazia” z piłą panelową i okleiniarką.

**Użytkownikiem portalu jest stolarz.** Kończy montaż o 19:00 i wtedy chce zamówić
materiał na kolejną kuchnię. Dziś nie może: hurtownia pracuje 8–16, a zamówienia
przyjmuje drukiem do wypełnienia, na którym obrzeża koduje się ciągiem cyfr
w rodzaju `1111`, a słoje literą `T`. Każda pomyłka to źle pocięta płyta.

Obecna strona `mussi-plyta.pl` stoi na Joomli z 2016 roku, nie ma HTTPS
i ma wstrzyknięty spam hazardowy na czterech podstronach. To osobny wątek,
tutaj budujemy to, co ma ją zastąpić.

**Model rozliczenia:** wykonawca nie bierze faktury, tylko lepsze warunki zakupowe.
Dlatego zakres musi być realny i dowieziony etapami.

## Stan na teraz

Działa zalążek silnika i przechodzi 16 testów. Warstwy wizualnej praktycznie nie ma,
`src/app/page.tsx` to strona kontrolna dowodząca, że rozkrój i wycena się liczą.

**Najbliższy termin: spotkanie z klientem w poniedziałek.** Ma zobaczyć działającą
makietę z zalążkiem silnika, a nie slajdy. Po spotkaniu spodziewamy się korekt,
więc architektura ma je wchłaniać bez przepisywania interfejsu.

## Podział pracy

| Warstwa | Właściciel |
|---|---|
| Architektura, stack, zależności, git, deploy, backend, dane | Claude Code (lead) |
| Silnik rozkroju i wyceny, model danych, szew repozytorium | Claude Code (lead) |
| Kompozycja, typografia, motion, komponenty UI, makiety | **Codex (Ty)** |

Nie dotykasz: `package.json`, lockfile, configów builda, `src/lib/nesting.ts`,
`src/lib/pricing.ts`, `src/lib/repo.ts`. Jeśli silnik czegoś nie zwraca,
czego potrzebujesz w UI, dopisz to do `## Pytania / Ryzyka` w raporcie.

## Architektura, której trzymamy się bezwzględnie

### Wszystko, co klient może zmienić, siedzi w jednym pliku
`src/config/brief.ts` trzyma ceny, progi rabatowe, parametry rozkroju, dane firmy
i przełączniki funkcji. **Żaden komponent nie ma prawa mieć tych wartości na sztywno.**
Poniedziałkowa korekta briefu ma być edycją tego pliku, nie polowaniem po JSX.

Jeśli w makiecie potrzebujesz liczby, która pochodzi od klienta, importuj ją stamtąd.
Jeśli takiej wartości nie ma, dopisz ją do `brief.ts` z komentarzem, skąd pochodzi.

### Treść nie mieszka w komponentach
Copy trafia do plików danych albo do `brief.ts`. **Nie piszesz treści sam** —
teksty dostarcza lead albo user. Jeśli brakuje Ci copy, wstaw wyraźny znacznik
`{/* COPY: potrzebny nagłówek sekcji X */}` i zgłoś to w raporcie.

### Dane chodzą przez szew repozytorium
`src/lib/repo.ts` jest jedynym wejściem do katalogu. Dziś czyta dane zalążkowe,
docelowo Supabase. Interfejs jest async, więc komponenty już teraz mają być
przygotowane na oczekiwanie. Nie importuj `src/data/dekory.ts` bezpośrednio w UI.

### Jeden motyw, jeden akcent, jedna skala promieni
Aplikacja jest jasna. Bez trybu ciemnego, bez przełącznika. Akcent to karmin
`#9F0832` z logotypu i jest jedyny na całej aplikacji. Promienie: powłoka 28,
rdzeń 22, kontrolka 12, elementy klikalne pełna pigułka. Tokeny w `src/app/globals.css`
w bloku `@theme`. Zmiana kierunku wizualnego = edycja tego bloku, nie klas w komponentach.

## Ustalony język wizualny

> **Wiążący kontrakt estetyczny jest w `DESIGN.md` w tym katalogu.**
> Przeczytaj go przed dotknięciem czegokolwiek w UI. Obowiązuje tak samo
> Claude Code, jak i Codexa. Wyjście poza ten język wymaga pisemnej zgody
> właściciela projektu, bo klient zaakceptował już makietę w tym kierunku.


Klient widział już i zaakceptował makietę w tym kierunku, więc to nie jest otwarte pole:

- **Rzeczowy, warsztatowy, bliżej dokumentu technicznego niż startupowego SaaS-a.**
  Odbiorca na co dzień patrzy na płytę wiórową i optymalizator rozkroju.
- Kroje: `Bricolage Grotesque` na nagłówki, `Geist` na interfejs, `Geist Mono` na dane,
  wymiary i ceny. Liczby zawsze `tabular-nums`.
- Neutralne chłodne srebro jako tło, biel jako powierzchnia, karmin wyłącznie
  na akcenty i stany krytyczne.
- Cienie miękkie i podbarwione tłem, nigdy czarne. Karty w podwójnej ramce
  (powłoka + rdzeń), bo tak wygląda cała zaakceptowana makieta.
- **Zero:** gradientowych blobów, stockowych ilustracji, fioletu AI, trzech równych
  kart w rzędzie, myślników em w treści (zero, bez wyjątków), emoji.

Materiał źródłowy: `../mussi-deck.html`, `../mussi-landing.html`. Mają wbudowane
prawdziwe zdjęcia hurtowni i 19 logotypów producentów w base64. Zdjęcia po korekcji
leżą w `../zdjecia/po-korekcji/`.

## Silnik, na którym budujesz UI

```ts
import { policzRozkroj, type Formatka } from "@/lib/nesting";
import { wycenUslugi, podsumujKoszyk, cenaDlaKontrahenta, zloty } from "@/lib/pricing";
import { katalog } from "@/lib/repo";
```

- `policzRozkroj(formatki)` zwraca ułożone sztuki z pozycjami `x`, `y` w milimetrach,
  liczbę arkuszy, wykorzystanie materiału i listę odrzuconych.
  **Do rysowania rozkroju użyj `arkusze[n].sztuki` i przeskaluj do viewBoxu.**
- `wycenUslugi(formatki, grubosc)` liczy cięcie od arkusza i oklejanie od metra.
- `podsumujKoszyk(pozycje, kodProgu, transport)` nalicza rabat progu i VAT.
- Obrzeże w `Formatka` to krotka `[góra, dół, lewa, prawa]` w milimetrach.
  W UI klient klika krawędź, cyklem `brak → 1 mm → 2 mm`. Nigdy nie każ mu wpisywać `1111`.

## Ekrany do zbudowania, w kolejności ważności

1. **Kreator formatek z podglądem rozkroju** — to jest cały pomysł na ten portal.
   Klient dodaje formatki, widzi je ułożone na arkuszu i wycenę na żywo.
2. **Katalog** z ceną kontrahenta, stanem magazynowym i filtrami.
3. **Koszyk i złożenie zamówienia** ze statusem realizacji.
4. **Panel klienta**: historia, szablony powtarzalnych formatek, próg rabatowy.

Zaplecze ERP jest za flagą `funkcje.zaplecze` i **nie wchodzi do poniedziałkowego demo**.

## Jak pracujesz

- Skille: sięgnij po 2 do 4, nie więcej. Sensowny zestaw tutaj to
  `design-taste-frontend` na kierunek, `emil-design-eng` na detal komponentów
  i mikrointerakcje, `high-end-visual-design` na materialność, `apple-design`
  na gesty jeśli robisz coś dotykowego.
- Dowód wizualny: `screenshot` albo `playwright` po każdej większej partii.
- `full-output-enforcement`: żadnych `// reszta bez zmian`.
- Po każdej partii uruchom `npm run typecheck` i `npm test`. Mają przechodzić.
- A11y: WCAG AA. Kontrast tekstu minimum 4.5, focus widoczny, `prefers-reduced-motion`
  respektowany globalnie w `globals.css`.

## Komendy

```bash
npm run dev        # serwer deweloperski
npm test           # 16 testów silnika, muszą przechodzić
npm run typecheck  # tsc --noEmit
npm run build      # build produkcyjny
```

## Czego jeszcze nie ma i czeka na decyzję

- **Supabase nie jest podpięty.** Flaga `funkcje.supabase` jest wyłączona,
  implementacja rzuca celowo. Podpięcie bazy to zadanie leada, nie Twoje.
- **Progi rabatowe są ilustracyjne.** Do ustalenia z klientem w poniedziałek.
- **Ceny usług** przepisane z cennika ze strony hurtowni, do potwierdzenia.
- **Zdjęcia realizacji** noszą znak wodny obcej pracowni. Do wyjaśnienia praw.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
