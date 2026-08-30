import type { Metadata } from "next";
import { ProcurementCenter } from "@/components/procurement-center";

export const metadata: Metadata = { title: "Zakupy i dostawy" };

export default function ProcurementPage() {
  return <ProcurementCenter />;
}
