import type { Metadata } from "next";
import { WarehouseDashboard } from "@/components/warehouse-screens";
export const metadata: Metadata = { title: "Panel hurtowni" };
export default function WarehousePage(){return <WarehouseDashboard />;}
