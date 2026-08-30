-- Schemat bazy dla portalu B2B Mussi-Płyta.
--
-- Odwzorowuje typy z `src/lib`, żeby podpięcie bazy było podmianą implementacji
-- w `src/lib/repo.ts`, a nie przepisywaniem silników. Nazwy kolumn trzymają się
-- polskiego nazewnictwa z kodu.
--
-- Nie jest jeszcze zastosowany. Wymaga projektu Supabase, którego nie mamy.

-- ---------------------------------------------------------------------------
-- Firmy i ludzie
-- ---------------------------------------------------------------------------

create table kontrahenci (
  id              text primary key,
  nazwa           text        not null,
  kod_progu       text        not null,
  forma_platnosci text        not null
    check (forma_platnosci in ('przedplata','pobranie','przelew-7','przelew-14','przelew-21','limit-kupiecki')),
  limit_przyznany numeric(12,2) not null default 0 check (limit_przyznany >= 0),
  limit_wykorzystany numeric(12,2) not null default 0 check (limit_wykorzystany >= 0),
  obrot_roczny    numeric(12,2) not null default 0,
  status          text        not null default 'weryfikacja'
    check (status in ('aktywny','weryfikacja','blokada')),
  utworzony       timestamptz not null default now(),
  constraint limit_nie_ponizej_wykorzystania check (limit_przyznany >= limit_wykorzystany)
);

create table czlonkowie (
  id               text primary key,
  kontrahent_id    text not null references kontrahenci(id) on delete cascade,
  imie             text not null,
  email            text not null unique,
  rola             text not null check (rola in ('wlasciciel','kupujacy','podglad')),
  -- Null oznacza brak limitu, czyli rolę bez ograniczenia kwotowego.
  limit_akceptacji numeric(12,2) check (limit_akceptacji is null or limit_akceptacji >= 0),
  aktywny          boolean not null default true
);

create index czlonkowie_kontrahent on czlonkowie(kontrahent_id);

-- Konto nie może zostać bez gospodarza. Pilnuje tego wyzwalacz, bo warunek
-- dotyczy zbioru wierszy, a nie pojedynczego.
create or replace function pilnuj_wlasciciela() returns trigger as $$
begin
  if (select count(*) from czlonkowie
      where kontrahent_id = coalesce(old.kontrahent_id, new.kontrahent_id)
        and rola = 'wlasciciel' and aktywny) = 0 then
    raise exception 'Kontrahent % musi mieć co najmniej jednego aktywnego właściciela',
      coalesce(old.kontrahent_id, new.kontrahent_id);
  end if;
  return null;
end;
$$ language plpgsql;

create constraint trigger czlonkowie_wlasciciel
  after update or delete on czlonkowie
  deferrable initially deferred
  for each row execute function pilnuj_wlasciciela();

-- ---------------------------------------------------------------------------
-- Cenniki
-- ---------------------------------------------------------------------------

create table cenniki (
  id             text primary key,
  nazwa          text not null,
  obowiazuje_od  date not null,
  obowiazuje_do  date,
  constraint okres_poprawny check (obowiazuje_do is null or obowiazuje_do >= obowiazuje_od)
);

create table ceny_cennika (
  cennik_id text not null references cenniki(id) on delete cascade,
  sku       text not null,
  cena      numeric(12,2) not null check (cena >= 0),
  primary key (cennik_id, sku)
);

create table ceny_indywidualne (
  kontrahent_id text not null references kontrahenci(id) on delete cascade,
  sku           text not null,
  cena          numeric(12,2) not null check (cena >= 0),
  obowiazuje_od date not null,
  obowiazuje_do date,
  primary key (kontrahent_id, sku, obowiazuje_od),
  constraint okres_poprawny check (obowiazuje_do is null or obowiazuje_do >= obowiazuje_od)
);

-- ---------------------------------------------------------------------------
-- Zamówienia i wersje
-- ---------------------------------------------------------------------------

create table zamowienia (
  id                  text primary key,
  kontrahent_id       text not null references kontrahenci(id),
  status              text not null check (status in (
    'szkic','do-potwierdzenia','okno-zmian','zablokowane','oczekuje-na-towar',
    'w-produkcji','gotowe-do-odbioru','w-dostawie','zrealizowane','anulowane')),
  -- Chwila przyjęcia przez system. Od niej liczy się okno zmian.
  przyjete_o          timestamptz,
  termin_oczekiwany   date,
  termin_potwierdzony date,
  utworzone           timestamptz not null default now()
);

create index zamowienia_kontrahent on zamowienia(kontrahent_id, status);

