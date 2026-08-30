-- Izolacja danych między firmami klientowskimi.
--
-- Specyfikacja w sekcji „Bezpieczeństwo" wymaga pełnej izolacji i sprawdzania
-- uprawnień po stronie serwera przy każdej operacji. Bramka sesji w interfejsie
-- jest tylko zasłoną: to te reguły są zabezpieczeniem.
--
-- Model: zalogowany użytkownik ma w tokenie `kontrahent_id` oraz `rola`.
-- Pracownik hurtowni ma rolę `hurtownia` i widzi wszystko.

create or replace function moj_kontrahent() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'kontrahent_id', '');
$$ language sql stable;

create or replace function jestem_hurtownia() returns boolean as $$
  select coalesce(current_setting('request.jwt.claims', true)::json ->> 'rola', '') = 'hurtownia';
$$ language sql stable;

alter table kontrahenci        enable row level security;
alter table czlonkowie         enable row level security;
alter table ceny_indywidualne  enable row level security;
alter table zamowienia         enable row level security;
alter table wersje_zamowien    enable row level security;
alter table pozycje_wersji     enable row level security;
alter table wnioski_o_zmiane   enable row level security;
alter table rezerwacje         enable row level security;
alter table dokumenty          enable row level security;
alter table audyt              enable row level security;

-- Cenniki są wspólne, ceny indywidualne już nie.
alter table cenniki      enable row level security;
alter table ceny_cennika enable row level security;
create policy cennik_czyta_kazdy on cenniki      for select using (true);
create policy ceny_czyta_kazdy   on ceny_cennika for select using (true);

-- Kontrahent widzi wyłącznie siebie.
create policy kontrahent_swoj on kontrahenci
  for select using (jestem_hurtownia() or id = moj_kontrahent());

create policy czlonek_swoj on czlonkowie
  for select using (jestem_hurtownia() or kontrahent_id = moj_kontrahent());

create policy cena_indywidualna_swoja on ceny_indywidualne
  for select using (jestem_hurtownia() or kontrahent_id = moj_kontrahent());

-- Zamówienia i wszystko, co z nich wynika.
create policy zamowienie_swoje on zamowienia
  for select using (jestem_hurtownia() or kontrahent_id = moj_kontrahent());

create policy wersja_swoja on wersje_zamowien
  for select using (jestem_hurtownia() or exists (
    select 1 from zamowienia z
    where z.id = wersje_zamowien.zamowienie_id and z.kontrahent_id = moj_kontrahent()));

create policy pozycja_swoja on pozycje_wersji
  for select using (jestem_hurtownia() or exists (
    select 1 from zamowienia z
    where z.id = pozycje_wersji.zamowienie_id and z.kontrahent_id = moj_kontrahent()));

create policy wniosek_swoj on wnioski_o_zmiane
  for select using (jestem_hurtownia() or exists (
    select 1 from zamowienia z
    where z.id = wnioski_o_zmiane.zamowienie_id and z.kontrahent_id = moj_kontrahent()));

create policy dokument_swoj on dokumenty
  for select using (jestem_hurtownia() or exists (
    select 1 from zamowienia z
    where z.id = dokumenty.zamowienie_id and z.kontrahent_id = moj_kontrahent()));

-- Rezerwacje widzi wyłącznie hurtownia. Klient ma znać skutek, czyli termin
-- i komunikat dostępności, a nie stany magazynowe i cudze blokady.
create policy rezerwacja_tylko_hurtownia on rezerwacje
  for select using (jestem_hurtownia());

-- Audyt czyta wyłącznie hurtownia. Zawiera powody decyzji handlowych.
create policy audyt_tylko_hurtownia on audyt
  for select using (jestem_hurtownia());

-- Zapis idzie przez funkcje po stronie serwera, nie wprost z przeglądarki.
-- Brak polityk INSERT, UPDATE i DELETE jest tu decyzją, nie przeoczeniem:
-- domyślnie odmawiają, a zapisy przechodzą przez role serwisową.
