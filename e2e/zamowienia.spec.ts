import { expect, test } from "@playwright/test";
import { zalogujJako } from "./fixtures/sesja";

/**
 * Okno zmian zamówienia i rezerwacje.
 *
 * Dwie reguły, które przy pomyłce kosztują najwięcej: klient edytujący
 * zamówienie po terminie oraz rezerwacja założona na koszyk bez pokrycia.
 */

/* Panel klienta jest za sesją, kolejka hurtowni ma własną flagę. */
test.beforeEach(async ({ page }) => {
  await zalogujJako(page);
});

test("licznik okna zmian podaje konkretną datę zamknięcia", async ({ page }) => {
  await page.goto("/zamowienia");
  await page.getByRole("button", { name: "Edytuj zamówienie" }).click();

  /* Lista zamówień pokazuje własny, przykładowy licznik, więc zawężamy do sekcji. */
  const okno = page.getByRole("region", { name: "Okno zmian jest otwarte" });
  await expect(okno.getByText(/^\d+ godz\. \d+ min$/)).toBeVisible();
  await expect(okno.getByText(/^do \d+ \p{L}+ \d{2}:\d{2}$/u)).toBeVisible();
});

test("zmiana ilości tworzy nową wersję i zostawia poprzednią w historii", async ({ page }) => {
  await page.goto("/zamowienia");
  await page.getByRole("button", { name: "Edytuj zamówienie" }).click();

  await expect(page.getByText("wersja pierwotna")).toBeVisible();
  await expect(page.getByRole("button", { name: "Zapisz nową wersję" })).toBeDisabled();

  await page.getByLabel("Ilość: Akcesoria i okucia").fill("40");
  await page.getByPlaceholder("Na przykład: klient dołożył pięć prowadnic").fill("Klient dołożył pięć prowadnic");

  const zapisz = page.getByRole("button", { name: "Zapisz nową wersję" });
  await expect(zapisz).toBeEnabled();
  await zapisz.click();

  await expect(page.getByText(/Zapisano wersję 2/)).toBeVisible();
  await expect(page.getByText("Wersja 2", { exact: true })).toBeVisible();
  await expect(page.getByText("wersja pierwotna")).toBeVisible();
});

test("bez powodu zmiany nie da się zapisać wersji", async ({ page }) => {
  await page.goto("/zamowienia");
  await page.getByRole("button", { name: "Edytuj zamówienie" }).click();

  await page.getByLabel("Ilość: Akcesoria i okucia").fill("40");
  await expect(page.getByRole("button", { name: "Zapisz nową wersję" })).toBeDisabled();
});

test("koszyk bez pokrycia nie zakłada rezerwacji na nic", async ({ page }) => {
  await page.goto("/hurtownia/zamowienia");
  await page.getByRole("button", { name: /M-2026-0847/ }).click();

  const rezerwacja = page.getByRole("region", { name: "Rezerwacja magazynowa" });
  await expect(rezerwacja.getByText("Brak pokrycia")).toBeVisible();
  await expect(rezerwacja.getByText(/brakuje 4/)).toBeVisible();
  await expect(rezerwacja.getByText("Stan żadnego indeksu nie został pomniejszony.")).toBeVisible();
});

test("kompletny koszyk dostaje rezerwację z terminem ważności", async ({ page }) => {
  await page.goto("/hurtownia/zamowienia");

  const rezerwacja = page.getByRole("region", { name: "Rezerwacja magazynowa" });
  await expect(rezerwacja.getByText("Rezerwacja miękka")).toBeVisible();
  await expect(rezerwacja.getByText("Miękka rezerwacja wygaśnie bez potwierdzenia zamówienia przez hurtownię.")).toBeVisible();
});
