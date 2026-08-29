import type { Metadata } from "next";
import { OrdersCenter } from "@/components/orders-center";

export const metadata: Metadata = { title: "Zamówienia" };

export default function OrdersPage() {
  return <OrdersCenter />;
}
