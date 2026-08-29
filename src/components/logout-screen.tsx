import Link from "next/link";
import { MussiLogo } from "@/components/mussi-logo";
import { authCopy } from "@/data/warehouse-demo";

export function LogoutScreen() {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <section className="w-full max-w-xl rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="rounded-core bg-surface p-7 text-center shadow-[var(--inner)] sm:p-12">
          <Link href="/" className="mx-auto block w-fit rounded-ctl"><MussiLogo priority /></Link>
          <p className="mt-10 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">Wylogowano</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.045em] text-ink">{authCopy.loggedOutTitle}</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-mute">{authCopy.loggedOutDescription}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/logowanie" className="pressable rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">{authCopy.loginAgain}</Link><Link href="/" className="pressable rounded-full bg-paper px-6 py-3 text-sm font-semibold text-ink ring-1 ring-hair">{authCopy.home}</Link></div>
        </div>
      </section>
    </main>
  );
}
