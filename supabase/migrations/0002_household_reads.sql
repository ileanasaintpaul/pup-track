-- Deux prérequis pour lire le foyer depuis le client.

-- 1. Les policies RLS filtrent les lignes, mais Postgres exige en plus des
--    droits au niveau de la table. Sans ces GRANT, l'API répond 42501
--    « permission denied for table ».

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.households,
  public.household_members,
  public.household_invites,
  public.dogs
to authenticated;

-- Les tables ajoutées par les prochaines migrations héritent des mêmes droits.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- 2. household_members.user_id pointe vers auth.users : PostgREST ne sait donc
--    pas joindre les profils (« Could not find a relationship »). On ajoute la
--    clé étrangère vers profiles, alimentée par le trigger on_auth_user_created.

alter table public.household_members
  add constraint household_members_profile_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
