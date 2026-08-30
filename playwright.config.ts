import { defineConfig, devices } from "@playwright/test";

/**
 * Testy przeglądarkowe ścieżek krytycznych.
 *
 * Vitest sprawdza silniki w `src/lib`. Tutaj sprawdzamy reguły, które najbardziej
 * bolą przy pomyłce, od strony użytkownika: bramkę wystawienia dokumentów,
 * okno zmian zamówienia, rezerwację cały koszyk albo nic i następstwo etapów.
 *
 * Selektory idą przez role i etykiety, a nie przez klasy czy `data-testid`.
 * Dzięki temu test przewraca się, gdy ekran przestaje być dostępny dla czytnika,
 * i nie wymaga dokładania atrybutów do komponentów, nad którymi pracuje Codex.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
