-- Profile timestamps for the admin user list (joined + last sign-in).

alter table public.users
  add column if not exists created_at timestamptz not null default now();

alter table public.users
  add column if not exists last_sign_in_at timestamptz;

update public.users as profile
set
  created_at = auth_user.created_at,
  last_sign_in_at = auth_user.last_sign_in_at
from auth.users as auth_user
where auth_user.id = profile.id;

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
  auth_created timestamptz;
  auth_last_sign_in timestamptz;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  display_name := nullif(pg_catalog.btrim(coalesce(p_name, '')), '');
  if display_name is null then
    display_name := coalesce(auth.jwt() ->> 'email', 'User');
  end if;

  select au.created_at, au.last_sign_in_at
    into auth_created, auth_last_sign_in
  from auth.users as au
  where au.id = uid;

  insert into public.users (id, email, name, avatar, created_at, last_sign_in_at)
  values (
    uid,
    coalesce(auth.jwt() ->> 'email', ''),
    display_name,
    coalesce(p_avatar, ''),
    coalesce(auth_created, now()),
    auth_last_sign_in
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    avatar = excluded.avatar,
    last_sign_in_at = coalesce(excluded.last_sign_in_at, public.users.last_sign_in_at);
end;
$$;

revoke all on function public.ensure_user_profile(text, text) from public, anon;
grant execute on function public.ensure_user_profile(text, text) to authenticated;
