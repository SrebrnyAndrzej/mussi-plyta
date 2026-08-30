# 002 — Zachowaj łagodny feedback przy ograniczonym ruchu

- **Status**: DONE
- **Commit**: 991c8de
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, około 18 linii

## Problem

Globalna reguła redukuje wszystkie przejścia do `0.01ms`, przez co usuwa również pomocny feedback. Standard wymaga usunięcia ruchu przestrzennego, ale zachowania łagodnego sygnału opacity lub koloru.

```css
/* src/app/globals.css:109 — current */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Target

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }

  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .pressable {
    transform: none !important;
    transition: opacity 120ms var(--ease-out) !important;
  }

  .pressable:active { opacity: 0.82; }
}
```

## Repo conventions to follow

- Token `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` jest w `src/app/globals.css:36`.
- Karuzela ma już osobny fallback reduced-motion w `src/app/globals.css:136` i pozostaje statyczna.

## Steps

1. W `src/app/globals.css` pozostaw globalne wygaszenie animacji i automatyczny scroll.
2. Dodaj wewnątrz tego samego media query wyjątek `.pressable`, który usuwa transformację i daje opacity 120 ms.
3. Dodaj reduced-motion stan aktywny z `opacity: 0.82`.
4. Nie przywracaj przesunięć, skalowania, marquee ani scroll motion.

## Boundaries

- Do NOT zmieniać komponentów React.
- Do NOT zmieniać zachowania karuzeli poza istniejącym fallbackiem.
- Do NOT dodawać zależności.

## Verification

- **Mechanical**: `npm run typecheck && npm run lint && npm test` ma zakończyć się bez błędów.
- **Feel check**: w DevTools włącz `prefers-reduced-motion: reduce`; przyciski nie mogą się poruszać, ale powinny krótko przygasać podczas nacisku.
- Sprawdź `/kreator`, `/katalog`, `/panel`, `/zamowienia` oraz stronę główną.
- **Done when**: wszystkie ruchy przestrzenne są wyłączone, a częste działania nadal mają czytelny, niewestybularny feedback.
