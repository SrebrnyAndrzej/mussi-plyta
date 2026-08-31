import type { Metadata } from "next";
import { Cart } from "@/components/cart";
import { copy } from "@/config/brief";
import { katalog } from "@/lib/repo";

export const metadata: Metadata = {
  title: copy.wspolne.koszyk,
  robots: { index: false, follow: false },
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ dodaj?: string | string[] }>;
}) {
  const params = await searchParams;
  const selectedId = Array.isArray(params.dodaj) ? params.dodaj[0] : params.dodaj;
  const products = await katalog.produktyDoKoszyka();

  return <Cart products={products} selectedId={selectedId} />;
}
