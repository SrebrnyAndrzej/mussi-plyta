import type { Promocja } from "@/lib/promocje";

/**
 * Promocje zalążkowe. Treść pochodzi od hurtowni i po podpięciu bazy
 * będzie edytowana wyłącznie w panelu pracownika.
 *
 * Daty są względne wobec dnia uruchomienia, żeby demonstracja nie pokazywała
 * przecen, które skończyły się w zeszłym tygodniu.
 */
function zaDni(ile: number): string {
  const d = new Date();
  d.setDate(d.getDate() + ile);
  return d.toISOString().slice(0, 10);
}

export const promocjeDemo: Promocja[] = [
  {
    id: "blum-zawiasy",
    tytul: "Zawiasy Blum taniej o 25%",
    opis: "CLIP top BLUMOTION przy zamówieniu od 50 sztuk. Rabat liczy się do progu kontrahenta.",
    etykieta: "-25%",
    producent: "Blum",
    odnosnik: "/katalog",
    grafika: "/promocje/blum-zawias.png",
    obowiazujeOd: zaDni(-3),
    obowiazujeDo: zaDni(11),
    aktywna: true,
    kolejnosc: 1,
  },
  {
    id: "gtv-led",
    tytul: "Oświetlenie GTV, drugi profil za pół ceny",
    opis: "Przy zakupie kompletu profil plus zasilacz. Do wyczerpania zapasu.",
    etykieta: "-50%",
    producent: "GTV",
    odnosnik: "/katalog",
    grafika: null,
    obowiazujeOd: zaDni(-1),
    obowiazujeDo: zaDni(20),
    aktywna: true,
    kolejnosc: 2,
  },
  {
    id: "ciecie-gratis",
    tytul: "Cięcie gratis od 10 płyt",
    opis: "Zamówienie złożone przez portal, odbiór własny w Zielonej Górze.",
    etykieta: "gratis",
    producent: null,
    odnosnik: "/kreator",
    grafika: null,
    obowiazujeOd: zaDni(0),
    obowiazujeDo: null,
    aktywna: true,
    kolejnosc: 3,
  },
  {
    id: "obrzeza-hranipex",
    tytul: "Obrzeża Hranipex, wiosenna wyprzedaż",
    opis: "Końcówki rolek w wybranych dekorach. Szczegóły u handlowca.",
    etykieta: "-30%",
    producent: "Hranipex",
    odnosnik: null,
    grafika: null,
    obowiazujeOd: zaDni(14),
    obowiazujeDo: zaDni(30),
    aktywna: true,
    kolejnosc: 4,
  },
];
