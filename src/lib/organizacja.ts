/**
 * Konto organizacji i role, w zakresie zawężonym przez klienta.
 *
 * Pytanie brzmi tylko: kto w stolarni może złożyć zamówienie i do jakiej kwoty.
 * Pełne role kosztorysanta odpadły razem z pomysłem na CRM dla stolarza,
 * bo portal ma obsługiwać sprzedaż hurtowni, nie pracę stolarza.
 */

export type Rola = "wlasciciel" | "kupujacy" | "podglad";

export type OpisRoli = {
  nazwa: string;
  opis: string;
  skladaZamowienia: boolean;
  widziCeny: boolean;
  zarzadzaZespolem: boolean;
  /** Czy rola ma własny limit akceptacji, czy zatwierdza bez ograniczeń. */
  limitowana: boolean;
};

export const role: Record<Rola, OpisRoli> = {
  wlasciciel: {
    nazwa: "Właściciel",
    opis: "Zamawia bez ograniczeń, zarządza zespołem i warunkami konta.",
    skladaZamowienia: true,
    widziCeny: true,
    zarzadzaZespolem: true,
    limitowana: false,
  },
  kupujacy: {
    nazwa: "Kupujący",
    opis: "Składa zamówienia do przyznanego limitu, powyżej potrzebuje akceptacji.",
    skladaZamowienia: true,
    widziCeny: true,
    zarzadzaZespolem: false,
    limitowana: true,
  },
  podglad: {
    nazwa: "Podgląd",
    opis: "Widzi zamówienia i dokumenty, nie składa i nie widzi cen zakupu.",
    skladaZamowienia: false,
    widziCeny: false,
    zarzadzaZespolem: false,
    limitowana: true,
  },
};

export type Czlonek = {
  id: string;
  imie: string;
  email: string;
  rola: Rola;
  /** Do jakiej kwoty brutto może zamawiać bez akceptacji. Null oznacza brak limitu. */
  limitAkceptacji: number | null;
  aktywny: boolean;
};

export type DecyzjaZamowienia =
  | { ok: true; wymagaAkceptacji: false }
  | { ok: true; wymagaAkceptacji: true; akceptujacy: Czlonek[] }
  | { ok: false; blad: string };

/**
 * Czy ta osoba może złożyć zamówienie o tej wartości.
 *
 * Przekroczenie limitu nie jest odmową: zamówienie idzie do akceptacji,
 * bo blokowanie kupującego w środku pracy jest gorsze niż jedno kliknięcie
 * właściciela.
 */
export function czyMozeZlozyc(
  czlonek: Czlonek,
  wartoscBrutto: number,
  zespol: readonly Czlonek[],
): DecyzjaZamowienia {
  if (!czlonek.aktywny) {
    return { ok: false, blad: `Konto ${czlonek.imie} jest nieaktywne.` };
  }
  if (!role[czlonek.rola].skladaZamowienia) {
    return { ok: false, blad: `Rola „${role[czlonek.rola].nazwa}” nie składa zamówień.` };
  }
  if (wartoscBrutto <= 0) {
    return { ok: false, blad: "Wartość zamówienia musi być dodatnia." };
  }

  if (czlonek.limitAkceptacji === null || wartoscBrutto <= czlonek.limitAkceptacji) {
    return { ok: true, wymagaAkceptacji: false };
  }

  const akceptujacy = zespol.filter(
    (c) =>
      c.aktywny &&
      c.id !== czlonek.id &&
      (c.limitAkceptacji === null || c.limitAkceptacji >= wartoscBrutto),
  );

  if (akceptujacy.length === 0) {
    return {
      ok: false,
      blad: "Zamówienie przekracza limit, a w firmie nie ma nikogo, kto mógłby je zaakceptować.",
    };
  }
  return { ok: true, wymagaAkceptacji: true, akceptujacy };
}

export type WynikZespolu =
  | { ok: true; zespol: Czlonek[] }
  | { ok: false; blad: string };

/** Ostatni właściciel nie może zniknąć, bo konto zostałoby bez gospodarza. */
function liczbaAktywnychWlascicieli(zespol: readonly Czlonek[]): number {
  return zespol.filter((c) => c.aktywny && c.rola === "wlasciciel").length;
}

export function zmienRole(
  zespol: readonly Czlonek[],
  id: string,
  nowa: Rola,
  autor: Czlonek,
): WynikZespolu {
  if (!role[autor.rola].zarzadzaZespolem) {
    return { ok: false, blad: "Tylko właściciel zmienia role w firmie." };
  }
  const czlonek = zespol.find((c) => c.id === id);
  if (!czlonek) return { ok: false, blad: "Nie znaleziono osoby w zespole." };
  if (czlonek.rola === nowa) return { ok: false, blad: "Osoba ma już tę rolę." };

  if (czlonek.rola === "wlasciciel" && liczbaAktywnychWlascicieli(zespol) === 1) {
    return { ok: false, blad: "To jedyny właściciel konta. Najpierw wskaż kogoś innego." };
  }

  return {
    ok: true,
    zespol: zespol.map((c) =>
      c.id === id
        ? { ...c, rola: nowa, limitAkceptacji: role[nowa].limitowana ? c.limitAkceptacji : null }
        : c,
    ),
  };
}

export function ustawLimit(
  zespol: readonly Czlonek[],
  id: string,
  limit: number | null,
  autor: Czlonek,
): WynikZespolu {
  if (!role[autor.rola].zarzadzaZespolem) {
    return { ok: false, blad: "Tylko właściciel ustala limity akceptacji." };
  }
  const czlonek = zespol.find((c) => c.id === id);
  if (!czlonek) return { ok: false, blad: "Nie znaleziono osoby w zespole." };
  if (!role[czlonek.rola].limitowana) {
    return { ok: false, blad: `Rola „${role[czlonek.rola].nazwa}” nie ma limitu akceptacji.` };
  }
  if (limit !== null && limit < 0) {
    return { ok: false, blad: "Limit nie może być ujemny." };
  }
  return { ok: true, zespol: zespol.map((c) => (c.id === id ? { ...c, limitAkceptacji: limit } : c)) };
}

export function wylaczKonto(
  zespol: readonly Czlonek[],
  id: string,
  autor: Czlonek,
): WynikZespolu {
  if (!role[autor.rola].zarzadzaZespolem) {
    return { ok: false, blad: "Tylko właściciel wyłącza konta." };
  }
  if (autor.id === id) {
    return { ok: false, blad: "Nie da się wyłączyć własnego konta." };
  }
  const czlonek = zespol.find((c) => c.id === id);
  if (!czlonek) return { ok: false, blad: "Nie znaleziono osoby w zespole." };
  if (!czlonek.aktywny) return { ok: false, blad: "Konto jest już wyłączone." };
  if (czlonek.rola === "wlasciciel" && liczbaAktywnychWlascicieli(zespol) === 1) {
    return { ok: false, blad: "To jedyny właściciel konta." };
  }
  return { ok: true, zespol: zespol.map((c) => (c.id === id ? { ...c, aktywny: false } : c)) };
}

export type PodsumowanieZespolu = {
  aktywni: number;
  zamawiajacy: number;
  bezLimitu: number;
};

export function podsumujZespol(zespol: readonly Czlonek[]): PodsumowanieZespolu {
  const aktywni = zespol.filter((c) => c.aktywny);
  return {
    aktywni: aktywni.length,
    zamawiajacy: aktywni.filter((c) => role[c.rola].skladaZamowienia).length,
    bezLimitu: aktywni.filter((c) => c.limitAkceptacji === null && role[c.rola].skladaZamowienia).length,
  };
}
