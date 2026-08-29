import type { Metadata } from "next";
import { Creator } from "@/components/creator";
import { copy } from "@/config/brief";
import { katalog } from "@/lib/repo";

export const metadata: Metadata = {
  title: copy.wspolne.kreator,
};

export default async function CreatorPage() {
  const dekory = await katalog.wszystkie();
  const opcje = dekory.map(({ id, kod, nazwa }) => ({ id, kod, nazwa }));

  return <Creator dekory={opcje} />;
}
