import type { Metadata } from "next";
import Image from "next/image";
import { zdjecia } from "@/data/media";
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
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <p className="max-w-2xl text-base leading-7 text-mute">
              Okucia, systemy szuflad, oświetlenie, złączki, chemia, kosze, uchwyty,
              szkło i obrzeża. Import obsługuje przyjęcia hurtowe, a korekta ręczna
              to, co policzono z natury przy regale.
            </p>
            {/* Prawdziwe zdjęcie ekspozycji hurtowni. Zasada 10 kontraktu dopuszcza
                zdjęcia hurtowni do budowania kontekstu, zakazuje natomiast
                fabrykowania fotografii pojedynczych produktów. */}
            <Image
              src={zdjecia.showroom.src}
              alt={zdjecia.showroom.alt}
              width={zdjecia.showroom.szer}
              height={zdjecia.showroom.wys}
              sizes="(min-width: 1024px) 360px, 100vw"
              className="aspect-[4/3] w-full rounded-core object-cover ring-1 ring-hair"
            />
          </div>
        </header>
        <MagazynReczny autor={operatorHurtowni.login} />
      </section>
    </>
  );
}
