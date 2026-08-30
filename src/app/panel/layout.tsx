import type { ReactNode } from "react";
import { bramka, funkcje } from "@/lib/bramka";

/** Trasa objęta flagą `funkcje.panelKlienta`. Wyłączenie jej odcina ten moduł. */
export default function Layout({ children }: { children: ReactNode }) {
  bramka(funkcje.panelKlienta);
  return <>{children}</>;
}
