create table public.height_entries (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  measured_on date not null default current_date,
  withers_cm numeric(5, 1) not null check (withers_cm > 0 and withers_cm < 120),
  note text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (dog_id, measured_on)
);

create index height_entries_dog_idx on public.height_entries (dog_id, measured_on desc);

alter table public.height_entries enable row level security;

create policy "heights accessible to household" on public.height_entries
  for all to authenticated
  using (public.can_access_dog(dog_id))
  with check (public.can_access_dog(dog_id));

grant select, insert, update, delete on public.height_entries to authenticated;

alter publication supabase_realtime add table public.height_entries;
