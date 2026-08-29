import type { Metadata } from "next";
import { Catalog } from "@/components/catalog";
import { copy, kontrahentDemo } from "@/config/brief";
import { katalog } from "@/lib/repo";
import { cenaDlaKontrahenta } from "@/lib/pricing";

export const metadata: Metadata = {
  title: copy.wspolne.katalog,
};

export default async function CatalogPage() {
  const produkty = await katalog.wszystkie();
  const widok = produkty.map((produkt) => ({
    ...produkt,
    cenaKontrahenta: cenaDlaKontrahenta(produkt.cenaKatalogowa, kontrahentDemo.kodProgu),
  }));

  return <Catalog produkty={widok} />;
}
