-- PupTrack — fondations
--
-- Modèle de partage : un « foyer » (household) regroupe plusieurs utilisateurs
-- (les deux maîtres du chien). Les données du chien appartiennent au foyer,
-- jamais à un utilisateur : les deux membres voient et éditent les mêmes lignes.
--
-- Les tables métier (éducation, santé, journal…) arriveront dans des migrations
-- suivantes, une par feature.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Utilisateurs & foyers
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ma maison',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create type public.household_role as enum ('owner', 'member');

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.household_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_idx on public.household_members (user_id);

-- Codes d'invitation : le second maître rejoint le foyer avec un code court.
create table public.household_invites (
  code text primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Chien
-- ---------------------------------------------------------------------------

create type public.dog_sex as enum ('male', 'female');

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  breed text,
  sex public.dog_sex,
  birth_date date,
  adoption_date date,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index dogs_household_idx on public.dogs (household_id);

-- ---------------------------------------------------------------------------
-- Sécurité (RLS)
-- ---------------------------------------------------------------------------

-- security definer : contourne la RLS de household_members pour éviter une
-- récursion infinie quand la fonction sert dans les policies de cette table.
create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = target_household
      and m.user_id = auth.uid()
  );
$$;

-- Utilisée par les futures tables rattachées à un chien.
create or replace function public.can_access_dog(target_dog uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dogs d
    join public.household_members m on m.household_id = d.household_id
    where d.id = target_dog
      and m.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.dogs enable row level security;

-- Profils : chacun gère le sien, et voit celui des autres membres de son foyer.
create policy "own profile" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "household profiles readable" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.household_members mine
      join public.household_members theirs on theirs.household_id = mine.household_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

-- Foyers
create policy "household readable by members" on public.households
  for select to authenticated using (public.is_household_member(id));

create policy "household created by self" on public.households
  for insert to authenticated with check (created_by = auth.uid());

create policy "household updatable by members" on public.households
  for update to authenticated
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

-- Membres
create policy "members readable" on public.household_members
  for select to authenticated using (public.is_household_member(household_id));

create policy "members insertable" on public.household_members
  for insert to authenticated
  with check (
    public.is_household_member(household_id)
    or exists (
      select 1 from public.households h
      where h.id = household_id and h.created_by = auth.uid()
    )
  );

create policy "members removable" on public.household_members
  for delete to authenticated using (public.is_household_member(household_id));

-- Invitations : gérées par les membres. Rejoindre passe par la fonction
-- join_household_with_code (security definer), pas par un select direct.
create policy "invites managed by members" on public.household_invites
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- Chiens
create policy "dogs accessible to household" on public.dogs
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- Fonctions applicatives
-- ---------------------------------------------------------------------------

-- Crée le profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Crée un foyer et y place son créateur comme propriétaire.
create or replace function public.create_household(household_name text default 'Ma maison')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentification requise';
  end if;

  insert into public.households (name, created_by)
  values (coalesce(nullif(trim(household_name), ''), 'Ma maison'), auth.uid())
  returning id into new_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

-- Génère un code d'invitation à 8 caractères.
create or replace function public.create_household_invite(target_household uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not public.is_household_member(target_household) then
    raise exception 'accès refusé au foyer';
  end if;

  loop
    new_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
    exit when not exists (select 1 from public.household_invites where code = new_code);
  end loop;

  insert into public.household_invites (code, household_id, created_by)
  values (new_code, target_household, auth.uid());

  return new_code;
end;
$$;

-- Rejoint un foyer avec un code d'invitation.
create or replace function public.join_household_with_code(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.household_invites;
begin
  if auth.uid() is null then
    raise exception 'authentification requise';
  end if;

  select * into invite
  from public.household_invites
  where code = upper(trim(invite_code))
  for update;

  if not found then
    raise exception 'code invalide';
  end if;
  if invite.used_at is not null then
    raise exception 'code déjà utilisé';
  end if;
  if invite.expires_at < now() then
    raise exception 'code expiré';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (invite.household_id, auth.uid(), 'member')
  on conflict do nothing;

  update public.household_invites
  set used_at = now(), used_by = auth.uid()
  where code = invite.code;

  return invite.household_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Realtime : ce que l'un enregistre apparaît chez l'autre sans rechargement.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.dogs;
