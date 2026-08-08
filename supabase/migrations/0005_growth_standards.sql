create type public.size_category as enum ('toy', 'small', 'medium', 'large', 'giant');

alter table public.dogs add column size_category public.size_category;

create table public.growth_standards (
  id bigint generated always as identity primary key,
  breed text,
  size_category public.size_category,
  age_weeks int not null check (age_weeks >= 0),
  weight_min_kg numeric(5, 2) not null check (weight_min_kg > 0),
  weight_max_kg numeric(5, 2) not null,
  check (weight_max_kg >= weight_min_kg),
  check (breed is not null or size_category is not null)
);

create unique index growth_standards_breed_idx
  on public.growth_standards (lower(breed), age_weeks) where breed is not null;

create unique index growth_standards_size_idx
  on public.growth_standards (size_category, age_weeks) where breed is null;

alter table public.growth_standards enable row level security;

create policy "growth standards readable" on public.growth_standards
  for select to authenticated using (true);

grant select on public.growth_standards to authenticated;

insert into public.growth_standards (breed, size_category, age_weeks, weight_min_kg, weight_max_kg) values
  (null, 'toy', 8, 0.44, 0.88),
  (null, 'toy', 12, 0.7, 1.4),
  (null, 'toy', 16, 0.96, 1.92),
  (null, 'toy', 20, 1.16, 2.32),
  (null, 'toy', 24, 1.34, 2.68),
  (null, 'toy', 32, 1.6, 3.2),
  (null, 'toy', 40, 1.78, 3.56),
  (null, 'toy', 52, 2.0, 4.0),
  (null, 'small', 8, 1.1, 2.2),
  (null, 'small', 12, 1.75, 3.5),
  (null, 'small', 16, 2.4, 4.8),
  (null, 'small', 20, 2.9, 5.8),
  (null, 'small', 24, 3.35, 6.7),
  (null, 'small', 32, 4.0, 8.0),
  (null, 'small', 40, 4.45, 8.9),
  (null, 'small', 52, 5.0, 10.0),
  (null, 'medium', 8, 2.2, 5.5),
  (null, 'medium', 12, 3.5, 8.75),
  (null, 'medium', 16, 4.8, 12.0),
  (null, 'medium', 20, 5.8, 14.5),
  (null, 'medium', 24, 6.7, 16.75),
  (null, 'medium', 32, 8.0, 20.0),
  (null, 'medium', 40, 8.9, 22.25),
  (null, 'medium', 52, 10.0, 25.0),
  (null, 'large', 8, 5.5, 8.8),
  (null, 'large', 12, 8.75, 14.0),
  (null, 'large', 16, 12.0, 19.2),
  (null, 'large', 20, 14.5, 23.2),
  (null, 'large', 24, 16.75, 26.8),
  (null, 'large', 32, 20.0, 32.0),
  (null, 'large', 40, 22.25, 35.6),
  (null, 'large', 52, 25.0, 40.0),
  (null, 'giant', 8, 8.8, 15.4),
  (null, 'giant', 12, 14.0, 24.5),
  (null, 'giant', 16, 19.2, 33.6),
  (null, 'giant', 20, 23.2, 40.6),
  (null, 'giant', 24, 26.8, 46.9),
  (null, 'giant', 32, 32.0, 56.0),
  (null, 'giant', 40, 35.6, 62.3),
  (null, 'giant', 52, 40.0, 70.0),
  ('Welsh Corgi Pembroke', 'small', 8, 2.5, 3.5),
  ('Welsh Corgi Pembroke', 'small', 12, 4.0, 5.5),
  ('Welsh Corgi Pembroke', 'small', 16, 5.5, 7.5),
  ('Welsh Corgi Pembroke', 'small', 20, 7.0, 9.0),
  ('Welsh Corgi Pembroke', 'small', 24, 8.0, 10.0),
  ('Welsh Corgi Pembroke', 'small', 32, 9.0, 11.5),
  ('Welsh Corgi Pembroke', 'small', 40, 9.5, 12.5),
  ('Welsh Corgi Pembroke', 'small', 52, 10.0, 13.5);
