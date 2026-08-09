create type public.health_event_type as enum (
  'vaccine', 'deworming', 'flea_tick', 'vet_visit', 'other'
);

create table public.health_events (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  type public.health_event_type not null,
  label text not null,
  occurred_on date not null default current_date,
  next_due_on date,
  notes text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (next_due_on is null or next_due_on >= occurred_on)
);

create index health_events_dog_idx on public.health_events (dog_id, occurred_on desc);
create index health_events_due_idx on public.health_events (dog_id, next_due_on)
  where next_due_on is not null;

alter table public.health_events enable row level security;

create policy "health events accessible to household" on public.health_events
  for all to authenticated
  using (public.can_access_dog(dog_id))
  with check (public.can_access_dog(dog_id));

grant select, insert, update, delete on public.health_events to authenticated;

alter publication supabase_realtime add table public.health_events;
