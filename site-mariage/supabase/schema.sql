-- Schéma du site mariage. À coller dans Supabase > SQL Editor.

create extension if not exists "pgcrypto";

-- Un foyer = une invitation (un code imprimé sur le faire-part)
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- ex: K7M2QX
  name text not null,                        -- ex: "Famille Dupont"
  max_guests int not null default 2,         -- nombre de places prévu par les mariés
  created_at timestamptz not null default now(),
  responded_at timestamptz                   -- null = pas encore répondu
);

-- Chaque personne du foyer a sa propre réponse
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  last_name text not null,
  first_name text not null,
  address text,
  attending boolean,                         -- true présent, false absent, null pas répondu
  is_child boolean not null default false,
  has_allergies boolean not null default false,
  allergy_details text,
  is_companion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guests_household_idx on guests(household_id);

-- RLS activée, aucune policy : seule la clé service_role (côté serveur) peut lire/écrire.
alter table households enable row level security;
alter table guests enable row level security;
