import type { Page } from "@playwright/test";

/**
 * Sesja demonstracyjna wstrzykiwana przed uruchomieniem skryptów strony.
 *
 * `addInitScript` wykonuje się przed kodem aplikacji, więc pierwszy render
 * widzi już zalogowanego użytkownika i test nie łapie migotania bramki.
 */
export async function zalogujJako(page: Page, rola: "klient" | "hurtownia" = "klient") {
  await page.addInitScript(
    ([klucz, wartosc]) => window.localStorage.setItem(klucz, wartosc),
    ["mussi-b2b:sesja:v1", JSON.stringify({ zalogowany: true, rola, nazwa: "Stolarnia Nowak" })] as const,
  );
}
