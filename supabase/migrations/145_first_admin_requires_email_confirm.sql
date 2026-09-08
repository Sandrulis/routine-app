-- First system admin only after the auth email is confirmed.
-- Unconfirmed custom-email signups must not get is_admin or look like admins.

create or replace function public.users_assign_first_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('public.users.first_admin')
  );

  if not exists (
    select 1
    from auth.users as au
    where au.id = new.id
      and au.email_confirmed_at is not null
  ) then
    new.is_admin := false;
    return new;
  end if;

  if exists (
    select 1
    from public.users as u
    where u.is_admin = true
  ) then
    new.is_admin := false;
  else
    new.is_admin := true;
  end if;

  return new;
end;
$$;

drop trigger if exists users_assign_first_admin on public.users;
create trigger users_assign_first_admin
  before insert on public.users
  for each row
  execute function public.users_assign_first_admin();

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
  auth_confirmed_at timestamptz;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select au.created_at, au.last_sign_in_at, au.email_confirmed_at
    into auth_created, auth_last_sign_in, auth_confirmed_at
  from auth.users as au
  where au.id = uid;

  if auth_confirmed_at is null then
    return;
  end if;

  display_name := nullif(pg_catalog.btrim(coalesce(p_name, '')), '');
  if display_name is null then
    display_name := coalesce(auth.jwt() ->> 'email', 'User');
  end if;

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
    last_sign_in_at = coalesce(excluded.last_sign_in_at, public.users.last_sign_in_at);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('public.users.first_admin')
  );

  if not exists (
    select 1
    from public.users as u
    where u.is_admin = true
  ) then
    update public.users
    set is_admin = true
    where id = uid
      and is_admin = false;
  end if;
end;
$$;

revoke all on function public.ensure_user_profile(text, text) from public, anon;
grant execute on function public.ensure_user_profile(text, text) to authenticated;

create or replace function public.list_unconfirmed_auth_user_ids()
returns table (id uuid)
language sql
stable
security definer
set search_path = pg_catalog, auth
as $$
  select u.id
  from auth.users as u
  where u.email_confirmed_at is null;
$$;

revoke all on function public.list_unconfirmed_auth_user_ids() from public, anon, authenticated;
grant execute on function public.list_unconfirmed_auth_user_ids() to service_role;

update public.users as profile
set is_admin = false
from auth.users as au
where au.id = profile.id
  and au.email_confirmed_at is null
  and profile.is_admin = true;

update public.users as profile
set is_admin = true
where profile.id = (
  select confirmed.id
  from public.users as confirmed
  inner join auth.users as au on au.id = confirmed.id
  where au.email_confirmed_at is not null
  order by confirmed.created_at asc nulls last, confirmed.id asc
  limit 1
)
and not exists (
  select 1
  from public.users as other
  where other.is_admin = true
);
