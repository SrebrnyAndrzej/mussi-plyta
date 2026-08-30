# 001 — Ogranicz feedback przycisków do transformacji

- **Status**: DONE
- **Commit**: 991c8de
- **Severity**: HIGH
- **Category**: Performance, purpose and frequency
- **Estimated scope**: 3 files, około 20 linii

## Problem

Globalny wzorzec używany na większości przycisków animuje także właściwości wymagające malowania. Przy interakcjach wykonywanych dziesiątki razy dziennie pogarsza to responsywność i łamie zasadę animowania tylko `transform` i `opacity`.

```css
/* src/app/globals.css:90 — current */
.pressable {
  transition:
    transform 150ms var(--ease-out),
    background-color 180ms var(--ease-out),
    color 180ms var(--ease-out),
    box-shadow 180ms var(--ease-out);
}
```

Edytor obrzeży używa innej krzywej niż pozostałe przyciski:

```tsx
/* src/components/creator.tsx:142 — current */
className={`absolute ${position} group rounded-full transition-transform duration-150 ease-[var(--ease-fluid)] active:scale-[0.97] focus-visible:z-10`}
```

Wiersz zamówienia animuje kolor tła przy częstym wyborze:

```tsx
/* src/components/orders-center.tsx:67 — current */
className={`grid ... transition-colors ...`}
```

## Target

```css
.pressable {
  transition: transform 150ms var(--ease-out);
}

.pressable:active {
  transform: scale(0.975);
}
```

Edytor krawędzi ma używać `ease-[var(--ease-out)]`, a wiersze zamówień nie mają mieć `transition-colors`. Zmiana stanu może następować natychmiast; jedynym ruchem częstej interakcji jest feedback naciśnięcia.

## Repo conventions to follow

- Krzywa UI istnieje jako `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` w `src/app/globals.css:36`.
- Poprawny czas dla feedbacku przycisku to 150 ms, już użyty w `src/app/globals.css:92`.
- Nie dodawaj nowego tokenu i nie używaj `transition: all`.

## Steps

1. W `src/app/globals.css` pozostaw w `.pressable` wyłącznie `transform 150ms var(--ease-out)`.
2. W `src/components/creator.tsx` zamień `--ease-fluid` na `--ease-out` w przyciskach krawędzi.
3. W `src/components/orders-center.tsx` usuń `transition-colors` z przycisków listy zamówień.
4. Sprawdź, czy stany hover i selected nadal zmieniają się natychmiastowo oraz czy press feedback pozostaje widoczny.

## Boundaries

- Do NOT zmieniać markup ani logiki interakcji.
- Do NOT dotykać `src/lib/nesting.ts`, `src/lib/pricing.ts` ani `src/lib/repo.ts`.
- Do NOT dodawać zależności.
- Jeśli cytowane klasy nie istnieją, STOP i zgłoś drift.

## Verification

- **Mechanical**: `npm run typecheck && npm run lint && npm test` ma zakończyć się bez błędów.
- **Feel check**: naciśnij wielokrotnie krawędź, filtr katalogu i wiersz zamówienia. Reakcja ma być natychmiastowa, bez miękkiego dopływania cienia lub tła.
- W DevTools ustaw 10% szybkości i potwierdź, że przycisk skaluje się subtelnie do około 97,5%, bez animacji cienia.
- Włącz `prefers-reduced-motion` i potwierdź zachowanie z planu 002.
- **Done when**: żaden częsty przycisk nie animuje `background-color`, `color` ani `box-shadow` przez `.pressable`.
