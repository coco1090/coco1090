-- Schéma du site mariage (v2 : sans codes ni foyers). À coller dans Supabase > SQL Editor.
-- Si les anciennes tables existent, on les supprime d'abord.
drop table if exists guests;
drop table if exists households;

create extension if not exists "pgcrypto";

-- Une réponse = un formulaire envoyé par un invité (pour lui et ses accompagnants)
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  last_name text not null,
  first_name text not null,
  email text,
  phone text,
  address text,
  attending boolean not null,            -- true présent, false absent
  message text,
  created_at timestamptz not null default now()
);

-- Chaque personne couverte par la réponse (la personne qui répond + accompagnants)
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  is_child boolean not null default false,
  has_allergies boolean not null default false,
  allergy_details text,
  position int not null default 0
);

create index if not exists people_response_idx on people(response_id);

-- RLS activée, aucune policy : seule la clé service_role (côté serveur) peut lire/écrire.
alter table responses enable row level security;
alter table people enable row level security;
