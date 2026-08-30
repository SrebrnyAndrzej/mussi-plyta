import Link from "next/link";
import { cennik, firma, rozkroj } from "@/config/brief";
import { wycenUslugi, liczba, zloty } from "@/lib/pricing";
import type { Formatka } from "@/lib/nesting";
import Image from "next/image";
import { logotypy, realizacje, zdjecia } from "@/data/media";
import { MussiLogo } from "@/components/mussi-logo";

/**
 * Liczby w sekcji dowodowej muszą pochodzić z silnika, nie z tekstu.
 * Gdy klient zmieni cennik w brief.ts, ta sekcja ma się zmienić razem z nim.
 */
const przykladowaLista: Formatka[] = [
  { dlugosc: 720, szerokosc: 560, obrzeze: [1, 1, 1, 0], sztuk: 8, sloje: true },
  { dlugosc: 564, szerokosc: 500, obrzeze: [1, 0, 0, 0], sztuk: 6, sloje: false },
];
const przyklad = wycenUslugi(przykladowaLista, 18);
const formatArkusza = `${rozkroj.plyta.szerokosc} × ${rozkroj.plyta.wysokosc}`;

type ProductPreview = {
  id: string;
  kod: string;
  nazwa: string;
  producent: string;
  opis: string;
  grubosciMm: number[];
  dostepnosc: "na-stanie" | "ostatnie-sztuki" | "na-zamowienie";
  probka: string;
  cenaKontrahenta: number;
};

const availability = {
  "na-stanie": "na stanie",
  "ostatnie-sztuki": "ostatnie sztuki",
  "na-zamowienie": "na zamówienie",
} as const;

const steps = [
  ["Wysyłasz listę formatek", "Wymiary w milimetrach i obrzeża zaznaczone bez kodowania cyframi."],
  ["Potwierdzamy cenę i termin", "Od razu widzisz, ile płyt schodzi na listę i jaki jest koszt usług."],
  ["Tniemy i oklejamy", "Piła panelowa i okleiniarka są na miejscu, a obrzeże dobieramy do dekoru."],
  ["Odbierasz albo dowozimy", "Formatki są opisane i przygotowane w kolejności wygodnej do montażu."],
] as const;

const prices = [
  [cennik.cieciePlyty18.cena, "zł / płyta", "Cięcie płyty 18 mm", `Pełny arkusz ${formatArkusza} rozłożony na formatki z Twojej listy.`],
  [cennik.cieciePlyty3.cena, "zł / płyta", "Cięcie płyty 3 mm", "HDF na plecy i dna szuflad."],
  [cennik.oklejanie18.cena, "zł / mb", "Oklejanie 18 mm", "Obrzeże dobrane do dekoru płyty, liczone za metr bieżący."],
  [cennik.cieciSklejkiGrubej.cena, "zł / płyta", "Cięcie sklejki od 15 mm", "Cieńsza sklejka jest liczona według osobnej stawki."],
] as const;

function Arrow() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-current/10" aria-hidden="true">
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function BoardPreview() {
  const pieces = [
    [20, 20, 208, 164], [238, 20, 154, 164], [402, 20, 154, 164],
    [20, 194, 174, 138], [204, 194, 174, 138], [388, 194, 168, 138],
    [20, 342, 132, 106], [162, 342, 132, 106], [304, 342, 118, 106],
  ];
  return (
    <div className="rounded-shell bg-shell p-1.5 ring-1 ring-hair shadow-[var(--lift)]">
      <div className="overflow-hidden rounded-core bg-surface p-4 shadow-[var(--inner)] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Arkusz 01</span>
          <span className="rounded-full bg-danger-paper px-3 py-1.5 font-mono text-[10px] font-semibold text-accent-ink">wykorzystanie 83%</span>
        </div>
        <svg viewBox="0 0 576 468" className="w-full" role="img" aria-label="Przykładowy plan rozkroju płyty">
          <rect width="576" height="468" rx="12" fill="#E8EAED" />
          {pieces.map(([x, y, width, height], index) => (
            <g key={index}>
              <rect x={x} y={y} width={width} height={height} rx="3" fill="#fff" stroke="#9F0832" strokeOpacity=".52" />
              <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#697079" fontSize="11" fontFamily="monospace">
                {index < 3 ? "720 × 560" : index < 6 ? "600 × 480" : "420 × 360"}
              </text>
            </g>
          ))}
        </svg>
        <div className="mt-4 flex justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-mute"><span>{formatArkusza} mm</span><span>rzaz {rozkroj.rzaz} mm</span></div>
      </div>
    </div>
  );
}



