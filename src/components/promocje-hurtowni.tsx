"use client";

import { useState } from "react";
import { dzisDemo } from "@/config/brief";
import { Ikona } from "@/components/ikona";
import { promocjeDemo } from "@/data/promocje-demo";
import {
  aktywnePromocje,
  czyTrwa,
  dodajPromocje,
  dniDoKonca,
  podsumujPromocje,
  przelaczPromocje,
  usunPromocje,
  walidujPromocje,
  type Promocja,
} from "@/lib/promocje";

const pustyFormularz = {
  tytul: "",
  opis: "",
  etykieta: "",
  producent: "",
  odnosnik: "/katalog",
  obowiazujeOd: "",
  obowiazujeDo: "",
  kolejnosc: 5,
};

/**
 * Zarządzanie promocjami widocznymi na stronie głównej.
 *
 * Baner idzie prosto do klienta, więc zapis przechodzi przez `walidujPromocje`
 * i odmawia, zamiast opublikować pusty tytuł albo odwrócone daty.
 */
export function PromocjeHurtowni() {
  const [lista, setLista] = useState<Promocja[]>(promocjeDemo);
  const [formularz, setFormularz] = useState(() => ({
    ...pustyFormularz,
    obowiazujeOd: dzisDemo().toISOString().slice(0, 10),
  }));
  const [bledy, setBledy] = useState<string[]>([]);
  const [komunikat, setKomunikat] = useState<string | null>(null);

  const dzis = dzisDemo();
  const p = podsumujPromocje(lista, dzis);
  const naStronie = aktywnePromocje(lista, dzis);

  function zapisz() {
    const kandydat = {
      tytul: formularz.tytul,
      opis: formularz.opis,
      etykieta: formularz.etykieta,
      producent: formularz.producent.trim() || null,
      odnosnik: formularz.odnosnik.trim() || null,
      obowiazujeOd: formularz.obowiazujeOd,
      obowiazujeDo: formularz.obowiazujeDo.trim() || null,
      aktywna: true,
      kolejnosc: Number(formularz.kolejnosc),
    };

    const id = formularz.tytul
      .toLocaleLowerCase("pl")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || `promocja-${lista.length + 1}`;

    const wynik = dodajPromocje(lista, kandydat, id);
    if (!wynik.ok) {
      setBledy(wynik.bledy);
      setKomunikat(null);
      return;
    }
    setLista(wynik.promocje);
    setBledy([]);
    setKomunikat(`Dodano promocję „${wynik.promocja.tytul}". Jest już widoczna na stronie głównej.`);
    setFormularz({ ...pustyFormularz, obowiazujeOd: dzis.toISOString().slice(0, 10) });
  }

  const pole = (klucz: keyof typeof pustyFormularz, wartosc: string | number) => {
    setFormularz((obecny) => ({ ...obecny, [klucz]: wartosc }));
    setBledy([]);
  };

  const wejscie = "mt-2 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm text-ink ring-1 ring-inset ring-hair placeholder:text-mute/70 focus:ring-accent";

  return (
    <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">

      <section className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="rounded-core bg-surface shadow-[var(--inner)]">
          <div className="grid grid-cols-2 gap-1 border-b border-hair bg-paper p-4 sm:grid-cols-4">
            {[
              { etykieta: "Wszystkie", wartosc: p.wszystkie },
              { etykieta: "Na stronie", wartosc: p.trwajace },
              { etykieta: "Zaplanowane", wartosc: p.zaplanowane },
              { etykieta: "Zakończone", wartosc: p.zakonczone },
            ].map((k) => (
              <div key={k.etykieta}>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">{k.etykieta}</p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{k.wartosc}</p>
              </div>
            ))}
          </div>

          <ul className="divide-y divide-hair">
            {lista.map((promo) => {
              const trwa = czyTrwa(promo, dzis);
              const zostalo = dniDoKonca(promo, dzis);
              return (
                <li key={promo.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] font-semibold text-white">
                        {promo.etykieta}
                      </span>
                      <strong className="min-w-0 text-sm font-semibold text-ink">{promo.tytul}</strong>
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${trwa ? "bg-[#edf7f0] text-ok" : "bg-paper text-mute"}`}>
                        {trwa ? "na stronie" : promo.aktywna ? "poza terminem" : "wyłączona"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-mute">{promo.opis}</p>
                    <p className="mt-1 font-mono text-[10px] text-mute">
                      {promo.obowiazujeOd} do {promo.obowiazujeDo ?? "bezterminowo"}
                      {zostalo !== null && trwa ? `, zostało ${zostalo} dni` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => { setLista(przelaczPromocje(lista, promo.id)); setKomunikat(null); }}
                      className="pressable min-h-11 rounded-full bg-paper px-4 text-[11px] font-semibold text-ink ring-1 ring-hair"
                    >
                      {promo.aktywna ? "Wyłącz" : "Włącz"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLista(usunPromocje(lista, promo.id)); setKomunikat(null); }}
                      aria-label={`Usuń promocję: ${promo.tytul}`}
                      className="pressable grid min-h-11 w-11 place-items-center rounded-full text-mute hover:bg-danger-paper hover:text-accent-ink"
                    >
                      <Ikona nazwa="usun" rozmiar={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <aside className="min-w-0 rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Nowa promocja</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-ink">
            Dodaj baner na stronę główną
          </h2>
          <p className="mt-2 text-xs leading-5 text-mute">
            Kolejność ustala, co klient zobaczy jako pierwsze. Niższa liczba wyświetla się wcześniej.
          </p>

          <label className="mt-5 block text-xs font-semibold text-ink">
            Hasło
            <input type="text" value={formularz.tytul} onChange={(e) => pole("tytul", e.target.value)}
              placeholder="Zawiasy Blum taniej o 25%" className={wejscie} />
          </label>

          <label className="mt-4 block text-xs font-semibold text-ink">
            Warunek
            <textarea value={formularz.opis} onChange={(e) => pole("opis", e.target.value)}
              placeholder="Przy zamówieniu od 50 sztuk, rabat liczy się do progu kontrahenta"
              className={`${wejscie} min-h-20 py-2`} />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-ink">
              Etykieta
              <input type="text" value={formularz.etykieta} onChange={(e) => pole("etykieta", e.target.value)}
                placeholder="-25%" className={wejscie} />
            </label>
            <label className="block text-xs font-semibold text-ink">
              Producent
              <input type="text" value={formularz.producent} onChange={(e) => pole("producent", e.target.value)}
                placeholder="Blum" className={wejscie} />
            </label>
            <label className="block text-xs font-semibold text-ink">
              Od
              <input type="date" value={formularz.obowiazujeOd} onChange={(e) => pole("obowiazujeOd", e.target.value)} className={`${wejscie} font-mono`} />
            </label>
            <label className="block text-xs font-semibold text-ink">
              Do
              <input type="date" value={formularz.obowiazujeDo} onChange={(e) => pole("obowiazujeDo", e.target.value)} className={`${wejscie} font-mono`} />
            </label>
            <label className="block text-xs font-semibold text-ink">
              Odnośnik
              <input type="text" value={formularz.odnosnik} onChange={(e) => pole("odnosnik", e.target.value)}
                placeholder="/katalog" className={`${wejscie} font-mono`} />
            </label>
            <label className="block text-xs font-semibold text-ink">
              Kolejność
              <input type="number" min={0} value={formularz.kolejnosc} onChange={(e) => pole("kolejnosc", Number(e.target.value))}
                className={`${wejscie} font-mono tabular-nums`} />
            </label>
          </div>

          {bledy.length > 0 && (
            <div role="alert" className="mt-4 rounded-ctl bg-[#fff7e8] p-3 ring-1 ring-[#f0dcb4]">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-warning">
                <Ikona nazwa="ostrzezenie" rozmiar={13} />
                Baner nie został zapisany
              </p>
              <ul className="mt-2 space-y-1 text-[11px] leading-5 text-mute">
                {bledy.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          )}

          {komunikat && (
            <p aria-live="polite" className="mt-4 rounded-ctl bg-[#edf7f0] p-3 text-[11px] font-semibold leading-5 text-ok">
              {komunikat}
            </p>
          )}

          <button
            type="button"
            onClick={zapisz}
            disabled={walidujPromocje({
              tytul: formularz.tytul, opis: formularz.opis, etykieta: formularz.etykieta,
              producent: null, odnosnik: formularz.odnosnik.trim() || null,
              obowiazujeOd: formularz.obowiazujeOd, obowiazujeDo: formularz.obowiazujeDo.trim() || null,
              aktywna: true, kolejnosc: Number(formularz.kolejnosc),
            }).length > 0}
            className="pressable mt-5 min-h-12 w-full rounded-full bg-accent px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-hair disabled:text-mute"
          >
            Opublikuj baner
          </button>

          <p className="mt-4 text-[11px] leading-5 text-mute">
            Na stronie głównej wyświetla się teraz {naStronie.length} {naStronie.length === 1 ? "promocja" : "promocji"}.
            Zmiany działają w wersji demonstracyjnej i po podpięciu bazy będą zapisywane na stałe.
          </p>
        </div>
      </aside>

    </div>
  );
}