create table wersje_zamowien (
  zamowienie_id text not null references zamowienia(id) on delete cascade,
  numer         integer not null check (numer >= 1),
  wartosc_netto numeric(12,2) not null check (wartosc_netto >= 0),
  prognoza      date,
  utworzona     timestamptz not null default now(),
  autor         text not null,
  -- Pierwsza wersja nie ma powodu, każda kolejna musi go mieć.
  powod         text,
  primary key (zamowienie_id, numer),
  constraint powod_wymagany_od_drugiej check (numer = 1 or powod is not null)
);

create table pozycje_wersji (
  zamowienie_id text not null,
  numer_wersji  integer not null,
  pozycja_id    text not null,
  sku           text not null,
  nazwa         text not null,
  kategoria     text not null check (kategoria in ('materialy','obrzeza','akcesoria','uslugi')),
  ilosc         integer not null check (ilosc >= 1),
  netto         numeric(12,2) not null check (netto >= 0),
  primary key (zamowienie_id, numer_wersji, pozycja_id),
  foreign key (zamowienie_id, numer_wersji)
    references wersje_zamowien(zamowienie_id, numer) on delete cascade
);

create table wnioski_o_zmiane (
  id            bigserial primary key,
  zamowienie_id text not null references zamowienia(id) on delete cascade,
  tresc         text not null check (length(trim(tresc)) >= 10),
  autor         text not null,
  zlozony       timestamptz not null default now(),
  stan          text not null default 'zlozony' check (stan in ('zlozony','przyjety','odrzucony'))
);

-- ---------------------------------------------------------------------------
-- Rezerwacje
-- ---------------------------------------------------------------------------

create table rezerwacje (
  id            text primary key,
  zamowienie_id text not null references zamowienia(id) on delete cascade,
  sku           text not null,
  ilosc         integer not null check (ilosc >= 1),
  utworzona     timestamptz not null default now(),
  -- Null oznacza rezerwację twardą, która nie wygasa.
  wygasa        timestamptz,
  stan          text not null default 'aktywna'
    check (stan in ('aktywna','wygasla','zwolniona','wydana'))
);

-- Jedno zamówienie ma najwyżej jedną żywą rezerwację na indeks. To jest
-- właściwa ochrona przed podwójną sprzedażą: aplikacja liczy dostępność,
-- ale to baza nie pozwala jej złamać przy równoczesnych zapisach.
create unique index rezerwacje_zywe
  on rezerwacje(zamowienie_id, sku)
  where stan = 'aktywna';

create index rezerwacje_wg_sku on rezerwacje(sku) where stan = 'aktywna';

-- ---------------------------------------------------------------------------
-- Podmioty fakturujące i dokumenty
-- ---------------------------------------------------------------------------

create table podmioty_fakturujace (
  id             text primary key,
  nazwa_robocza  text not null,
  zakres         text not null,
  nazwa_prawna   text,
  nip            text,
  regon          text,
  adres          text,
  rachunek       text,
  seria_faktury  text,
  seria_korekty  text,
  seria_wz       text,
  ksef           text not null default 'niepodlaczony'
    check (ksef in ('podlaczony','niepodlaczony'))
);

create table dokumenty (
  id            text primary key,
  rodzaj        text not null check (rodzaj in ('potwierdzenie','wz','faktura','korekta')),
  numer         text,
  zamowienie_id text not null references zamowienia(id),
  wersja        integer not null,
  podmiot_id    text references podmioty_fakturujace(id),
  -- Migawka danych rejestrowych z chwili wystawienia. Zmiana kartoteki
  -- nie może ruszyć dokumentu, który już wyszedł.
  migawka       jsonb,
  netto         numeric(12,2) not null,
  vat           numeric(12,2) not null,
  brutto        numeric(12,2) not null,
  wystawiony    timestamptz not null default now(),
  autor         text not null,
  koryguje      text references dokumenty(id),
  ksef          text not null default 'nie-dotyczy'
    check (ksef in ('nie-dotyczy','oczekuje','wyslany','blad'))
);

create unique index dokumenty_numer on dokumenty(numer) where numer is not null;
create index dokumenty_zamowienie on dokumenty(zamowienie_id);

-- ---------------------------------------------------------------------------
-- Audyt
-- ---------------------------------------------------------------------------

-- Jeden dziennik na wszystkie zmiany wymagające powodu: podmiot na pozycji,
-- warunki handlowe, status zamówienia, korekta stanu magazynowego.
create table audyt (
  id         bigserial primary key,
  obszar     text not null check (obszar in ('zamowienie','warunki','fakturowanie','magazyn','zespol')),
  klucz      text not null,
  opis       text not null,
  przed      text,
  po         text,
  powod      text,
  autor      text not null,
  kiedy      timestamptz not null default now()
);

create index audyt_obszar on audyt(obszar, klucz, kiedy desc);
