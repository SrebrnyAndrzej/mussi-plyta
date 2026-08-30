import { expect, test } from "@playwright/test";

test("filtruje wyjątki według obszaru", async ({ page }) => {
  await page.goto("/hurtownia/wyjatki");

  await page.getByRole("combobox", { name: "Filtruj według obszaru" }).selectOption("Integracja");

  await expect(page.getByRole("button", { name: /WX-1045 Pilne/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /WX-1048 Krytyczne/ })).toBeHidden();
  await expect(page.getByText("1 sprawa", { exact: true })).toBeVisible();
});

test("wymaga właściciela i opisu rozwiązania przed zamknięciem", async ({ page }) => {
  await page.goto("/hurtownia/wyjatki");
  await page.getByRole("button", { name: /WX-1046 Pilne/ }).click();
  await page.getByRole("button", { name: "Przejmij tę sprawę" }).click();
  await page.getByRole("combobox", { name: "Status" }).selectOption("Zamknięte");
  await page.getByRole("button", { name: "Zapisz decyzję" }).click();

  await expect(page.getByText(/Przy zamknięciu wpisz rozwiązanie/)).toBeVisible();

  await page.getByRole("textbox", { name: "Notatka lub rozwiązanie" }).fill("Rezerwacja przedłużona po potwierdzeniu terminu z klientem.");
  await page.getByRole("button", { name: "Zapisz decyzję" }).click();

  await expect(page.getByText(/WX-1046 zamknięto i zapisano/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Podsumowanie wyjątków" })).toContainText("Otwarte sprawy6");
  await expect(page.getByRole("region", { name: "Podsumowanie wyjątków" })).toContainText("Bez właściciela0");
});

test("centrum wyjątków mieści się na ekranie telefonu", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/hurtownia/wyjatki");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBe(0);
  await expect(page.getByRole("button", { name: /WX-1048 Krytyczne/ })).toBeVisible();
});
