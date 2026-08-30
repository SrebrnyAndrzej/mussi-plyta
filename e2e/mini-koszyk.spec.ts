import { expect, test } from "@playwright/test";

/**
 * Stały koszyk z podglądem zawartości.
 *
 * Sens tej funkcji to sprawdzenie pozycji i kwoty bez opuszczania ekranu,
 * więc testujemy dokładnie to: że panel otwiera się w miejscu, pokazuje
 * prawdziwą zawartość i zamyka się tak, jak każdy panel powinien.
 */

/* Po dostępnej nazwie, a nie po atrybutach: te ma też przycisk narzędzi Next.js. */
const NAZWA_KOSZYKA = /^Koszyk, /;

/**
 * Formatowanie walutowe wstawia twarde i wąskie spacje, także jako separator
 * tysięcy. Bez ujednolicenia porównania wywracają się na niewidocznym znaku.
 */
const znormalizuj = (tekst: string) => tekst.replace(/[\s\u00a0\u202f]+/g, " ");

test("towarzyszy klientowi na ekranach portalu, ale nie na stronie koszyka", async ({ page }) => {
  await page.goto("/katalog");
  await expect(page.getByRole("button", { name: NAZWA_KOSZYKA })).toBeVisible();

  await page.goto("/panel");
  await expect(page.getByRole("button", { name: NAZWA_KOSZYKA })).toBeVisible();

  await page.goto("/koszyk");
  await expect(page.getByRole("button", { name: NAZWA_KOSZYKA })).toBeHidden();
});

test("pusty koszyk nie obiecuje pozycji, których nie ma", async ({ page }) => {
  await page.goto("/katalog");
  const etykieta = await page.getByRole("button", { name: NAZWA_KOSZYKA }).getAttribute("aria-label");
  expect(znormalizuj(etykieta ?? "")).toContain("0 pozycji, 0,00 zł brutto");

  await page.getByRole("button", { name: NAZWA_KOSZYKA }).click();
  await expect(page.getByRole("dialog", { name: "Podgląd koszyka" })).toContainText("Koszyk jest pusty");
});

test("po napełnieniu koszyka podgląd pokazuje pozycje i kwoty ze strony koszyka", async ({ page }) => {
  /* Strona koszyka zapisuje stan w przeglądarce, podgląd czyta ten sam zapis.
     Zapis dzieje się po hydratacji, więc czekamy na niego, a nie na czas. */
  await page.goto("/koszyk");
  await page.waitForFunction(
    () => window.localStorage.getItem("mussi-b2b:cart-lines:v1") !== null,
  );
  const stronaKoszyka = await page.locator("main").innerText();

  await page.goto("/panel");
  await page.getByRole("button", { name: NAZWA_KOSZYKA }).click();
  const panel = page.getByRole("dialog", { name: "Podgląd koszyka" });

  await expect(panel).toContainText("Dąb Craft Złoty");
  await expect(panel).toContainText("5 pozycji");

  const netto = znormalizuj(await panel.innerText()).match(/Netto ([\d ]+,\d\d) zł/)?.[1];
  expect(netto, "podgląd musi podawać wartość netto").toBeTruthy();
  expect(znormalizuj(stronaKoszyka)).toContain(netto!);
});

test("panel zamyka się klawiszem Escape i oddaje fokus przyciskowi", async ({ page }) => {
  await page.goto("/katalog");
  const przycisk = page.getByRole("button", { name: NAZWA_KOSZYKA });

  await przycisk.click();
  await expect(page.getByRole("dialog", { name: "Podgląd koszyka" })).toBeVisible();
  await expect(przycisk).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Podgląd koszyka" })).toBeHidden();
  await expect(przycisk).toHaveAttribute("aria-expanded", "false");
  await expect(przycisk).toBeFocused();
});

test("kliknięcie poza panelem go zamyka", async ({ page }) => {
  await page.goto("/katalog");
  await page.getByRole("button", { name: NAZWA_KOSZYKA }).click();
  await expect(page.getByRole("dialog", { name: "Podgląd koszyka" })).toBeVisible();

  await page.locator("h1").first().click({ force: true });
  await expect(page.getByRole("dialog", { name: "Podgląd koszyka" })).toBeHidden();
});

test("działa na szerokości telefonu i nie wypycha strony w bok", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/katalog");

  await page.getByRole("button", { name: NAZWA_KOSZYKA }).click();
  const panel = page.getByRole("dialog", { name: "Podgląd koszyka" });
  await expect(panel).toBeVisible();

  const ramka = await panel.boundingBox();
  expect(ramka!.x).toBeGreaterThanOrEqual(0);
  expect(ramka!.x + ramka!.width).toBeLessThanOrEqual(375);

  const przewijanie = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(przewijanie).toBe(0);
});
