-- Sistēmas noklusējuma komandas lomas (jaunām komandām) un to pieejas.

create table if not exists public.system_default_roles (
  id text primary key,
  slug text not null unique,
  name text not null,
  labels jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_system boolean not null default false,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_default_roles_sort_idx
  on public.system_default_roles (sort_order, slug);

alter table public.system_default_roles enable row level security;

revoke all on table public.system_default_roles from anon, authenticated;
grant select, insert, update, delete on table public.system_default_roles to authenticated;

drop policy if exists system_default_roles_deny_anon on public.system_default_roles;
create policy system_default_roles_deny_anon
  on public.system_default_roles for all to anon using (false) with check (false);

drop policy if exists system_default_roles_select on public.system_default_roles;
create policy system_default_roles_select
  on public.system_default_roles for select to authenticated
  using (public.current_user_is_admin());

drop policy if exists system_default_roles_admin_all on public.system_default_roles;
create policy system_default_roles_admin_all
  on public.system_default_roles for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

insert into public.system_default_roles (
  id, slug, name, labels, sort_order, is_system, permissions
) values
  (
    'owner',
    'owner',
    'Īpašnieks',
    '{"lv":"Īpašnieks","en":"Owner","ru":"Владелец"}'::jsonb,
    0,
    true,
    public.owner_role_permissions()
  ),
  (
    'member',
    'member',
    'Biedrs',
    '{"lv":"Biedrs","en":"Member","ru":"Участник"}'::jsonb,
    1,
    true,
    public.member_role_permissions()
  )
on conflict (id) do nothing;

create or replace function public.seed_default_team_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
  select
    'role-' || new.id || '-' || d.slug,
    new.id,
    d.slug,
    coalesce(nullif(trim(d.labels ->> 'lv'), ''), d.name),
    d.sort_order,
    case
      when d.slug in ('owner', 'member') then true
      else d.is_system
    end,
    d.permissions
  from public.system_default_roles as d
  order by d.sort_order, d.slug
  on conflict (team_id, slug) do nothing;

  if not exists (
    select 1 from public.team_roles as r where r.team_id = new.id and r.slug = 'owner'
  ) then
    insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
    values (
      'role-' || new.id || '-owner',
      new.id,
      'owner',
      'Īpašnieks',
      0,
      true,
      public.owner_role_permissions()
    )
    on conflict (team_id, slug) do nothing;
  end if;

  if not exists (
    select 1 from public.team_roles as r where r.team_id = new.id and r.slug = 'member'
  ) then
    insert into public.team_roles (id, team_id, slug, name, sort_order, is_system, permissions)
    values (
      'role-' || new.id || '-member',
      new.id,
      'member',
      'Biedrs',
      1,
      true,
      public.member_role_permissions()
    )
    on conflict (team_id, slug) do nothing;
  end if;

  return new;
end;
$$;
