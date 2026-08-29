"use client";

import {
  Barcode,
  ChartBar,
  FileText,
  Files,
  Gauge,
  PlugsConnected,
  Receipt,
  SquaresFour,
  Stack,
  UsersThree,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

/**
 * Jedna rodzina ikon na całą aplikację: Phosphor, waga Regular.
 * Nazwy są kluczami w danych nawigacji, żeby warstwa danych nie
 * importowała komponentów Reacta.
 */
const zestaw = {
  pulpit: Gauge,
  projekty: SquaresFour,
  katalog: Stack,
  zamowienia: Receipt,
  dokumenty: Files,
  operacje: ChartBar,
  obsluga: FileText,
  stany: Barcode,
  klienci: UsersThree,
  integracje: PlugsConnected,
} satisfies Record<string, PhosphorIcon>;

export type NazwaIkony = keyof typeof zestaw;

export function Ikona({
  nazwa,
  className = "",
  rozmiar = 18,
}: {
  nazwa: NazwaIkony;
  className?: string;
  rozmiar?: number;
}) {
  const Glif = zestaw[nazwa];
  return <Glif size={rozmiar} weight="regular" className={className} aria-hidden />;
}
