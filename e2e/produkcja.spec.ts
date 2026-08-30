import { expect, test } from "@playwright/test";
import { zalogujJako } from "./fixtures/sesja";

/**
 * Kolejka produkcji.
 *
 * Reguła następstwa etapów pilnuje, żeby nie dało się okleić formatki,
 * której nie wycięto. To jedyne miejsce, gdzie kolejność ma fizyczny sens.
 */

/* Zaplecze widzą wyłącznie pracownicy hurtowni. */
test.beforeEach(async ({ page }) => {
  await zalogujJako(page, "hurtownia");
});

test("kolejka stawia zaległe zlecenie przed spokojnymi", async ({ page }) => {
  await page.goto("/hurtownia/produkcja");

  const zlecenia = page.getByRole("button").filter({ hasText: /M-2026-\d+/ });
  await expect(zlecenia.first()).toContainText("M-2026-0835");
  await expect(zlecenia.first()).toContainText("po terminie");
  await expect(zlecenia.last()).toContainText("M-2026-0839");
  await expect(zlecenia.last()).toContainText("zakończone");
});

test("etapu nie da się zacząć przed zamknięciem poprzedniego", async ({ page }) => {
  await page.goto("/hurtownia/produkcja");

  const kompletacja = page.getByRole("listitem").filter({ hasText: "Kompletacja" });
  await kompletacja.getByRole("button", { name: "Zamknij" }).click();

  await expect(page.getByText("Najpierw trzeba zamknąć etap „Oklejanie”.")).toBeVisible();
});

test("okno odbioru przyjmuje zamówienie i można je odwołać", async ({ page }) => {
  await page.goto("/hurtownia/produkcja");

  const wolne = page.getByRole("listitem").filter({ hasText: "10:00 do 12:00" }).first();
  await wolne.getByRole("button", { name: "Zapisz" }).click();

  await expect(wolne.getByRole("button", { name: "Odwołaj" })).toBeVisible();
  await wolne.getByRole("button", { name: "Odwołaj" }).click();
  await expect(wolne.getByRole("button", { name: "Zapisz" })).toBeVisible();
});

test("okno zajęte przez inne zamówienie ma mniej miejsc", async ({ page }) => {
  await page.goto("/hurtownia/produkcja");

  const zajete = page.getByRole("listitem").filter({ hasText: "08:00 do 10:00" }).first();
  await expect(zajete).toContainText("1 z 2 wolne");
  await expect(zajete).toContainText("zajęte przez M-2026-0839");
});
