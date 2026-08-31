import { expect, test } from "@playwright/test";
import { zalogujJako } from "./fixtures/sesja";

/**
 * Promocje: baner na stronie głównej i zarządzanie w panelu hurtowni.
 *
 * Miejsce w hero zajmowała wcześniej makieta rozkroju. Test pilnuje,
 * że hurtownia realnie steruje tym, co widzi tam klient.
 */

test("strona główna pokazuje baner promocyjny zamiast makiety rozkroju", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Zawiasy Blum taniej o 25%")).toBeVisible();
  await expect(page.getByText("-25%").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Zobacz ofertę/ })).toBeVisible();

  /* Makieta rozkroju zniknęła z tego miejsca. */
  await expect(page.getByText("Arkusz 01")).toBeHidden();
});

test("promocja zaplanowana na przyszłość nie trafia na stronę", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Obrzeża Hranipex, wiosenna wyprzedaż")).toBeHidden();
});

test("hurtownia publikuje baner, a walidacja nie wpuszcza pustego", async ({ page }) => {
  await zalogujJako(page, "hurtownia");
  await page.goto("/hurtownia/promocje");

  const publikuj = page.getByRole("button", { name: "Opublikuj baner" });
  await expect(publikuj).toBeDisabled();

  await page.getByLabel("Hasło").fill("Prowadnice Amix taniej o 15%");
  await page.getByLabel("Warunek").fill("Seria SB System Box przy zamówieniu od 20 kompletów.");
  await page.getByLabel("Etykieta").fill("-15%");

  await expect(publikuj).toBeEnabled();
  await publikuj.click();

  await expect(page.getByText(/Dodano promocję/)).toBeVisible();
  /* Nowy baner ląduje na liście, a nie tylko w komunikacie. */
  await expect(page.locator("li", { hasText: "Prowadnice Amix taniej o 15%" })).toBeVisible();
});

test("wyłączenie baneru zdejmuje go ze strony głównej", async ({ page }) => {
  await zalogujJako(page, "hurtownia");
  await page.goto("/hurtownia/promocje");

  const wiersz = page.locator("li", { hasText: "Zawiasy Blum taniej o 25%" });
  await expect(wiersz.getByText("na stronie")).toBeVisible();
  await wiersz.getByRole("button", { name: "Wyłącz" }).click();
  await expect(wiersz.getByText("wyłączona")).toBeVisible();
});
