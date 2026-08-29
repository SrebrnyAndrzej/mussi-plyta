import type { Metadata } from "next";
import { LogoutScreen } from "@/components/logout-screen";

export const metadata: Metadata = { title: "Wylogowano" };

export default function LoggedOutPage() {
  return <LogoutScreen />;
}
