import { expect, test } from "@playwright/test";

/**
 * API cennika dla aplikacji kontrahenta.
 *
 * Testy chodzą po samej trasie, bez przeglądarki, bo tak korzysta z niej
 * cudze oprogramowanie. Sprawdzają wyłącznie odmowy, bo one muszą działać
 * przy każdej konfiguracji. Wycena jest pokryta testami jednostkowymi.
 */

const TRASA = "/api/v1/cennik";

test("bez nagłówka nie ma cennika", async ({ request }) => {
  const odpowiedz = await request.get(TRASA);
  expect(odpowiedz.status()).toBe(401);
  expect(await odpowiedz.json()).toMatchObject({ ok: false });
});

test("klucz w złym formacie odpada tak samo jak brak klucza", async ({ request }) => {
  const odpowiedz = await request.get(TRASA, {
    headers: { authorization: "Bearer cokolwiek" },
  });
  expect(odpowiedz.status()).toBe(401);
});

test("odmowa nie zdradza, czy taki klucz istnieje", async ({ request }) => {
  /* Nieznany identyfikator i zły sekret muszą dać identyczną odpowiedź,
     inaczej dałoby się po niej wyszukiwać istniejące klucze. */
  const nieznany = await request.get(TRASA, {
    headers: { authorization: "Bearer mussi_ffffffff_sekret" },
  });
  const zly = await request.get(TRASA, {
    headers: { authorization: "Bearer mussi_a6e59a66_zlysekret" },
  });

  expect(nieznany.status()).toBe(zly.status());
  expect(await nieznany.json()).toEqual(await zly.json());
});

test("odmowa niesie nagłówek WWW-Authenticate", async ({ request }) => {
  const odpowiedz = await request.get(TRASA);
  expect(odpowiedz.headers()["www-authenticate"]).toContain("Bearer");
});
