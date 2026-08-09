alter table public.skills add column source text;
alter table public.skills add column level text;

alter table public.dog_skills add column favourite boolean not null default false;

create table public.skill_collections (
  slug text primary key,
  name text not null,
  description text,
  source text,
  sort_order int not null default 0
);

create table public.skill_collection_items (
  collection_slug text not null references public.skill_collections (slug) on delete cascade,
  skill_slug text not null references public.skills (slug) on delete cascade,
  position int not null,
  start_age_weeks int check (start_age_weeks >= 0),
  note text,
  primary key (collection_slug, skill_slug)
);

create index skill_collection_items_order_idx
  on public.skill_collection_items (collection_slug, position);

create table public.dog_lists (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index dog_lists_dog_idx on public.dog_lists (dog_id, position);

create table public.dog_list_items (
  list_id uuid not null references public.dog_lists (id) on delete cascade,
  skill_slug text not null references public.skills (slug) on delete cascade,
  position int not null,
  primary key (list_id, skill_slug)
);

create index dog_list_items_order_idx on public.dog_list_items (list_id, position);

create or replace function public.can_access_list(target_list uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dog_lists l
    join public.dogs d on d.id = l.dog_id
    join public.household_members m on m.household_id = d.household_id
    where l.id = target_list
      and m.user_id = auth.uid()
  );
$$;

alter table public.skill_collections enable row level security;
alter table public.skill_collection_items enable row level security;
alter table public.dog_lists enable row level security;
alter table public.dog_list_items enable row level security;

create policy "collections readable" on public.skill_collections
  for select to authenticated using (true);

create policy "collection items readable" on public.skill_collection_items
  for select to authenticated using (true);

create policy "dog lists accessible to household" on public.dog_lists
  for all to authenticated
  using (public.can_access_dog(dog_id))
  with check (public.can_access_dog(dog_id));

create policy "list items accessible to household" on public.dog_list_items
  for all to authenticated
  using (public.can_access_list(list_id))
  with check (public.can_access_list(list_id));

grant select on public.skill_collections to authenticated;
grant select on public.skill_collection_items to authenticated;
grant select, insert, update, delete on public.dog_lists to authenticated;
grant select, insert, update, delete on public.dog_list_items to authenticated;

grant select, insert, update, delete on public.skills to service_role;
grant select, insert, update, delete on public.skill_collections to service_role;
grant select, insert, update, delete on public.skill_collection_items to service_role;

alter publication supabase_realtime add table public.dog_lists, public.dog_list_items;
