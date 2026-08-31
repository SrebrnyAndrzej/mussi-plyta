import { MarketingHome } from "@/components/marketing-home";
import { kontrahentDemo } from "@/config/brief";
import { kategorieAkcesoriow } from "@/data/akcesoria";
import { cenaDlaKontrahenta } from "@/lib/pricing";
import { katalog } from "@/lib/repo";
import { policzWKategoriach, producenci } from "@/lib/sklep-akcesoriow";

export default async function Home() {
  const produkty = (await katalog.wszystkie())
    .filter(({ kategoria }) => kategoria !== "obrzeze" && kategoria !== "akcesorium")
    .slice(0, 8)
    .map((produkt) => ({
      ...produkt,
      cenaKontrahenta: cenaDlaKontrahenta(produkt.cenaKatalogowa, kontrahentDemo.kodProgu),
    }));

  /* Liczby w zapowiedzi sklepu biorą się z asortymentu, nie z tekstu.
     Dojdzie nowa kategoria albo producent, sekcja zmieni się sama. */
  const asortyment = await katalog.akcesoria();
  const wKategoriach = policzWKategoriach(asortyment);
  const sklep = {
    indeksow: asortyment.length,
    marek: producenci(asortyment).length,
    kategorie: kategorieAkcesoriow
      .map((k) => ({ id: k.id, nazwa: k.nazwa, ile: wKategoriach[k.id] ?? 0 }))
      .filter((k) => k.ile > 0),
  };

  return <MarketingHome produkty={produkty} sklep={sklep} />;
}
