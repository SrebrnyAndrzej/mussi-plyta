import { dekory, type Dekor, type Kategoria } from "@/data/dekory";
import { funkcje } from "@/config/brief";

/**
 * Szew między UI a źródłem danych.
 *
 * Dziś czyta dane zalążkowe z pliku. Po podpięciu Supabase podmieniamy
 * wyłącznie implementację w `supabaseRepo`, a komponenty zostają bez zmian.
 * Dlatego wszystko jest async, choć teraz nic nie czeka na sieć.
 */
export interface KatalogRepo {
  wszystkie(): Promise<Dekor[]>;
  wgKategorii(kategoria: Kategoria): Promise<Dekor[]>;
  szukaj(fraza: string): Promise<Dekor[]>;
  wgId(id: string): Promise<Dekor | null>;
}

const seedRepo: KatalogRepo = {
  async wszystkie() {
    return dekory;
  },
  async wgKategorii(kategoria) {
    return dekory.filter((d) => d.kategoria === kategoria);
  },
  async szukaj(fraza) {
    const q = fraza.trim().toLowerCase();
    if (!q) return dekory;
    return dekory.filter((d) =>
      [d.kod, d.nazwa, d.producent, d.opis].join(" ").toLowerCase().includes(q),
    );
  },
  async wgId(id) {
    return dekory.find((d) => d.id === id) ?? null;
  },
};

/**
 * Miejsce na implementację opartą o Supabase.
 * Celowo rzuca, żeby nikt nie włączył flagi bez podpięcia bazy.
 */
const supabaseRepo: KatalogRepo = {
  async wszystkie() {
    throw new Error("Repozytorium Supabase nie jest jeszcze podpięte.");
  },
  async wgKategorii() {
    throw new Error("Repozytorium Supabase nie jest jeszcze podpięte.");
  },
  async szukaj() {
    throw new Error("Repozytorium Supabase nie jest jeszcze podpięte.");
  },
  async wgId() {
    throw new Error("Repozytorium Supabase nie jest jeszcze podpięte.");
  },
};

export const katalog: KatalogRepo = funkcje.supabase ? supabaseRepo : seedRepo;
