create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric(5, 2) not null check (weight_kg > 0 and weight_kg < 150),
  note text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (dog_id, measured_on)
);

create index weight_entries_dog_idx on public.weight_entries (dog_id, measured_on desc);

alter table public.weight_entries enable row level security;

create policy "weights accessible to household" on public.weight_entries
  for all to authenticated
  using (public.can_access_dog(dog_id))
  with check (public.can_access_dog(dog_id));

grant select, insert, update, delete on public.weight_entries to authenticated;

alter publication supabase_realtime add table public.weight_entries;
