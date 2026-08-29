import type { Metadata } from "next";
import { WarehouseInventoryScreen } from "@/components/warehouse-screens";
export const metadata: Metadata = { title: "Stany magazynowe" };
export default function WarehouseInventoryPage(){return <WarehouseInventoryScreen />;}
