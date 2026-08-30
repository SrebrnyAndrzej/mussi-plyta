# 003 — Uprość hover logotypów producentów

- **Status**: DONE
- **Commit**: 991c8de
- **Severity**: MEDIUM
- **Category**: Easing, duration and accessibility
- **Estimated scope**: 2 files, około 20 linii

## Problem

Logotypy mają 500 ms, animują filtr `grayscale` oraz nie ograniczają hover do precyzyjnego wskaźnika. To zbyt długo dla częstej interakcji i powoduje kosztowne malowanie.

```tsx
/* src/components/marketing-home.tsx:143 — current */
className="h-[22px] w-auto shrink-0 opacity-[0.62] grayscale transition duration-500 ease-[var(--ease-fluid)] hover:opacity-100 hover:grayscale-0 sm:h-[26px]"
```

## Target

```tsx
className="logo-producenta h-[22px] w-auto shrink-0 opacity-[0.62] grayscale sm:h-[26px]"
```

```css
.logo-producenta {
  transition: opacity 180ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .logo-producenta:hover {
    opacity: 1;
    filter: grayscale(0);
  }
}
```

Filtr zmienia się natychmiastowo; jedynym animowanym parametrem jest `opacity`.

## Repo conventions to follow

- Media query dla precyzyjnego hover istnieje w `src/app/globals.css:102`.
- Użyj istniejącego `--ease-out` i czasu 180 ms dla hover.

## Steps

1. W `src/components/marketing-home.tsx` zastąp zestaw klas transition klasą `logo-producenta`, zachowując rozmiary, opacity i grayscale.
2. W `src/app/globals.css` dodaj transition opacity 180 ms.
3. W istniejącym media query `(hover: hover) and (pointer: fine)` dodaj stan hover; filtr nie może mieć transition.
4. Upewnij się, że dotyk nie utrwala przypadkowego hover.

## Boundaries

- Do NOT zmieniać obrazów, kolejności marek ani mechaniki marquee.
- Do NOT dodawać zależności.
- Do NOT animować `filter`, `box-shadow` ani layoutu.

## Verification

- **Mechanical**: `npm run typecheck && npm run lint && npm test` ma zakończyć się bez błędów.
- **Feel check**: na desktopie hover ma być szybki i spokojny; na urządzeniu dotykowym brak trwałego hover.
- W DevTools przy 10% szybkości opacity powinno dojść do 1 bez animowania filtra.
- Włącz reduced-motion i potwierdź brak przejścia ruchowego.
- **Done when**: nie istnieje `duration-500`, `transition` bez określonej właściwości ani `hover:grayscale-0` na logotypach.
