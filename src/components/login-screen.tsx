"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MussiLogo } from "@/components/mussi-logo";
import { firma } from "@/config/brief";
import { authCopy } from "@/data/warehouse-demo";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function enter(route: "/panel" | "/hurtownia") {
    setLoading(true);
    window.setTimeout(() => router.push(route), 350);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    enter("/panel");
  }

  return (
    <main id="main-content" className="min-h-screen bg-paper px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,.82fr)_minmax(560px,1.18fr)] lg:gap-6 lg:p-6">
      <section className="flex min-h-[320px] flex-col rounded-shell bg-ink p-7 text-white sm:p-10 lg:min-h-[calc(100vh-48px)] lg:p-14">
        <Link href="/" className="w-fit rounded-ctl bg-white p-3"><MussiLogo priority /></Link>
        <div className="my-auto py-14">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">{authCopy.eyebrow}</p>
          <h1 className="text-balance mt-6 max-w-2xl font-display text-[clamp(3rem,6vw,6.2rem)] font-bold leading-[0.9] tracking-[-0.06em]">{authCopy.title}</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/62 sm:text-lg">{authCopy.description}</p>
        </div>
        <p className="max-w-lg border-t border-white/12 pt-5 text-xs leading-5 text-white/48">{authCopy.safety}</p>
      </section>

      <section className="mx-auto flex w-full max-w-2xl items-center py-10 lg:py-0">
        <div className="w-full rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="rounded-core bg-surface p-6 shadow-[var(--inner)] sm:p-10">
            <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">Bezpieczny dostęp</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] text-ink">Logowanie</h2><p className="mt-3 text-sm leading-6 text-mute">Wpisz dane przypisane do konta w {firma.nazwa}.</p></div>
            <form className="mt-8 space-y-5" onSubmit={submit}>
              <label className="block text-sm font-semibold text-ink">{authCopy.email}<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nazwa@firma.pl" className="mt-2 min-h-12 w-full rounded-ctl bg-paper px-4 text-sm font-normal text-ink ring-1 ring-inset ring-hair placeholder:text-mute focus:ring-accent" /></label>
              <label className="block text-sm font-semibold text-ink">{authCopy.password}<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="mt-2 min-h-12 w-full rounded-ctl bg-paper px-4 text-sm font-normal text-ink ring-1 ring-inset ring-hair placeholder:text-mute focus:ring-accent" /></label>
              <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-3 text-xs text-mute"><input type="checkbox" className="size-4 accent-[var(--color-accent)]" />{authCopy.remember}</label><button type="button" className="text-xs font-semibold text-accent-ink">{authCopy.forgot}</button></div>
              <button type="submit" disabled={loading} className="pressable min-h-12 w-full rounded-full bg-accent px-5 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Logowanie…" : authCopy.submit}</button>
            </form>
            <div className="my-7 flex items-center gap-4"><span className="h-px flex-1 bg-hair" /><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">Tryb spotkania</span><span className="h-px flex-1 bg-hair" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => enter("/panel")} className="pressable rounded-ctl bg-paper p-4 text-left text-sm font-semibold text-ink ring-1 ring-hair">{authCopy.clientDemo}<span className="mt-1 block text-xs font-normal text-mute">Projekty, wyceny i statusy</span></button>
              <button type="button" onClick={() => enter("/hurtownia")} className="pressable rounded-ctl bg-ink p-4 text-left text-sm font-semibold text-white">{authCopy.warehouseDemo}<span className="mt-1 block text-xs font-normal text-white/55">Operacje, stany i integracja</span></button>
            </div>
            <p className="mt-6 rounded-ctl bg-danger-paper p-4 text-xs leading-5 text-mute">{authCopy.demoNotice}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
