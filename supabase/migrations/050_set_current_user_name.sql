-- Allow authenticated users to update their own display name.

create or replace function public.set_current_user_name(p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  display_name text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  display_name := nullif(pg_catalog.btrim(coalesce(p_name, '')), '');
  if display_name is null then
    raise exception 'Name is required';
  end if;

  update public.users
  set name = display_name
  where id = uid;

  update public.team_members
  set name = display_name
  where user_id = uid;
end;
$$;

revoke all on function public.set_current_user_name(text) from public, anon;
grant execute on function public.set_current_user_name(text) to authenticated;
