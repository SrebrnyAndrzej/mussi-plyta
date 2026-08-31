import type { Metadata } from "next";
import { SklepAkcesoriow } from "@/components/sklep-akcesoriow";
import { copy, firma, funkcje, kontrahentDemo } from "@/config/brief";
import { kategorieAkcesoriow } from "@/data/akcesoria";
import { bramka } from "@/lib/bramka";
import { cenaDlaKontrahenta } from "@/lib/pricing";
import { katalog } from "@/lib/repo";
import { dostepnoscAkcesorium } from "@/lib/sklep-akcesoriow";

export const metadata: Metadata = {
  title: copy.wspolne.sklep,
  description: `Akcesoria meblowe z magazynu ${firma.nazwa} w Zielonej Górze: okucia, systemy szuflad, oświetlenie, złączki i chemia.`,
};

/**
 * Sklep akcesoriów.
 *
 * Osobna podstrona sprzedażowa, wspólny magazyn i wspólny koszyk. Stan
 * i rezerwacje zostają na serwerze: klient dostaje wyłącznie etykietę
 * dostępności, bo ile mamy na półce i kto to zarezerwował, to nie jego sprawa.
 */
export default async function AkcesoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ kategoria?: string | string[] }>;
}) {
  bramka(funkcje.sklepAkcesoriow);

  const params = await searchParams;
  const zAdresu = Array.isArray(params.kategoria) ? params.kategoria[0] : params.kategoria;
  /* Kategoria z adresu przechodzi przez listę znanych kategorii. Nieznana
     wartość otwiera pełny sklep, zamiast pustej listy bez wyjaśnienia. */
  const kategoriaStartowa =
    kategorieAkcesoriow.find((k) => k.id === zAdresu)?.id ?? null;

  const lista = await katalog.akcesoria();
  const pozycje = lista.map((a) => ({
    ...a,
    cenaKontrahenta: cenaDlaKontrahenta(a.cena, kontrahentDemo.kodProgu),
    dostepnoscSklepu: dostepnoscAkcesorium(a),
  }));

  return <SklepAkcesoriow pozycje={pozycje} kategoriaStartowa={kategoriaStartowa} />;
}
