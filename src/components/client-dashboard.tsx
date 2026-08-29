import Link from "next/link";
import { activeOrder, dashboardCopy } from "@/data/portal-demo";
import { obslugaZamowien } from "@/config/brief";

export function ClientDashboard() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-lg font-medium text-ink">{dashboardCopy.greeting}</p>
          <h1 className="mt-1 font-display text-[clamp(3rem,5vw,5.1rem)] font-bold leading-[0.92] tracking-[-0.06em] text-ink">{dashboardCopy.title}</h1>
          <p className="mt-4 text-base text-mute">{dashboardCopy.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/kreator" className="pressable rounded-full bg-surface px-5 py-3 text-sm font-semibold text-ink ring-1 ring-hair">{dashboardCopy.quickCut}</Link>
          <Link href="/kreator" className="pressable rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white">{dashboardCopy.newOrder}</Link>
        </div>
      </header>

      <div className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-labelledby="active-order-title" className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">{dashboardCopy.activeOrder}</p>
                <h2 id="active-order-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Zamówienie {activeOrder.id}</h2>
              </div>
              <Link href="/zamowienia" className="pressable w-fit rounded-full bg-paper px-4 py-2.5 text-xs font-semibold text-ink">{dashboardCopy.seeDetails}</Link>
            </div>

            <dl className="mt-6 grid divide-y divide-hair rounded-ctl bg-paper px-5 ring-1 ring-hair sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-0">
              <div className="py-5 sm:px-5"><dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{dashboardCopy.statusLabel}</dt><dd className="mt-2 text-lg font-semibold text-accent-ink">{activeOrder.status}</dd></div>
              <div className="py-5 sm:px-5"><dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{dashboardCopy.editLabel}</dt><dd className="mt-2 font-mono text-lg font-semibold tabular-nums text-accent-ink">{activeOrder.editWindow}</dd><p className="mt-1 text-[11px] text-mute">{activeOrder.editHint}</p></div>
              <div className="py-5 sm:px-5"><dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{dashboardCopy.deliveryLabel}</dt><dd className="mt-2 font-mono text-lg font-semibold tabular-nums text-ink">{activeOrder.delivery}</dd><p className="mt-1 text-[11px] text-mute">{activeOrder.deliveryHint}</p></div>
            </dl>

            <ol className="mt-7 grid grid-cols-5 gap-2" aria-label="Etapy realizacji zamówienia">
              {activeOrder.timeline.map((item) => (
                <li key={item.label} className="min-w-0">
                  <div className={`h-1.5 rounded-full ${item.done ? "bg-accent" : "bg-paper-2"}`} />
                  <p className={`mt-3 text-[11px] font-semibold ${item.done ? "text-ink" : "text-mute"}`}>{item.label}</p>
                  <p className="mt-1 font-mono text-[9px] tabular-nums text-mute">{item.date}</p>
                </li>
              ))}
            </ol>

            <div className="mt-7 flex flex-col gap-3 rounded-ctl border border-[#d9c8ae] bg-[#fbf7f0] px-4 py-3 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
              <p><strong className="font-semibold">Brak magazynowy:</strong> {dashboardCopy.stockAlert.replace("Brak magazynowy: ", "")}</p>
              <Link href="/zamowienia" className="shrink-0 text-xs font-semibold text-accent-ink">{dashboardCopy.seeDetails}</Link>
            </div>

            <div className="mt-7">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">{dashboardCopy.orderContents}</h3>
              <div className="mt-3 divide-y divide-hair rounded-ctl border border-hair">
                {activeOrder.rows.map((row) => (
                  <Link key={row.label} href="/zamowienia" className="grid gap-2 px-4 py-4 hover:bg-paper sm:grid-cols-[1fr_auto] sm:items-center">
                    <div><p className="text-sm font-semibold text-ink">{row.label}</p><p className="mt-1 text-xs text-mute">{row.description}</p></div>
                    <strong className="font-mono text-sm tabular-nums text-ink">{row.value}</strong>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">{dashboardCopy.nextSteps}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Link href="/zamowienia#dokumenty" className="pressable rounded-ctl bg-paper p-4 text-sm font-semibold text-ink ring-1 ring-hair">Zobacz dokumenty<span className="mt-1 block text-xs font-normal text-mute">Potwierdzenia i specyfikacje</span></Link>
                <Link href="/projekty/palmowa" className="pressable rounded-ctl bg-paper p-4 text-sm font-semibold text-ink ring-1 ring-hair">Otwórz projekt<span className="mt-1 block text-xs font-normal text-mute">Materiały, rozkrój i wycena</span></Link>
                <Link href="/zamowienia" className="pressable rounded-ctl bg-paper p-4 text-sm font-semibold text-ink ring-1 ring-hair">Śledź realizację<span className="mt-1 block text-xs font-normal text-mute">Historia i termin dostawy</span></Link>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
          <div className="flex h-full flex-col rounded-core bg-surface p-5 shadow-[var(--inner)]">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">{dashboardCopy.summary}</p>
            <p className="mt-8 text-sm text-mute">Wartość zamówienia</p>
            <strong className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em] tabular-nums text-ink">{activeOrder.value}</strong>
            <p className="mt-2 text-xs leading-5 text-mute">Cena jest już dopasowana do Twoich warunków handlowych.</p>
            <Link href="/zamowienia" className="pressable mt-6 rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-white">{dashboardCopy.goToOrder}</Link>
            <div className="mt-5 divide-y divide-hair border-y border-hair text-xs font-semibold text-ink">
              <Link href="/zamowienia#dokumenty" className="block py-3 hover:text-accent-ink">Pobierz specyfikację PDF</Link>
              <Link href="/zamowienia#dokumenty" className="block py-3 hover:text-accent-ink">Pobierz listę formatek CSV</Link>
              <Link href="/projekty/palmowa" className="block py-3 hover:text-accent-ink">Udostępnij podgląd projektu</Link>
            </div>
            <div className="mt-auto pt-8">
              <div className="rounded-ctl bg-paper p-4 ring-1 ring-hair">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-ink">Polityka {obslugaZamowien.czasNaZmianyGodziny} h</p>
                <p className="mt-3 text-xs leading-5 text-mute">{dashboardCopy.editPolicy}</p>
                <p className="mt-3 text-xs leading-5 text-mute">Standardowy termin to {obslugaZamowien.terminRealizacjiDniRobocze} dni roboczych. {obslugaZamowien.komunikatBraku}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
