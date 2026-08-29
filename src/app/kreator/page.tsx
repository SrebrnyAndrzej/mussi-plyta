import type { Metadata } from "next";
import { Creator } from "@/components/creator";
import { copy } from "@/config/brief";
import { katalog } from "@/lib/repo";

export const metadata: Metadata = {
  title: copy.wspolne.kreator,
};

export default async function CreatorPage({
  searchParams,
}: {
  searchParams: Promise<{ material?: string | string[] }>;
}) {
  const query = await searchParams;
  const requestedMaterial = Array.isArray(query.material) ? query.material[0] : query.material;
  const produkty = await katalog.wszystkie();
  const materialy = produkty
    .filter(({ kategoria }) => kategoria !== "obrzeze" && kategoria !== "akcesorium")
    .map(({ id, kod, nazwa, producent, opis, dostepnosc, probka }) => ({
      id,
      kod,
      nazwa,
      producent,
      opis,
      dostepnosc,
      probka,
    }));
  const obrzeza = produkty
    .filter(({ kategoria }) => kategoria === "obrzeze")
    .map(({ id, kod, nazwa, producent, opis, grubosciMm, dostepnosc, probka }) => ({
      id,
      kod,
      nazwa,
      producent,
      opis,
      grubosciMm,
      dostepnosc,
      probka,
    }));

  return <Creator materialy={materialy} obrzeza={obrzeza} initialMaterialId={requestedMaterial} />;
}
