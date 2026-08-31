import { strict as assert } from "node:assert";
import { test } from "node:test";
import { czyTylkoOdczyt, sprawdzKonfiguracje, type Konfiguracja } from "./konfiguracja.ts";
import { policzPartie, przetlumaczWiersze } from "./zrodlo.ts";

function konfiguracja(n: Partial<Konfiguracja> = {}): Konfiguracja {
  return {
    zrodlo: { rodzaj: "plik", sciezka: "./probka.json" },
    zapytanie: "SELECT INDEKS, STAN, REZERWACJE FROM TOWARY",
    kolumny: { sku: "INDEKS", stan: "STAN", rezerwacje: "REZERWACJE" },
    cel: { url: "https://mussi-plyta.vercel.app/api/stany", token: "tajne" },
    coMinut: 15,
    ...n,
  };
}

test("zapytanie musi być samym odczytem", () => {
  assert.equal(czyTylkoOdczyt("SELECT * FROM TOWARY"), true);
  assert.equal(czyTylkoOdczyt("  select a from b  "), true);
  assert.equal(czyTylkoOdczyt("UPDATE TOWARY SET STAN = 0"), false);
  assert.equal(czyTylkoOdczyt("DELETE FROM TOWARY"), false);
});

test("zapisu nie da się przemycić po średniku ani w komentarzu", () => {
  assert.equal(czyTylkoOdczyt("SELECT 1; DROP TABLE TOWARY"), false);
  assert.equal(czyTylkoOdczyt("SELECT 1 /* UPDATE */ FROM T"), true);
  assert.equal(czyTylkoOdczyt("SELECT 1 FROM T -- UPDATE"), true);
});

test("poprawna konfiguracja przechodzi", () => {
  assert.deepEqual(sprawdzKonfiguracje(konfiguracja()), []);
});

test("brak parametrów połączenia jest wyłapany", () => {
  const bledy = sprawdzKonfiguracje(konfiguracja({ zrodlo: { rodzaj: "firebird" } }));
  assert.ok(bledy.some((b) => b.includes("host")));
  assert.ok(bledy.some((b) => b.includes("baza")));
});

test("adres celu musi być https", () => {
  const bledy = sprawdzKonfiguracje(konfiguracja({ cel: { url: "http://localhost/api", token: "t" } }));
  assert.ok(bledy.some((b) => b.includes("https")));
});

test("zapytanie zapisujące jest odrzucane w konfiguracji", () => {
  const bledy = sprawdzKonfiguracje(konfiguracja({ zapytanie: "UPDATE TOWARY SET STAN = 1" }));
  assert.ok(bledy.some((b) => b.includes("SELECT")));
});

test("tłumaczenie wierszy radzi sobie z wielkością liter i liczbą jako tekstem", () => {
  const { pozycje, pominiete } = przetlumaczWiersze(
    [
      { indeks: "A", stan: "12,5", rezerwacje: 2 },
      { INDEKS: "B", STAN: 4, REZERWACJE: "0" },
    ],
    { sku: "INDEKS", stan: "STAN", rezerwacje: "REZERWACJE" },
  );
  assert.equal(pominiete.length, 0);
  assert.deepEqual(pozycje, [
    { sku: "A", stan: 12.5, rezerwacje: 2 },
    { sku: "B", stan: 4, rezerwacje: 0 },
  ]);
});

test("wiersz bez indeksu jest zgłaszany, nie pomijany po cichu", () => {
  const { pozycje, pominiete } = przetlumaczWiersze(
    [{ INDEKS: "", STAN: 1, REZERWACJE: 0 }, { INDEKS: "A", STAN: "nie liczba", REZERWACJE: 0 }],
    { sku: "INDEKS", stan: "STAN", rezerwacje: "REZERWACJE" },
  );
  assert.equal(pozycje.length, 0);
  assert.equal(pominiete.length, 2);
});

test("ta sama treść daje tę samą partię, inna daje inną", () => {
  const a = [{ sku: "A", stan: 1, rezerwacje: 0 }, { sku: "B", stan: 2, rezerwacje: 0 }];
  const b = [{ sku: "B", stan: 2, rezerwacje: 0 }, { sku: "A", stan: 1, rezerwacje: 0 }];
  const c = [{ sku: "A", stan: 9, rezerwacje: 0 }, { sku: "B", stan: 2, rezerwacje: 0 }];

  assert.equal(policzPartie(a), policzPartie(b), "kolejność wierszy nie może zmieniać partii");
  assert.notEqual(policzPartie(a), policzPartie(c), "zmiana stanu musi zmienić partię");
});
