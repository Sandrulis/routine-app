-- public.users is the auth profile only (name, email, avatar, is_admin).
-- Team membership / rank lives in the app (localStorage), not on the user row.
-- Placeholder project/task tables from 001 are unused and do not match the current UI.

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  drop column if exists role;

alter table public.users
  drop column if exists manager_id;

create or replace function public.ensure_user_profile(
  p_name text default '',
  p_avatar text default ''
)
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
    display_name := coalesce(auth.jwt() ->> 'email', 'User');
  end if;

  insert into public.users (id, email, name, avatar)
  values (
    uid,
    coalesce(auth.jwt() ->> 'email', ''),
    display_name,
    coalesce(p_avatar, '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    avatar = excluded.avatar;
end;
$$;

revoke all on function public.ensure_user_profile(text, text) from public, anon;
grant execute on function public.ensure_user_profile(text, text) to authenticated;

drop table if exists public.parts cascade;
drop table if exists public.subtasks cascade;
drop table if exists public.tasks cascade;
drop table if exists public.delegation_templates cascade;
drop table if exists public.project_statuses cascade;
drop table if exists public.projects cascade;
