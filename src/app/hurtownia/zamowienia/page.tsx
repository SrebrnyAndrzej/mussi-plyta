import type { Metadata } from "next";
import { WarehouseOrdersScreen } from "@/components/warehouse-screens";
export const metadata: Metadata = { title: "Obsługa zamówień" };
export default function WarehouseOrdersPage(){return <WarehouseOrdersScreen />;}
