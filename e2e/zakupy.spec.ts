import { expect, test } from "@playwright/test";

test("grupuje braki według dostawcy i tworzy zamówienia robocze", async ({ page }) => {
  await page.goto("/hurtownia/zakupy");

  await expect(page.getByRole("heading", { name: "Zakupy i dostawy" })).toBeVisible();
  await expect(page.getByRole("complementary").getByText("3", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Utwórz zamówienia robocze" }).click();

  await expect(page.getByText("Utworzono 3 robocze zamówienia, po jednym dla każdego dostawcy.")).toBeVisible();
  await expect(page.getByRole("button", { name: /ZD-2026-R01/ })).toBeVisible();
});

test("wysyła zamówienie i zapisuje dostawę częściową", async ({ page }) => {
  await page.goto("/hurtownia/zakupy");
  await page.getByRole("button", { name: "Utwórz zamówienia robocze" }).click();
  await page.getByRole("button", { name: "Wyślij do dostawcy" }).click();

  await expect(page.getByText(/ZD-2026-R01 wysłano do dostawcy/)).toBeVisible();
  await page.getByRole("button", { name: "Przyjęcia" }).click();
  await page.getByRole("button", { name: "Zapisz dostawę częściową" }).click();

  await expect(page.getByText(/Braki pozostają w kolejce/)).toBeVisible();
  await expect(page.getByText("przyjęto 12 kpl", { exact: true })).toBeVisible();
});

test("moduł mieści się na ekranie telefonu", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/hurtownia/zakupy");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBe(0);
  await expect(page.getByRole("button", { name: "Utwórz zamówienia robocze" })).toBeVisible();
});
