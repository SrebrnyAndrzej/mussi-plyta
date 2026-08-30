import type { Metadata } from "next";
import { funkcje } from "@/config/brief";
import { bramka } from "@/lib/bramka";
import { WarunkiHandlowe } from "@/components/warunki-handlowe";

export const metadata: Metadata = { title: "Warunki handlowe" };

export default function WarehouseTermsPage() {
  bramka(funkcje.warunkiHandlowe);
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
          Panel operacyjny
        </p>
        <h1 className="text-balance mt-3 font-display text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1] tracking-[-0.045em] text-ink">
          Warunki handlowe kontrahentów
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-mute">
          Progi, ceny indywidualne, limit kupiecki i blokady w jednym miejscu.
          System sprawdza zamówienie zanim biuro je przyjmie, a każda zmiana
          warunków wymaga powodu i zostaje w audycie.
        </p>
      </header>
      <WarunkiHandlowe />
    </main>
  );
}
