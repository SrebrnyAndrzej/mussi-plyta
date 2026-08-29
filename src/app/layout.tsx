import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { firma } from "@/config/brief";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});
const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});
const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${firma.nazwa}, hurtownia płyt meblowych`,
    template: `%s | ${firma.nazwa}`,
  },
  description:
    "Płyty, blaty, fronty i akcesoria z cięciem i oklejaniem na miejscu. " +
    `${firma.miasto}, ${firma.ulica}.`,
};

export const viewport: Viewport = {
  themeColor: "#F3F4F6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pl"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-body">{children}</body>
    </html>
  );
}
