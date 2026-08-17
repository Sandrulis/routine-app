-- First registered user becomes system admin. Later inserts stay is_admin = false.

alter table public.users
  add column if not exists is_admin boolean not null default false;

alter table public.users
  add column if not exists email text not null default '';

alter table public.users
  alter column avatar set default '';

alter table public.users
  alter column role set default 'Darbinieks';

alter table public.users
  alter column id drop default;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_id_auth_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_id_auth_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end
$$;

create index if not exists users_is_admin_idx
  on public.users (is_admin)
  where is_admin = true;

create or replace function public.users_assign_first_admin()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('public.users.first_admin')
  );

  if not exists (select 1 from public.users) then
    new.is_admin := true;
  else
    new.is_admin := false;
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
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  display_name := nullif(pg_catalog.btrim(coalesce(p_name, '')), '');
  if display_name is null then
    display_name := coalesce(auth.jwt() ->> 'email', 'User');
  end if;

  insert into public.users (id, email, name, avatar, role)
  values (
    uid,
    coalesce(auth.jwt() ->> 'email', ''),
    display_name,
    coalesce(p_avatar, ''),
    'Darbinieks'
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
