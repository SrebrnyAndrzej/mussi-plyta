"use client";

import {
  Square,
  Screwdriver,
  Ruler,
  Package,
  LineSegment,
  Lightbulb,
  Gear,
  Drop,
  Basket,
  ArrowRight,
  ArrowsClockwise,
  Barcode,
  ChartBar,
  ClockCounterClockwise,
  FileText,
  Files,
  Gauge,
  Handshake,
  Minus,
  Plus,
  PlugsConnected,
  Receipt,
  Sparkle,
  ShoppingCartSimple,
  SquaresFour,
  Stack,
  Truck,
  Trash,
  UserCircleGear,
  UsersThree,
  Warning,
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
  koszyk: ShoppingCartSimple,
  zamowienia: Receipt,
  dokumenty: Files,
  operacje: ChartBar,
  obsluga: FileText,
  stany: Barcode,
  zakupy: Truck,
  klienci: UsersThree,
  integracje: PlugsConnected,
  dalej: ArrowRight,
  korekta: ArrowsClockwise,
  historia: ClockCounterClockwise,
  ostrzezenie: Warning,
  minus: Minus,
  plus: Plus,
  usun: Trash,
  chemia: Drop,
  kosze: Basket,
  obrzeza: LineSegment,
  okucia: Gear,
  oswietlenie: Lightbulb,
  szklo: Square,
  szuflady: Package,
  uchwyty: Ruler,
  zlaczki: Screwdriver,
  produkcja: Sparkle,
  warunki: Handshake,
  zespol: UserCircleGear,
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
