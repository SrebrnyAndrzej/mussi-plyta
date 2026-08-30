import type { Metadata } from "next";
import { ExceptionCenter } from "@/components/exception-center";

export const metadata: Metadata = { title: "Centrum wyjątków" };

export default function ExceptionsPage() {
  return <ExceptionCenter />;
}
