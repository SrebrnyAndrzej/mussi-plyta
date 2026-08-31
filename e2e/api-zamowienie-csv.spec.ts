import { expect, test } from "@playwright/test";

/**
 * Złożenie zamówienia plikiem CSV.
 *
 * Testy chodzą po samej trasie, bez przeglądarki. Sprawdzają odmowy
 * i to, że nagłówek pliku nie omija uwierzytelnienia. Reguły formatu
 * pokrywają wektory wspólne z implementacją w Swift.
 */

const TRASA = "/api/v1/zamowienia";
const PLIK = "indeks;ilosc\nBLU-CLIP-110;12\n";

test("bez klucza nie da się złożyć zamówienia", async ({ request }) => {
  const odpowiedz = await request.post(TRASA, {
    headers: { "content-type": "text/csv" },
    data: PLIK,
  });
  expect(odpowiedz.status()).toBe(401);
});

test("poprawny plik bez klucza nadal odpada", async ({ request }) => {
  /* Uwierzytelnienie idzie przed czytaniem pliku. Gdyby było odwrotnie,
     dałoby się badać asortyment samymi odpowiedziami o błędach. */
  const odpowiedz = await request.post(TRASA, {
    headers: { "content-type": "text/csv" },
    data: PLIK,
  });
  const tresc = await odpowiedz.json();
  expect(tresc.ok).toBe(false);
  expect(JSON.stringify(tresc)).not.toContain("BLU-CLIP-110");
});

test("zły klucz odpada tak samo jak brak klucza", async ({ request }) => {
  const bez = await request.post(TRASA, { data: PLIK });
  const zly = await request.post(TRASA, {
    headers: { authorization: "Bearer mussi_ffffffff_sekret" },
    data: PLIK,
  });
  expect(bez.status()).toBe(zly.status());
  expect(await bez.json()).toEqual(await zly.json());
});

test("odczyt tej trasy nie istnieje", async ({ request }) => {
  const odpowiedz = await request.get(TRASA);
  expect(odpowiedz.status()).toBe(405);
});
