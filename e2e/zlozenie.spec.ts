import { expect, test } from "@playwright/test";
import { zalogujJako } from "./fixtures/sesja";

/**
 * Złożenie zamówienia, ścieżka od koszyka do potwierdzenia.
 *
 * To jest ta jedna droga, którą klient kupuje. Do niedawna kończyła się
 * ustawieniem flagi, więc test pilnuje, żeby naprawdę przechodziła przez
 * silniki: rezerwację, utworzenie zamówienia i wystawienie potwierdzenia.
 */

test.beforeEach(async ({ page }) => {
  await zalogujJako(page);
});

test("koszyk tworzy zamówienie, rezerwuje towar i wystawia potwierdzenie", async ({ page }) => {
  await page.goto("/koszyk");

  await page.getByRole("button", { name: "Złóż zamówienie" }).click();

  const wynik = page.locator('[aria-live="polite"]').first();
  await expect(wynik).toBeVisible();

  /* Numer zamówienia i numer potwierdzenia muszą do siebie pasować. */
  const tekst = (await wynik.innerText()).replace(/[\s  ]+/g, " ");
  const numer = tekst.match(/M-\d{4}-\d+/)?.[0];
  expect(numer, "zamówienie musi dostać numer").toBeTruthy();
  expect(tekst).toContain(`PZ/${numer}/1`);

  await expect(wynik).toContainText(/Towar zarezerwowany|oczekuje na dostawę|wymaga potwierdzenia/);
  await expect(wynik).toContainText(/\d+,\d\d/);
  await expect(wynik).toContainText(/indeks|indeksy|indeksów/);
});

test("bez zalogowania koszyk w ogóle nie pokazuje przycisku złożenia", async ({ browser }) => {
  const kontekst = await browser.newContext();
  const strona = await kontekst.newPage();

  await strona.goto("/koszyk");
  await expect(strona.getByRole("heading", { name: "Ta część portalu jest dla zalogowanych" })).toBeVisible();
  await expect(strona.getByRole("button", { name: "Złóż zamówienie" })).toBeHidden();

  await kontekst.close();
});
