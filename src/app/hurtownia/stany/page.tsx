import type { Metadata } from "next";
import { WarehouseInventoryScreen } from "@/components/warehouse-screens";
import { MagazynReczny } from "@/components/magazyn-reczny";
import { operatorHurtowni } from "@/config/brief";

export const metadata: Metadata = { title: "Stany magazynowe" };

export default function WarehouseInventoryPage() {
  return (
    <>
      <WarehouseInventoryScreen />
      <section
        aria-labelledby="asortyment-tytul"
        className="mx-auto w-full max-w-[1320px] px-4 pb-16 sm:px-6 lg:px-8"
      >
        <header className="border-t border-hair pt-10">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
            Akcesoria
          </p>
          <h2
            id="asortyment-tytul"
            className="text-balance mt-3 font-display text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1] tracking-[-0.045em] text-ink"
          >
            Pełny asortyment i korekta ręczna
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-mute">
            Okucia, systemy szuflad, oświetlenie, złączki, chemia, kosze, uchwyty,
            szkło i obrzeża. Import obsługuje przyjęcia hurtowe, a korekta ręczna
            to, co policzono z natury przy regale.
          </p>
        </header>
        <MagazynReczny autor={operatorHurtowni.login} />
      </section>
    </>
  );
}
