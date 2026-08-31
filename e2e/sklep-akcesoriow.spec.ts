import { expect, test } from "@playwright/test";
import { zalogujJako } from "./fixtures/sesja";

/**
 * Sklep akcesoriów.
 *
 * Najważniejsze jest przejście ze sklepu do koszyka: sklep zna pozycję po SKU,
 * a koszyk powstał dla płyty i rozpoznaje ją po identyfikatorze dekoru.
 * Jeśli to się rozjedzie, przycisk „dodaj” prowadzi w pustkę.
 */

test.beforeEach(async ({ page }) => {
  await zalogujJako(page);
  await page.goto("/akcesoria");
});

test("sklep pokazuje pełny asortyment, nie garść przykładów", async ({ page }) => {
  const licznik = page.getByText(/z \d+ indeksów/);
  await expect(licznik).toBeVisible();
  const tekst = (await licznik.textContent()) ?? "";
  const ile = Number(tekst.match(/z (\d+) indeksów/)?.[1] ?? 0);
  expect(ile).toBeGreaterThan(50);
});

test("wyszukiwanie po symbolu producenta zawęża do jednej pozycji", async ({ page }) => {
  await page.getByLabel("Szukaj akcesorium").fill("BLU-CLIP-110");
  await expect(page.getByRole("listitem").filter({ hasText: "BLU-CLIP-110" })).toHaveCount(1);
  await expect(page.getByText("Zawias Blum Clip Top 110 stopni")).toBeVisible();
});

test("wyszukiwanie wybacza brak ogonków", async ({ page }) => {
  await page.getByLabel("Szukaj akcesorium").fill("hafele");
  /* Häfele z ogonkiem w danych, hafele bez ogonka w wyszukiwarce. */
  await expect(page.getByText(/Häfele/).first()).toBeVisible();
});

test("kategoria zawęża listę i da się ją wyłączyć", async ({ page }) => {
  const kafelek = page.getByRole("button", { name: /Oświetlenie/ });
  await kafelek.click();
  await expect(kafelek).toHaveAttribute("aria-pressed", "true");

  const poFiltrze = (await page.getByText(/z \d+ indeksów/).textContent()) ?? "";
  expect(Number(poFiltrze.match(/^(\d+)/)?.[1] ?? 0)).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Wyczyść filtry" }).click();
  await expect(kafelek).toHaveAttribute("aria-pressed", "false");
});

test("dodanie ze sklepu trafia do koszyka pod właściwym indeksem", async ({ page }) => {
  await page.getByLabel("Szukaj akcesorium").fill("BLU-CLIP-110");
  await page.getByRole("link", { name: /Zawias Blum Clip Top 110 stopni/ }).click();

  await expect(page).toHaveURL(/\/koszyk\?dodaj=BLU-CLIP-110/);
  await expect(page.getByText("Zawias Blum Clip Top 110 stopni").first()).toBeVisible();
});

test("nic nie pasuje, a sklep mówi o tym wprost zamiast pokazywać pustkę", async ({ page }) => {
  await page.getByLabel("Szukaj akcesorium").fill("czegotakiegoniema");
  await expect(page.getByText(/Nic nie pasuje do tych warunków/)).toBeVisible();
});
