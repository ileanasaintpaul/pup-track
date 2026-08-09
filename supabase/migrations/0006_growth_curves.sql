drop table if exists public.growth_standards;

alter table public.dogs drop column if exists size_category;
drop type if exists public.size_category;

create type public.size_band as enum (
  'toy', 'small', 'mediumsmall', 'mediumlarge', 'large', 'giant', 'giantplus'
);

create table public.breeds (
  slug text primary key,
  name text not null unique,
  size_band public.size_band not null,
  adult_min_kg numeric(5, 2) not null,
  adult_max_kg numeric(5, 2) not null,
  source text not null,
  check (adult_max_kg > adult_min_kg)
);

create index breeds_name_idx on public.breeds (lower(name));

create table public.growth_curves (
  size_band public.size_band not null,
  sex public.dog_sex not null,
  age_weeks numeric(5, 1) not null check (age_weeks >= 0),
  centile numeric(6, 4) not null check (centile > 0 and centile < 1),
  weight_kg numeric(6, 3) not null check (weight_kg > 0),
  source text not null,
  primary key (size_band, sex, age_weeks, centile)
);

alter table public.dogs add column breed_slug text references public.breeds (slug) on delete set null;

create index dogs_breed_idx on public.dogs (breed_slug);

alter table public.breeds enable row level security;
alter table public.growth_curves enable row level security;

create policy "breeds readable" on public.breeds
  for select to authenticated using (true);

create policy "growth curves readable" on public.growth_curves
  for select to authenticated using (true);

grant select on public.breeds to authenticated;
grant select on public.growth_curves to authenticated;

grant select, insert, update, delete on public.breeds to service_role;
grant select, insert, update, delete on public.growth_curves to service_role;
