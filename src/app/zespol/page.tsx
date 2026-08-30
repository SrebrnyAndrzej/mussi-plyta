import type { Metadata } from "next";
import { funkcje } from "@/config/brief";
import { bramka } from "@/lib/bramka";
import { ZespolStolarni } from "@/components/zespol-stolarni";

export const metadata: Metadata = { title: "Zespół firmy" };

export default function TeamPage() {
  bramka(funkcje.organizacjaIRole);
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
          Konto firmy
        </p>
        <h1 className="text-balance mt-3 font-display text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1] tracking-[-0.045em] text-ink">
          Zespół i limity zamówień
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-mute">
          W jednej stolarni zamawia zwykle więcej niż jedna osoba. Tutaj ustalasz,
          kto kupuje w imieniu firmy i do jakiej kwoty bez pytania właściciela.
        </p>
      </header>
      <ZespolStolarni />
    </main>
  );
}
