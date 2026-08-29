# Design QA: Mussi B2B full flow

## Artifacts

- Source visual truth, pulpit: `/Users/mateuszwojciechowski/.codex/generated_images/01a04d7a-f941-73b3-902c-9a10e2055e0f/exec-330a1821-e24b-455b-87f4-78c5d5be530e.png`
- Source visual truth, projekt: `/Users/mateuszwojciechowski/.codex/generated_images/01a04d7a-f941-73b3-902c-9a10e2055e0f/exec-5fbcbf7c-b8a1-4e26-b0dc-3cae8fff2292.png`
- Source visual truth, zamówienia: `/Users/mateuszwojciechowski/.codex/generated_images/01a04d7a-f941-73b3-902c-9a10e2055e0f/exec-0e92454d-aaad-4490-851e-570086bf3ddd.png`
- Implementation screenshots: `design/qa-full-flow/panel-desktop.png`, `design/qa-full-flow/projekty-palmowa-desktop.png`, `design/qa-full-flow/zamowienia-desktop.png`
- Mobile checks: `design/qa-full-flow/panel-mobile.png`, `design/qa-full-flow/projekty-palmowa-mobile.png`, `design/qa-full-flow/zamowienia-mobile.png`
- Combined comparison evidence: `design/qa-full-flow/comparison-panel.png`, `design/qa-full-flow/comparison-project.png`, `design/qa-full-flow/comparison-orders.png`

## Capture normalization

- Intended CSS viewport: 1440 × 1024 px, device pixel ratio 1.
- Source images were normalized into 1440 × 1024 frames.
- Browser implementation captures: 1440 px wide; page heights 1080 px, 1163 px and 1104 px.
- The in-app browser viewport override rendered the nominal CSS viewport at half scale inside its capture surface. For comparison only, the visible 720 px half-scale region was cropped and restored to 1440 px with Lanczos resampling. DOM measurements confirmed a 1440 px CSS viewport and a 1212 px main column beside the 228 px sidebar.
- Comparison state: initial loaded state for each route, light theme, desktop layout.

## Findings

No actionable P0, P1 or P2 differences remain.

- Fonts and typography: Bricolage Grotesque, Geist and Geist Mono match the source hierarchy. Display headings, operational metadata and tabular prices remain distinct and readable.
- Spacing and layout rhythm: sidebar, header, dominant work surface, right rail and dense order table preserve the source proportions. Shell, core and control radii use the established 28 px, 22 px and 12 px scale.
- Colors and visual tokens: paper, white surfaces, black ink and Mussi burgundy map consistently to the source. Warning, success and disabled order states remain distinguishable without replacing the primary brand accent.
- Image quality and asset fidelity: the real scraped Mussi logo is used throughout. The implementation intentionally omits decorative product thumbnails from the generated concept because the current demo has no approved product photography or installed icon system; no fake raster placeholders or handcrafted SVG substitutes were introduced.
- Copy and content: 48-hour edit policy, 5-day target, stock exception, personalized final prices, accessories, documents and private margin calculator are visible in context.
- Accessibility: semantic headings, navigation landmarks, labels, disabled controls, focus ring, reduced-motion support and mobile tap targets are present. No horizontal page overflow was observed in the 390 px checks.

## Focused region evidence

- Pulpit: active-order status block, 48-hour countdown, stock alert, order composition and price rail were compared at matching state.
- Projekt: six-stage workflow, imported XLSX source, suggested-edge override, order value and private margin calculation were compared at matching state.
- Zamówienia: filter bar, operational table, selected order, edit lock and material availability were compared at matching state.

## Interaction verification

- Navigation between `/panel`, `/projekty/palmowa`, `/kreator`, `/katalog` and `/zamowienia`.
- Suggested edge changed to another catalog option.
- Margin slider recalculated the private client price without changing the Mussi order value.
- Project save and submit confirmation states.
- Order filters and search result count.
- Disabled edit action on an order older than 48 hours.
- Editable order note save confirmation.
- Browser console: no errors.

## Comparison history

### Iteration 1

- P2: mobile project action bar covered content. Fix: sticky positioning now starts at the `sm` breakpoint; mobile uses normal document flow.
- P2: order detail did not expose material completeness visible in the source. Fix: added a dedicated availability block with complete and missing percentages.
- P2: dashboard summary omitted document shortcuts and used only the order ID. Fix: restored the full order heading and document/project shortcuts.

### Iteration 2

- Post-fix evidence: refreshed desktop captures and mobile viewport checks.
- No actionable P0, P1 or P2 findings remain.

## Follow-up polish

- P3: add a single approved icon library after the Lead chooses the dependency, then replace numerical navigation markers with source-matched line icons.
- P3: add real product and hardware thumbnails after licensing and catalog asset decisions are confirmed.

final result: passed

---

## Domknięcie P3 przez leada, 29 sierpnia

Oba punkty `Follow-up polish` były zablokowane na decyzjach leada. Decyzje podjęte:

- **Biblioteka ikon: Phosphor** (`@phosphor-icons/react`, waga `regular`).
  Wybrana z listy dozwolonych w skillach designu, ma wagi pasujące do
  technicznego charakteru i jest tree-shakeable. Zestaw jest zamknięty
  i typowany w `src/components/ikona.tsx`. Markery numeryczne `01`–`05`
  oraz `H1`–`H5` w nawigacji zastąpione ikonami.
- **Miniatury produktowe: nie dodajemy.** Hurtownia nie ma fotografii
  poszczególnych dekorów, a stockowe zamienniki albo rysowane imitacje
  byłyby gorsze niż ich brak. Próbki zostają gradientami CSS w polu `probka`.
  Zamiast tego katalog dostał prawdziwe zdjęcie regału z próbkami
  z archiwum hurtowni, z podpisem mówiącym wprost, czym jest.

Obie decyzje zapisane w `DESIGN.md` jako zasady 9 i 10, więc kolejne
sesje nie będą ich podważać.

## Znalezione przy okazji

- **P2, naprawione:** `/katalog` i `/kreator` używały poziomej powłoki,
  a `/panel`, `/zamowienia` i `/projekty` paska bocznego. Chrome zmieniało
  się w trakcie przejścia między ekranami portalu. Sprawdzone, że to nie był
  podział na publiczne i zalogowane, bo wariant poziomy też pokazywał próg
  kontrahenta i wylogowanie. Wszystkie trasy po zalogowaniu dzielą teraz
  `PortalShell`.
