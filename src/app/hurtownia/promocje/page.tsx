import type { Metadata } from "next";
import { funkcje } from "@/config/brief";
import { bramka } from "@/lib/bramka";
import { PromocjeHurtowni } from "@/components/promocje-hurtowni";

export const metadata: Metadata = { title: "Promocje i reklamy" };

export default function WarehousePromotionsPage() {
  bramka(funkcje.promocje);
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
          Panel operacyjny
        </p>
        <h1 className="text-balance mt-3 font-display text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1] tracking-[-0.045em] text-ink">
          Promocje i reklamy
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-mute">
          Banery z tego panelu wyświetlają się na stronie głównej, w miejscu obok
          nagłówka. Kolejność ustala, co klient zobaczy jako pierwsze, a terminy
          decydują, kiedy oferta pojawia się i znika bez niczyjej pamięci.
        </p>
      </header>
      <PromocjeHurtowni />
    </main>
  );
}
