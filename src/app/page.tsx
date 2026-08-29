import { MarketingHome } from "@/components/marketing-home";
import { kontrahentDemo } from "@/config/brief";
import { cenaDlaKontrahenta } from "@/lib/pricing";
import { katalog } from "@/lib/repo";

export default async function Home() {
  const produkty = (await katalog.wszystkie())
    .filter(({ kategoria }) => kategoria !== "obrzeze" && kategoria !== "akcesorium")
    .slice(0, 8)
    .map((produkt) => ({
      ...produkt,
      cenaKontrahenta: cenaDlaKontrahenta(produkt.cenaKatalogowa, kontrahentDemo.kodProgu),
    }));

  return <MarketingHome produkty={produkty} />;
}
