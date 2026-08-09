create table public.skills (
  slug text primary key,
  name text not null,
  category text not null,
  description text,
  min_age_weeks int not null default 8 check (min_age_weeks >= 0),
  sort_order int not null default 0
);

create table public.dog_skills (
  dog_id uuid not null references public.dogs (id) on delete cascade,
  skill_slug text not null references public.skills (slug) on delete cascade,
  level int not null default 0 check (level between 0 and 4),
  started_on date,
  updated_at timestamptz not null default now(),
  primary key (dog_id, skill_slug)
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  skill_slug text references public.skills (slug) on delete set null,
  occurred_on date not null default current_date,
  duration_min int check (duration_min between 1 and 240),
  success_rate int check (success_rate between 0 and 100),
  environment text,
  notes text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index training_sessions_dog_idx on public.training_sessions (dog_id, occurred_on desc);
create index training_sessions_skill_idx on public.training_sessions (dog_id, skill_slug, occurred_on);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger dog_skills_touch
  before update on public.dog_skills
  for each row execute function public.touch_updated_at();

alter table public.skills enable row level security;
alter table public.dog_skills enable row level security;
alter table public.training_sessions enable row level security;

create policy "skills readable" on public.skills
  for select to authenticated using (true);

create policy "dog skills accessible to household" on public.dog_skills
  for all to authenticated
  using (public.can_access_dog(dog_id))
  with check (public.can_access_dog(dog_id));

create policy "training sessions accessible to household" on public.training_sessions
  for all to authenticated
  using (public.can_access_dog(dog_id))
  with check (public.can_access_dog(dog_id));

grant select on public.skills to authenticated;
grant select, insert, update, delete on public.dog_skills to authenticated;
grant select, insert, update, delete on public.training_sessions to authenticated;

alter publication supabase_realtime add table public.dog_skills, public.training_sessions;

insert into public.skills (slug, name, category, description, min_age_weeks, sort_order) values
  ('nom', 'Réponse au nom', 'base', 'Le chiot tourne la tête vers toi quand tu dis son nom.', 8, 10),
  ('proprete', 'Propreté', 'base', 'Éliminations dehors, sorties fréquentes et récompensées.', 8, 20),
  ('inhibition', 'Inhibition de morsure', 'base', 'Contrôler la pression de la mâchoire pendant le jeu.', 8, 30),
  ('manipulation', 'Manipulation & soins', 'base', 'Se laisser toucher pattes, oreilles, dents, brosser.', 8, 40),
  ('solitude', 'Solitude', 'base', 'Rester seul par durées croissantes, sans détresse.', 8, 50),
  ('retour-au-calme', 'Retour au calme', 'quotidien', 'Redescendre en excitation après un jeu ou une visite.', 8, 60),
  ('panier', 'Panier', 'quotidien', 'Aller au panier sur demande et y rester.', 8, 70),
  ('rappel', 'Rappel', 'obeissance', 'Revenir vers toi immédiatement quand tu appelles.', 8, 80),
  ('assis', 'Assis', 'obeissance', 'S''asseoir sur demande.', 8, 90),
  ('couche', 'Couché', 'obeissance', 'Se coucher sur demande.', 9, 100),
  ('marche-laisse', 'Marche en laisse', 'exterieur', 'Marcher sans tirer, laisse détendue.', 10, 110),
  ('lache', 'Lâche', 'securite', 'Relâcher un objet tenu en gueule.', 10, 120),
  ('pas-bouger', 'Pas bouger', 'obeissance', 'Tenir la position malgré la durée et la distance.', 12, 130),
  ('pas-toucher', 'Pas toucher', 'securite', 'Ignorer un objet ou de la nourriture au sol.', 12, 140);
