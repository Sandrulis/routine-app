-- Komandas lomas un pieejas (nav + actions)

create table if not exists public.team_roles (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  slug text not null,
  name text not null,
  sort_order integer not null default 0,
  is_system boolean not null default false,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (team_id, slug)
);

create index if not exists team_roles_team_id_idx on public.team_roles (team_id);

alter table public.team_members
  add column if not exists role_id text references public.team_roles (id) on delete set null;

create index if not exists team_members_role_id_idx on public.team_members (role_id);

alter table public.team_roles enable row level security;

revoke all on table public.team_roles from anon, authenticated;
grant select, insert, update, delete on table public.team_roles to authenticated;

drop policy if exists team_roles_deny_anon on public.team_roles;
create policy team_roles_deny_anon
  on public.team_roles for all to anon using (false) with check (false);

drop policy if exists team_roles_select on public.team_roles;
create policy team_roles_select
  on public.team_roles for select to authenticated
  using (public.is_team_member(team_id));

drop policy if exists team_roles_insert on public.team_roles;
create policy team_roles_insert
  on public.team_roles for insert to authenticated
  with check (public.is_team_owner(team_id));

drop policy if exists team_roles_update on public.team_roles;
create policy team_roles_update
  on public.team_roles for update to authenticated
  using (public.is_team_owner(team_id))
  with check (public.is_team_owner(team_id));

drop policy if exists team_roles_delete on public.team_roles;
create policy team_roles_delete
  on public.team_roles for delete to authenticated
  using (public.is_team_owner(team_id) and is_system = false);

create or replace function public.owner_role_permissions()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "nav": {"dashboard": true, "lists": true, "team": true, "settings": true},
    "actions": {
      "lists.create": true,
      "lists.edit": true,
      "lists.delete": true,
      "tasks.manage": true,
      "team.invite": true,
      "team.roles.manage": true,
      "team.permissions.manage": true,
      "settings.save": true
    }
  }'::jsonb;
$$;

create or replace function public.member_role_permissions()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "nav": {"dashboard": true, "lists": true, "team": true, "settings": true},
    "actions": {
      "lists.create": true,
      "lists.edit": true,
      "lists.delete": false,
      "tasks.manage": true,
      "team.invite": true,
      "team.roles.manage": false,
      "team.permissions.manage": false,
      "settings.save": true
    }
  }'::jsonb;
$$;

create or replace function public.seed_default_team_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
  values
    (
      'role-' || new.id || '-owner',
      new.id,
      'owner',
      'Īpašnieks',
      0,
      true,
      public.owner_role_permissions()
    ),
    (
      'role-' || new.id || '-member',
      new.id,
      'member',
      'Biedrs',
      1,
      true,
      public.member_role_permissions()
    )
  on conflict (team_id, slug) do nothing;
  return new;
end;
$$;

drop trigger if exists teams_seed_default_roles on public.teams;
create trigger teams_seed_default_roles
  after insert on public.teams
  for each row
  execute function public.seed_default_team_roles();

create or replace function public.team_members_sync_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_id text;
  matched_slug text;
begin
  if new.role_id is not null then
    select r.slug into matched_slug
    from public.team_roles as r
    where r.id = new.role_id
      and r.team_id = new.team_id;
    if matched_slug is not null then
      new.role := matched_slug;
    end if;
    return new;
  end if;

  if coalesce(new.role, '') = 'owner' then
    select r.id into matched_id
    from public.team_roles as r
    where r.team_id = new.team_id and r.slug = 'owner'
    limit 1;
  elsif coalesce(new.role, '') <> '' then
    select r.id into matched_id
    from public.team_roles as r
    where r.team_id = new.team_id
      and (r.slug = new.role or r.name = new.role)
    order by r.sort_order
    limit 1;
  end if;

  if matched_id is null then
    select r.id into matched_id
    from public.team_roles as r
    where r.team_id = new.team_id and r.slug = 'member'
    limit 1;
  end if;

  new.role_id := matched_id;
  if matched_id is not null then
    select r.slug into matched_slug
    from public.team_roles as r
    where r.id = matched_id;
    if matched_slug is not null then
      new.role := matched_slug;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists team_members_sync_role on public.team_members;
create trigger team_members_sync_role
  before insert or update of role, role_id on public.team_members
  for each row
  execute function public.team_members_sync_role();

revoke all on function public.owner_role_permissions() from public, anon;
revoke all on function public.member_role_permissions() from public, anon;
revoke all on function public.seed_default_team_roles() from public, anon;
revoke all on function public.team_members_sync_role() from public, anon;
grant execute on function public.owner_role_permissions() to authenticated;
grant execute on function public.member_role_permissions() to authenticated;

-- Esošās komandas
insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
select
  'role-' || t.id || '-owner',
  t.id,
  'owner',
  'Īpašnieks',
  0,
  true,
  public.owner_role_permissions()
from public.teams as t
on conflict (team_id, slug) do nothing;

insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
select
  'role-' || t.id || '-member',
  t.id,
  'member',
  'Biedrs',
  1,
  true,
  public.member_role_permissions()
from public.teams as t
on conflict (team_id, slug) do nothing;

-- Pielāgotas lomas no esošā brīvā teksta
insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
select
  'role-' || m.team_id || '-custom-' || md5(lower(m.role)),
  m.team_id,
  'custom_' || substr(md5(lower(m.role)), 1, 10),
  m.role,
  10,
  false,
  public.member_role_permissions()
from (
  select distinct team_id, trim(role) as role
  from public.team_members
  where trim(role) <> ''
    and trim(role) not in ('owner', 'member')
) as m
on conflict (team_id, slug) do nothing;

update public.team_members as m
set role_id = r.id,
    role = r.slug
from public.team_roles as r
where r.team_id = m.team_id
  and m.role_id is null
  and (
    (m.role = 'owner' and r.slug = 'owner')
    or (m.role = 'member' and r.slug = 'member')
    or (trim(m.role) = r.name)
    or (m.role = r.slug)
  );

update public.team_members as m
set role_id = r.id,
    role = r.slug
from public.team_roles as r
where r.team_id = m.team_id
  and r.slug = 'member'
  and m.role_id is null;
