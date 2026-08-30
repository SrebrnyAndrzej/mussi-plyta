import { expect, test } from "@playwright/test";
import { zalogujJako } from "./fixtures/sesja";

/**
 * Bramka wystawienia dokumentów.
 *
 * Najdroższa pomyłka w tym module to wypuszczenie faktury podmiotu, który nie ma
 * kompletu danych rejestrowych. Silnik tego pilnuje, ale liczy się, czy pilnuje
 * tego także ekran, na którym siedzi operator.
 */

/* Zaplecze widzą wyłącznie pracownicy hurtowni. */
test.beforeEach(async ({ page }) => {
  await zalogujJako(page, "hurtownia");
});

test("kartoteka nie udaje, że podmioty są gotowe", async ({ page }) => {
  await page.goto("/hurtownia/podmioty");

  await expect(page.getByText("0 z 3 podmiotów ma komplet danych")).toBeVisible();
  await expect(page.getByText("Brak pola: NIP").first()).toBeVisible();
  await expect(page.getByText("po nadaniu serii").first()).toBeVisible();
});

test("uzupełnienie danych odblokowuje podmiot i nadaje numer", async ({ page }) => {
  await page.goto("/hurtownia/podmioty");

  const plyty = page.getByRole("region", { name: "P.H.U. Mussi-Płyta S.C." });
  await expect(plyty.getByText("Braki: 3")).toBeVisible();

  await plyty.getByPlaceholder("10 cyfr").fill("9290000006");
  await plyty.getByPlaceholder("IBAN").fill("PL61109010140000071219812874");
  await plyty.getByPlaceholder("Na przykład FV-P").fill("FV-P");

  await expect(plyty.getByText("Komplet")).toBeVisible();
  await expect(page.getByText("1 z 3 podmiotów ma komplet danych")).toBeVisible();
  await expect(plyty.getByText(`FV-P/0001/${new Date().getFullYear()}`)).toBeVisible();
});

test("niepoprawna suma kontrolna NIP jest wyłapana od razu", async ({ page }) => {
  await page.goto("/hurtownia/podmioty");

  const plyty = page.getByRole("region", { name: "P.H.U. Mussi-Płyta S.C." });
  await plyty.getByPlaceholder("10 cyfr").fill("9290000007");

  await expect(plyty.getByText("NIP ma niepoprawną sumę kontrolną")).toBeVisible();
  await expect(plyty.getByText("Brak pola: NIP")).toBeHidden();
});

test("wystawienie faktur jest zablokowane i mówi, czego brakuje", async ({ page }) => {
  await page.goto("/hurtownia/zamowienia");

  const podzial = page.getByRole("region", { name: "Podział fakturowania" });
  await expect(podzial.getByText("Wystawienie zablokowane")).toBeVisible();
  await expect(podzial.getByRole("button", { name: "Wystaw dokumenty" })).toBeDisabled();

  const blokady = podzial.locator("li", { hasText: "brak danych" });
  await expect(blokady).toHaveCount(3);
  await expect(podzial.getByText(/NIP, Rachunek bankowy, Seria faktur/)).toBeVisible();
});

test("zmiana podmiotu na pozycji zostaje w audycie", async ({ page }) => {
  await page.goto("/hurtownia/zamowienia");

  const podzial = page.getByRole("region", { name: "Podział fakturowania" });
  await expect(podzial.getByText("Brak zmian. Obowiązuje podział sugerowany przez system.")).toBeVisible();

  await podzial.getByLabel("Podmiot wystawiający fakturę: Obrzeża").selectOption("stolarnia");

  const wpis = podzial.locator("li", { hasText: "Obrzeża" }).last();
  await expect(wpis).toContainText("Płyty");
  await expect(wpis).toContainText("Stolarnia");
  await expect(wpis).toContainText("Poprawka błędnej sugestii");
});

test("potwierdzenie zamówienia wychodzi, WZ przed wydaniem nie", async ({ page }) => {
  await page.goto("/hurtownia/zamowienia");

  const pakiet = page.getByRole("region", { name: "Jeden pakiet, jedna wersja" });

  await pakiet.getByRole("button", { name: "Utwórz potwierdzenie" }).click();
  /* Numer pojawia się w wierszu dokumentu i w komunikacie, bierzemy pierwszy. */
  await expect(pakiet.getByText("PZ/M-2026-0848/1").first()).toBeVisible();

  await pakiet.getByRole("button", { name: "Utwórz WZ" }).click();
  await expect(pakiet.getByText("WZ wystawia się dopiero przy wydaniu towaru.")).toBeVisible();
});
