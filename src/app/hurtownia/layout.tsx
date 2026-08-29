import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { funkcje } from "@/config/brief";

/**
 * Zaplecze hurtowni jest za flagą.
 * Wyłączenie `funkcje.panelHurtowni` ma naprawdę odciąć te ekrany,
 * na przykład gdy demo dla klienta ma pokazać wyłącznie portal stolarza.
 */
export default function ZapleczeLayout({ children }: { children: ReactNode }) {
  if (!funkcje.panelHurtowni) notFound();
  return <>{children}</>;
}
