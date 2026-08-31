import { utworzKlucz, type Zakres } from "../src/lib/klucze-api";

/**
 * Wydanie klucza API kontrahentowi.
 *
 * Użycie:
 *   npm run klucz-api -- K-00128
 *
 * Sekret pokazuje się jeden raz. U nas zostaje wyłącznie jego skrót,
 * więc zgubionego klucza nie da się odzyskać, tylko wydać nowy.
 */

const kontrahent = process.argv[2];
if (!kontrahent) {
  console.error("Podaj identyfikator kontrahenta, na przykład: npm run klucz-api -- K-00128");
  process.exit(1);
}

const zakresy = (process.argv[3]?.split(",") ?? ["cennik"]) as Zakres[];
const { doPrzekazania, wpis } = utworzKlucz(kontrahent, zakresy);

console.log("\nDo przekazania kontrahentowi (pokazywane jeden raz):\n");
console.log(`  ${doPrzekazania}\n`);
console.log("Do dopisania w KLUCZE_API po stronie serwera:\n");
console.log(`  ${JSON.stringify(wpis)}\n`);
