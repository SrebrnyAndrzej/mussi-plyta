import type { Metadata } from "next";
import { funkcje } from "@/config/brief";
import { bramka } from "@/lib/bramka";
import { KolejkaProdukcji } from "@/components/kolejka-produkcji";

export const metadata: Metadata = { title: "Produkcja i odbiory" };

export default function WarehouseProductionPage() {
  bramka(funkcje.kolejkaProdukcji);
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
          Panel operacyjny
        </p>
        <h1 className="text-balance mt-3 font-display text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1] tracking-[-0.045em] text-ink">
          Kolejka produkcji i plan odbiorów
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-mute">
          Cięcie, oklejanie i kompletacja w jednej kolejce, ułożonej od tego,
          co się pali. Do tego okna odbioru na rampie i podgląd spiętrzenia terminów.
        </p>
      </header>
      <KolejkaProdukcji />
    </main>
  );
}
