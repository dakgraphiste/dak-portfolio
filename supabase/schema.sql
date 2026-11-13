-- Dak Studio School : base de données de l'espace élève (Supabase)
-- À coller une seule fois dans Supabase → SQL Editor → New query → Run.
-- Règle de sécurité : un élève ne voit que ses propres lignes ; seuls les serveurs du site
-- (clé « service_role », jamais envoyée au navigateur) créent des paiements et des accès.

-- Profils : une ligne par compte, créée automatiquement à l'inscription
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Paiements CinetPay
create table if not exists public.payments (
  transaction_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  item text not null,                 -- 'course:brand-identity' ou 'track:brand-designer'
  amount integer not null,            -- en FCFA
  currency text not null default 'XOF',
  status text not null default 'PENDING',  -- PENDING, ACCEPTED, REFUSED
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Accès aux cours et parcours
create table if not exists public.enrollments (
  user_id uuid not null references auth.users (id) on delete cascade,
  item text not null,
  source text not null default 'paiement',  -- 'paiement' ou 'manuel' (accès donné par Dak)
  transaction_id text references public.payments (transaction_id),
  created_at timestamptz not null default now(),
  primary key (user_id, item)
);

-- Progression : leçons terminées
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  course text not null,
  lesson text not null,               -- identifiant « module-leçon », ex. '2-1'
  done_at timestamptz not null default now(),
  primary key (user_id, course, lesson)
);

alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

drop policy if exists "profil : lecture" on public.profiles;
create policy "profil : lecture" on public.profiles for select using ((select auth.uid()) = id);
drop policy if exists "profil : mise à jour" on public.profiles;
create policy "profil : mise à jour" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "paiements : lecture" on public.payments;
create policy "paiements : lecture" on public.payments for select using ((select auth.uid()) = user_id);

drop policy if exists "accès : lecture" on public.enrollments;
create policy "accès : lecture" on public.enrollments for select using ((select auth.uid()) = user_id);

drop policy if exists "progression : lecture" on public.lesson_progress;
create policy "progression : lecture" on public.lesson_progress for select using ((select auth.uid()) = user_id);
drop policy if exists "progression : ajout" on public.lesson_progress;
create policy "progression : ajout" on public.lesson_progress for insert with check ((select auth.uid()) = user_id);
drop policy if exists "progression : retrait" on public.lesson_progress;
create policy "progression : retrait" on public.lesson_progress for delete using ((select auth.uid()) = user_id);

-- Aucune politique d'écriture sur payments / enrollments : seul le serveur (service_role) peut écrire.
