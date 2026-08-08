grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.households,
  public.household_members,
  public.household_invites,
  public.dogs
to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to authenticated;

alter table public.household_members
  add constraint household_members_profile_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
