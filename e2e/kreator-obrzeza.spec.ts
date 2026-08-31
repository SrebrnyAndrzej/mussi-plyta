import { expect, test } from "@playwright/test";
import { zalogujJako } from "./fixtures/sesja";

/**
 * Obrzeże w kreatorze rozkroju.
 *
 * Dwie rzeczy, które nie działały. Import czytał pojedynczą wartość jako
 * obrzeże na jednej krawędzi zamiast dookoła, a formatki na rozkroju nie dało
 * się kliknąć, żeby to poprawić.
 */

const PLIK = "/tmp/formatki-e2e.csv";

test.beforeEach(async ({ page }) => {
  await zalogujJako(page);
});

async function wgrajPlik(page: import("@playwright/test").Page, tresc: string) {
  await page.goto("/kreator");
  await page.setInputFiles('input[type="file"]', {
    name: "formatki.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(tresc, "utf8"),
  });
  await page.getByRole("button", { name: /Dodaj do rozkroju/ }).click();
  await expect(page.locator('g[role="button"]').first()).toBeVisible({ timeout: 10_000 });
}

test("pojedyncza wartość w pliku okleja cztery krawędzie, nie jedną", async ({ page }) => {
  await wgrajPlik(
    page,
    "lp;dekor;dlugosc;szerokosc;sztuk;sloje;obrzeze\n1;5981 bs;800;450;1;;2\n",
  );

  const etykieta = await page.locator('g[role="button"]').first().getAttribute("aria-label");
  /* Cztery niezerowe krawędzie. Przed poprawką było 0-0-0-1. */
  expect(etykieta).toMatch(/obrzeże [1-9]-[1-9]-[1-9]-[1-9]/);
});

test("maska czterech cyfr zostaje bez zmian", async ({ page }) => {
  await wgrajPlik(
    page,
    "lp;dekor;dlugosc;szerokosc;sztuk;sloje;obrzeze\n1;5981 bs;800;450;1;;1010\n",
  );

  const etykieta = await page.locator('g[role="button"]').first().getAttribute("aria-label");
  expect(etykieta).toContain("obrzeże 1-0-1-0");
});

test("formatkę na rozkroju da się kliknąć i zmienić jej obrzeże", async ({ page }) => {
  await wgrajPlik(
    page,
    "lp;dekor;dlugosc;szerokosc;sztuk;sloje;obrzeze\n1;5981 bs;800;450;1;;1111\n",
  );

  const formatka = page.locator('g[role="button"]').first();
  await formatka.click();

  await expect(page.getByRole("button", { name: "Zdejmij obrzeże" })).toBeVisible();
  await page.getByRole("button", { name: "Zdejmij obrzeże" }).click();

  await expect
    .poll(async () => page.locator('g[role="button"]').first().getAttribute("aria-label"))
    .toContain("obrzeże 0-0-0-0");
});

test("skrót dookoła ustawia wszystkie cztery krawędzie", async ({ page }) => {
  await wgrajPlik(
    page,
    "lp;dekor;dlugosc;szerokosc;sztuk;sloje;obrzeze\n1;5981 bs;800;450;1;;0\n",
  );

  const formatka = page.locator('g[role="button"]').first();
  await expect(formatka).toHaveAttribute("aria-label", /obrzeże 0-0-0-0/);

  await formatka.click();
  await page.getByRole("button", { name: "Dookoła 1 mm" }).click();

  await expect
    .poll(async () => page.locator('g[role="button"]').first().getAttribute("aria-label"))
    .toContain("obrzeże 1-1-1-1");
});
