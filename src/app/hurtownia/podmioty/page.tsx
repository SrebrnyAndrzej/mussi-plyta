import type { Metadata } from "next";
import { KartotekaPodmiotow } from "@/components/kartoteka-podmiotow";

export const metadata: Metadata = { title: "Podmioty fakturujące" };

export default function WarehouseEntitiesPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
          Dokumenty sprzedaży
        </p>
        <h1 className="text-balance mt-3 font-display text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1] tracking-[-0.045em] text-ink">
          Kartoteka podmiotów fakturujących
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-mute">
          Jedno zamówienie może wygenerować dokumenty od trzech podmiotów. Każdy z nich
          potrzebuje własnej nazwy prawnej, NIP-u, rachunku i serii numeracji. Dopóki
          którykolwiek podmiot ma braki, panel blokuje wystawienie jego dokumentu.
        </p>
      </header>
      <KartotekaPodmiotow />
    </main>
  );
}
