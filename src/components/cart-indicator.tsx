"use client";

import Link from "next/link";
import { Ikona } from "@/components/ikona";
import { useCartIndicatorSummary } from "@/lib/cart-browser";
import { zloty } from "@/lib/pricing";

function labelPozycji(lines: number) {
  if (lines === 1) return "pozycja";
  if (lines >= 2 && lines <= 4) return "pozycje";
  return "pozycji";
}

export function CartIndicator({ variant, active = false }: { variant: "sidebar" | "mobile"; active?: boolean }) {
  const summary = useCartIndicatorSummary();

  if (variant === "mobile") {
    return (
      <Link href="/koszyk" aria-label={`Koszyk, ${summary.lines} ${labelPozycji(summary.lines)}, ${zloty.format(summary.gross)} brutto`} aria-current={active ? "page" : undefined} className={`pressable relative ml-auto flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 text-[10px] font-semibold ${active ? "bg-ink text-white" : "bg-surface text-ink ring-1 ring-hair"}`}>
        <Ikona nazwa="koszyk" rozmiar={16} />
        <span className="hidden font-mono tabular-nums sm:inline">{zloty.format(summary.gross)}</span>
        {summary.lines > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 py-0.5 font-mono text-[9px] text-white">{summary.lines}</span>}
      </Link>
    );
  }

  return (
    <Link href="/koszyk" aria-current={active ? "page" : undefined} className={`pressable mx-4 mt-auto rounded-core p-4 ring-1 ${active ? "bg-ink text-white ring-ink" : "bg-paper text-ink ring-hair"}`}>
      <span className="flex items-center gap-3">
        <span className={`relative grid size-10 place-items-center rounded-ctl ${active ? "bg-white/10" : "bg-surface text-accent"}`}>
          <Ikona nazwa="koszyk" rozmiar={19} />
          {summary.lines > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 py-0.5 font-mono text-[9px] text-white ring-2 ring-paper">{summary.lines}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-xs font-semibold">Koszyk</strong>
          <span className={`mt-0.5 block text-[10px] ${active ? "text-white/60" : "text-mute"}`}>{summary.lines} {labelPozycji(summary.lines)}</span>
        </span>
        <strong className="font-mono text-[10px] tabular-nums">{zloty.format(summary.gross)}</strong>
      </span>
    </Link>
  );
}