function Foto({ z, className = "", sizes, priority = false }: { z: { src: string; szer: number; wys: number; alt: string }; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-core bg-paper-2 ring-1 ring-hair ${className}`}>
      <Image src={z.src} alt={z.alt} width={z.szer} height={z.wys} sizes={sizes} priority={priority}
        className="h-full w-full object-cover" />
    </div>
  );
}

export function MarketingHome({ produkty }: { produkty: ProductPreview[] }) {
  return (
    <>
      <a href="#main-content" className="fixed left-4 top-3 z-50 -translate-y-20 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-transform duration-150 ease-[var(--ease-out)] focus:translate-y-0">Przejdź do treści</a>
      <header className="pointer-events-none fixed inset-x-0 top-4 z-40 px-4 sm:top-6 sm:px-6">
        <div className="pointer-events-auto mx-auto flex min-h-16 w-full max-w-[1180px] items-center gap-4 rounded-full border border-white/60 bg-surface/72 px-4 shadow-[var(--lift-sm),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-2xl backdrop-saturate-150 sm:px-5">
          <a href="#top" aria-label={`${firma.nazwa}, początek strony`} className="pressable flex items-center rounded-ctl p-1.5"><MussiLogo priority /></a>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-mute lg:flex" aria-label="Strona główna">
            <a href="#oferta" className="hover:text-ink">Oferta</a><a href="#dekory" className="hover:text-ink">Dekory</a><a href="#rozkroj" className="hover:text-ink">Rozkrój</a><a href="#cennik" className="hover:text-ink">Cennik</a><a href="#realizacje" className="hover:text-ink">Realizacje</a><a href="#kontakt" className="hover:text-ink">Kontakt</a><Link href="/logowanie" className="text-accent-ink hover:text-accent">Panel klienta</Link>
          </nav>
          <a href={`tel:+48${firma.telefon.replaceAll(" ", "")}`} className="hidden font-mono text-xs font-semibold text-ink sm:block">{firma.telefon}</a>
          <Link href="/kreator" className="pressable flex min-h-11 items-center gap-2 rounded-full bg-ink py-1 pl-4 pr-1 text-xs font-semibold text-white sm:pl-5">Wyceń rozkrój <Arrow /></Link>
        </div>
      </header>

      <main id="main-content">
        <section id="top" className="mx-auto grid max-w-[1440px] gap-12 px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-8 lg:py-32">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-ink">Hurtownia płyt i akcesoriów, Zielona Góra</p>
            <h1 className="text-balance mt-6 font-display text-[clamp(3.2rem,7vw,7.4rem)] font-bold leading-[0.88] tracking-[-0.065em] text-ink">Przywieź listę. <span className="text-accent">Odbierz formatki.</span></h1>
            <p className="text-pretty mt-7 max-w-2xl text-lg leading-8 text-mute">Płyty, blaty, fronty i akcesoria z jednego miejsca, z cięciem i oklejaniem na miejscu. Dla stolarzy od 2013 roku.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/kreator" className="pressable flex min-h-12 items-center gap-5 rounded-full bg-accent py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white">Wyceń rozkrój <Arrow /></Link>
              <Link href="/katalog" className="pressable flex min-h-12 items-center gap-5 rounded-full bg-surface py-1.5 pl-5 pr-1.5 text-sm font-semibold text-ink ring-1 ring-hair">Zobacz dekory <Arrow /></Link>
              <Link href="/logowanie" className="pressable flex min-h-12 items-center gap-5 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white">Otwórz panel B2B <Arrow /></Link>
            </div>
          </div>
          <div className="grid gap-4">
            <BoardPreview />
            <Foto z={zdjecia.hala} priority sizes="(min-width: 1024px) 55vw, 100vw" className="aspect-[1100/458]" />
          </div>
        </section>

        <section aria-label="Marki w ofercie" className="border-y border-hair bg-surface py-7">
          <div className="karuzela-maska overflow-hidden">
            <div className="karuzela-logo">
              {[0, 1].map((rzad) => (
                <div key={rzad} aria-hidden={rzad === 1} className="flex shrink-0 items-center gap-x-12 pr-12 sm:gap-x-16 sm:pr-16">
                  {logotypy.map((l) => (
                    <Image key={`${rzad}-${l.nazwa}`} src={l.src} alt={rzad === 0 ? l.nazwa : ""} width={140} height={34}
                      className="logo-producenta h-[22px] w-auto shrink-0 opacity-[0.62] grayscale sm:h-[26px]" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="oferta" className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <h2 className="text-balance max-w-5xl font-display text-[clamp(2.5rem,5vw,5.2rem)] font-bold leading-[0.94] tracking-[-0.055em] text-ink">Wszystko na jedną kuchnię, z jednego adresu</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-mute">Materiał, obróbka i okucia w jednym zamówieniu, więc nie krążycie między trzema dostawcami.</p>
          <div className="mt-10 grid gap-4 lg:grid-cols-12">
            <article className="rounded-shell bg-surface p-7 ring-1 ring-hair shadow-[var(--lift-sm)] lg:col-span-7 lg:row-span-2 lg:p-10">
              <span className="rounded-full bg-danger-paper px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-ink">Rdzeń oferty</span>
              <h3 className="mt-7 font-display text-3xl font-semibold tracking-tight text-ink">Płyty laminowane i sklejki</h3>
              <p className="mt-4 max-w-2xl leading-7 text-mute">Format {formatArkusza} w wielu grubościach, HDF, sklejka liściasta i wodoodporna, płyty stolarskie oraz OSB.</p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{["18 mm", "28 mm", "HDF 3 mm", "OSB 10–25"].map((item) => <span key={item} className="rounded-ctl bg-paper px-3 py-3 text-center font-mono text-xs text-ink">{item}</span>)}</div><Foto z={zdjecia.dekory} sizes="(min-width: 1024px) 55vw, 100vw" className="mt-6 aspect-[16/9]" />
            </article>
            <article className="rounded-shell bg-ink p-7 text-white lg:col-span-5 lg:p-9"><p className="font-display text-7xl font-bold tracking-[-0.06em]">60</p><p className="mt-5 max-w-sm leading-7 text-white/64">dekorów blatów roboczych w postformingu, długości do 4200 mm</p></article>
            <article className="rounded-shell bg-danger-paper p-7 ring-1 ring-accent/10 lg:col-span-5 lg:p-9"><Foto z={zdjecia.probki} sizes="(min-width: 1024px) 40vw, 100vw" className="mb-6 aspect-[4/3]" /><h3 className="font-display text-3xl font-semibold tracking-tight text-ink">Fronty na wymiar</h3><p className="mt-4 leading-7 text-mute">Akryl, polygloss, MDF foliowany i ramiaki lakierowane w paletach RAL, NCS i ICA.</p></article>
            <article className="rounded-shell bg-surface p-7 ring-1 ring-hair lg:col-span-12 lg:p-9"><div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center"><div><h3 className="font-display text-3xl font-semibold tracking-tight text-ink">Akcesoria i oświetlenie</h3><p className="mt-3 max-w-3xl leading-7 text-mute">Zawiasy, prowadnice, szuflady, cargo, uchwyty, obrzeża oraz kompletne systemy LED.</p></div><div className="flex flex-wrap gap-2">{["Häfele", "Peka", "Amix", "GTV", "Laguna", "Hranipex"].map((item) => <span key={item} className="rounded-full bg-paper px-3 py-2 text-xs font-semibold text-mute">{item}</span>)}</div><Foto z={zdjecia.showroom} sizes="(min-width: 1024px) 320px, 100vw" className="aspect-square" /></div></article>
          </div>
        </section>

        <section id="dekory" className="border-y border-hair bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] font-bold leading-[.95] tracking-[-0.055em] text-ink">Dekory, które mamy dziś na stanie</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-mute">Wybierz płytę i przejdź prosto do kreatora z gotową sugestią obrzeża.</p></div><Link href="/katalog" className="pressable flex w-fit min-h-12 items-center gap-5 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white">Pełny katalog <Arrow /></Link></div>
            <div className="mt-10 flex snap-x gap-4 overflow-x-auto pb-5">
              {produkty.map((produkt) => (
                <Link key={produkt.id} href={`/kreator?material=${produkt.id}`} className="lift-on-hover pressable block w-[280px] shrink-0 snap-start rounded-shell bg-shell p-1.5 ring-1 ring-hair sm:w-[320px]">
                  <article className="overflow-hidden rounded-core bg-paper shadow-[var(--inner)]"><div className="aspect-[1.35/1]" style={{ background: produkt.probka }} /><div className="p-5"><p className="font-mono text-[10px] uppercase tracking-[.12em] text-mute">{produkt.producent} · {produkt.kod}</p><h3 className="mt-2 font-display text-xl font-semibold text-ink">{produkt.nazwa}</h3><p className="mt-2 text-sm text-mute">{produkt.opis} · {produkt.grubosciMm.join(" / ")} mm</p><div className="mt-6 flex items-center justify-between"><strong className="font-mono text-lg text-ink">{zloty.format(produkt.cenaKontrahenta)}</strong><span className={`rounded-full px-3 py-2 text-[10px] font-semibold ${produkt.dostepnosc === "na-stanie" ? "bg-ink text-white" : "bg-danger-paper text-accent-ink"}`}>{availability[produkt.dostepnosc]}</span></div></div></article>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="rozkroj" className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[.86fr_1.14fr] lg:items-center lg:px-8">
          <div><p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-accent-ink">Policz sam, zanim zadzwonisz</p><h2 className="mt-5 font-display text-[clamp(2.7rem,5vw,5.4rem)] font-bold leading-[.93] tracking-[-0.055em] text-ink">Ile kosztuje pocięcie Twojej kuchni</h2><p className="mt-6 max-w-xl text-lg leading-8 text-mute">Dotknij krawędzi formatki, wybierz grubość obrzeża, a rozkrój i wycena policzą się na żywo.</p><Link href="/kreator" className="pressable mt-8 flex w-fit min-h-12 items-center gap-5 rounded-full bg-accent py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white">Otwórz kreator <Arrow /></Link></div>
          <div className="rounded-shell bg-shell p-1.5 ring-1 ring-hair"><div className="grid gap-5 rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7"><div className="grid gap-3 sm:grid-cols-3">{[["Płyty", `${przyklad.arkuszy} szt.`], ["Obrzeże", `${liczba.format(przyklad.obrzezeMb)} mb`], ["Usługi netto", zloty.format(przyklad.razemNetto)]].map(([label, value]) => <div key={label} className="rounded-ctl bg-paper p-4"><p className="text-xs text-mute">{label}</p><p className="mt-2 font-mono text-xl font-semibold text-ink">{value}</p></div>)}</div><div className="relative aspect-[1.7/1] rounded-ctl bg-paper-2 p-5 ring-1 ring-inset ring-hair"><div className="grid h-full grid-cols-4 grid-rows-3 gap-1.5">{Array.from({ length: 10 }, (_, i) => <span key={i} className={`rounded-[3px] border border-accent/35 bg-white ${i === 0 ? "col-span-2" : ""}`} />)}</div><span className="absolute left-8 top-4 rounded-full bg-accent px-2.5 py-1 font-mono text-[9px] text-white">obrzeże 1 mm</span></div><p className="text-xs leading-5 text-mute">Działający kreator pozwala zmienić sugerowane obrzeże, oznaczyć każdą krawędź i dodać wiele formatek.</p></div></div>
        </section>

        <section id="cennik" className="border-y border-hair bg-surface py-20 sm:py-28"><div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8"><h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] font-bold leading-[.95] tracking-[-0.055em] text-ink">Cennik usług stolarni</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-mute">Ceny netto, bez schodów i bez negocjacji przy ladzie.</p><div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{prices.map(([price, unit, title, description]) => <article key={title} className="rounded-shell bg-paper p-7 ring-1 ring-hair"><p className="font-display text-5xl font-bold tracking-[-.055em] text-accent">{String(price).replace(".", ",")}<span className="ml-2 font-mono text-[10px] uppercase tracking-[.1em] text-mute">{unit}</span></p><h3 className="mt-8 font-display text-xl font-semibold text-ink">{title}</h3><p className="mt-3 text-sm leading-6 text-mute">{description}</p></article>)}</div></div></section>

        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28"><h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] font-bold leading-[.95] tracking-[-0.055em] text-ink">Jak to wygląda od strony stolarza</h2><ol className="mt-10 divide-y divide-hair border-y border-hair">{steps.map(([title, description], index) => <li key={title} className="grid gap-4 py-7 sm:grid-cols-[80px_1fr_1fr] sm:items-baseline"><span className="font-mono text-xs text-accent-ink">{String(index + 1).padStart(2, "0")}</span><h3 className="font-display text-xl font-semibold text-ink">{title}</h3><p className="text-sm leading-6 text-mute">{description}</p></li>)}</ol></section>

        <section id="realizacje" className="border-y border-hair bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <h2 className="text-balance max-w-4xl font-display text-[clamp(2.5rem,5vw,5rem)] font-bold leading-[.95] tracking-[-0.055em] text-ink">Kuchnie zrobione z naszego materiału</h2>
            <div className="mt-10 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              {realizacje.map((r) => (
                <figure key={r.zdjecie.src} className="m-0">
                  <Foto z={r.zdjecie} sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[3/2]" />
                  <figcaption className="mt-3 text-sm leading-6 text-mute">{r.podpis}</figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-6 text-xs leading-5 text-mute">Zdjęcia realizacji pochodzą z archiwum hurtowni i noszą znak wodny pracowni, która je wykonała.</p>

            <div className="mt-14 grid gap-8 rounded-shell bg-ink p-7 text-white lg:grid-cols-[1fr_1.15fr] lg:items-center lg:p-10">
              <div>
                <h3 className="font-display text-3xl font-semibold tracking-tight">Dowozimy pod wskazany adres</h3>
                <p className="mt-4 max-w-lg leading-7 text-white/64">Auto dostawcze do 1,5 tony. Koszt zależy od odległości, a {firma.miasto} i okolice zwykle mieszczą się w jednym kursie.</p>
              </div>
              <Foto z={zdjecia.auto} sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[16/10] ring-0" />
            </div>
          </div>
        </section>

        <section id="kontakt" className="bg-ink py-20 text-white sm:py-28"><div className="mx-auto grid max-w-[1440px] gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_.75fr] lg:px-8"><div><p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-white/50">Kontakt</p><h2 className="mt-5 max-w-4xl font-display text-[clamp(2.8rem,6vw,6.4rem)] font-bold leading-[.9] tracking-[-0.06em]">Prześlij listę, oddzwonimy z ceną</h2><p className="mt-6 max-w-xl text-lg leading-8 text-white/60">Najszybciej idzie telefonem. Gotową listę z kreatora możesz też przesłać mailem.</p><div className="mt-8 flex flex-wrap gap-3"><a href={`tel:+48${firma.telefon.replaceAll(" ", "")}`} className="pressable flex min-h-12 items-center gap-5 rounded-full bg-accent py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white">Zadzwoń {firma.telefon} <Arrow /></a><a href={`mailto:${firma.email}`} className="pressable flex min-h-12 items-center gap-5 rounded-full bg-white py-1.5 pl-5 pr-1.5 text-sm font-semibold text-ink">Napisz e-mail <Arrow /></a></div></div><dl className="divide-y divide-white/12 border-y border-white/12">{[["Adres", `${firma.ulica}, ${firma.kod} ${firma.miasto}`], ["Telefon", firma.telefon], ["E-mail", firma.email], ["Godziny", firma.godziny]].map(([label, value]) => <div key={label} className="flex justify-between gap-6 py-5"><dt className="text-sm text-white/45">{label}</dt><dd className="text-right font-mono text-sm">{value}</dd></div>)}</dl></div></section>
      </main>

      <footer className="border-t border-hair bg-surface"><div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p className="font-display font-semibold text-ink">{firma.nazwa}</p><div className="flex flex-wrap gap-5 text-sm text-mute"><Link href="/katalog">Katalog B2B</Link><Link href="/kreator">Kreator formatek</Link><a href="#kontakt">Kontakt</a></div><p className="font-mono text-[10px] uppercase tracking-[.1em] text-mute">Zielona Góra · od {firma.odRoku}</p></div></footer>
    </>
  );
}
