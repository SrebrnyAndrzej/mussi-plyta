import type { ReactNode } from "react";
import { bramka, funkcje } from "@/lib/bramka";

/** Trasa objęta flagą `funkcje.koszyk`. Wyłączenie jej odcina moduł wyceny. */
export default function Layout({ children }: { children: ReactNode }) {
  bramka(funkcje.koszyk);
  return <>{children}</>;
}
