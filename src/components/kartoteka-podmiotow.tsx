"use client";

import { useState } from "react";
import { podmiotyFakturujace, type PodmiotFakturujacy } from "@/config/brief";
import { Ikona } from "@/components/ikona";
import {
  bledneDaneFormalne,
  brakujaceDaneFormalne,
  czyPodmiotGotowy,
  numerDokumentu,
} from "@/lib/fakturowanie";

type PoleEdytowalne = Exclude<keyof PodmiotFakturujacy, "id" | "nazwaRobocza" | "zakres" | "ksef">;

const pola: Array<{ pole: PoleEdytowalne; etykieta: string; podpowiedz: string; szerokie?: boolean }> = [
  { pole: "nazwaPrawna", etykieta: "Nazwa prawna", podpowiedz: "Pełna nazwa z rejestru", szerokie: true },
  { pole: "nip", etykieta: "NIP", podpowiedz: "10 cyfr" },
  { pole: "regon", etykieta: "REGON", podpowiedz: "Opcjonalny" },
  { pole: "adres", etykieta: "Adres", podpowiedz: "Ulica, kod i miasto", szerokie: true },
  { pole: "rachunek", etykieta: "Rachunek bankowy", podpowiedz: "IBAN", szerokie: true },
  { pole: "seriaFaktury", etykieta: "Seria faktur", podpowiedz: "Na przykład FV-P" },
  { pole: "seriaKorekty", etykieta: "Seria korekt", podpowiedz: "Na przykład KFV-P" },
  { pole: "seriaWz", etykieta: "Seria WZ", podpowiedz: "Na przykład WZ-P" },
];

export function KartotekaPodmiotow() {
  const [kartoteka, setKartoteka] = useState<PodmiotFakturujacy[]>(() =>
    podmiotyFakturujace.map((p) => ({ ...p })),
  );

  function ustaw(id: string, pole: PoleEdytowalne, wartosc: string) {
    setKartoteka((obecna) =>
      obecna.map((p) => (p.id === id ? { ...p, [pole]: wartosc.trim() === "" ? null : wartosc } : p)),
    );
  }

  function przelaczKsef(id: string) {
    setKartoteka((obecna) =>
      obecna.map((p) =>
        p.id === id ? { ...p, ksef: p.ksef === "podlaczony" ? "niepodlaczony" : "podlaczony" } : p,
      ),
    );
  }

  const gotowe = kartoteka.filter(czyPodmiotGotowy).length;

  return (
    <div className="mt-8">
      <div className="rounded-shell bg-shell p-1.5 ring-1 ring-hair">
        <div className="rounded-core bg-surface p-5 shadow-[var(--inner)] sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">Gotowość do wystawiania</p>
            <p className="text-sm font-semibold text-ink">
              {gotowe} z {kartoteka.length} podmiotów ma komplet danych
            </p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper" role="presentation">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out)]"
              style={{ width: `${(gotowe / kartoteka.length) * 100}%` }}
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-mute">
            Dane wpisane tutaj działają w wersji demonstracyjnej i nie są jeszcze zapisywane.
            Po podpięciu bazy kartoteka będzie źródłem danych na dokumentach sprzedaży,
            a każdy podmiot dostanie własną numerację i połączenie z KSeF.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        {kartoteka.map((podmiot) => {
          const braki = brakujaceDaneFormalne(podmiot);
          const bledy = bledneDaneFormalne(podmiot);
          const gotowy = braki.length === 0 && bledy.length === 0;
          const przykladowyNumer = numerDokumentu(podmiot.seriaFaktury, 1, new Date().getFullYear());

          return (
            <section
              key={podmiot.id}
              aria-labelledby={`podmiot-${podmiot.id}`}
              className="min-w-0 rounded-shell bg-surface p-5 ring-1 ring-hair shadow-[var(--lift-sm)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mute">{podmiot.nazwaRobocza}</p>
                  <h2 id={`podmiot-${podmiot.id}`} className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-ink">
                    {podmiot.nazwaPrawna ?? "Nazwa do uzupełnienia"}
                  </h2>
                  <p className="mt-2 text-xs leading-5 text-mute">{podmiot.zakres}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold ${gotowy ? "bg-[#edf7f0] text-ok" : "bg-[#fff7e8] text-warning"}`}>
                  {gotowy ? "Komplet" : `Braki: ${braki.length + bledy.length}`}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {pola.map(({ pole, etykieta, podpowiedz, szerokie }) => (
                  <label key={pole} className={`block min-w-0 ${szerokie ? "sm:col-span-2" : ""}`}>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">{etykieta}</span>
                    <input
                      type="text"
                      value={podmiot[pole] ?? ""}
                      placeholder={podpowiedz}
                      onChange={(event) => ustaw(podmiot.id, pole, event.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-ctl bg-paper px-3 text-sm text-ink ring-1 ring-inset ring-hair placeholder:text-mute/70 focus:ring-accent"
                    />
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={() => przelaczKsef(podmiot.id)}
                aria-pressed={podmiot.ksef === "podlaczony"}
                className={`pressable mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-xs font-semibold ring-1 ${
                  podmiot.ksef === "podlaczony" ? "bg-[#edf7f0] text-ok ring-[#cfe7d7]" : "bg-paper text-mute ring-hair"
                }`}
              >
                <Ikona nazwa="integracje" className="size-3.5" />
                KSeF: {podmiot.ksef === "podlaczony" ? "podłączony" : "niepodłączony"}
              </button>

              <dl className="mt-5 divide-y divide-hair border-y border-hair text-xs">
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-mute">Pierwszy numer</dt>
                  <dd className="min-w-0 truncate font-mono text-ink">{przykladowyNumer ?? "po nadaniu serii"}</dd>
                </div>
              </dl>

              {(braki.length > 0 || bledy.length > 0) && (
                <div className="mt-4 rounded-core bg-[#fff7e8] p-4 ring-1 ring-[#f0dcb4]">
                  <p className="flex items-center gap-2 text-xs font-semibold text-warning">
                    <Ikona nazwa="ostrzezenie" className="size-3.5" />
                    Do uzupełnienia przed pierwszą fakturą
                  </p>
                  <ul className="mt-2 space-y-1 text-[11px] leading-5 text-mute">
                    {braki.map((brak) => <li key={brak}>Brak pola: {brak}</li>)}
                    {bledy.map((blad) => <li key={blad}>{blad}</li>)}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
