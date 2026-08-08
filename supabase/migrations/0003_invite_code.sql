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
    new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.household_invites where code = new_code);
  end loop;

  insert into public.household_invites (code, household_id, created_by)
  values (new_code, target_household, auth.uid());

  return new_code;
end;
$$;
