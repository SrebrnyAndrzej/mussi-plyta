import type { Metadata } from "next";
import { ClientDashboard } from "@/components/client-dashboard";

export const metadata: Metadata = { title: "Pulpit klienta" };

export default function ClientDashboardPage() {
  return <ClientDashboard />;
}
