-- Paid Factory module. Factory users live outside team_members, so they
-- do not consume paid seats. Billing for this module is the module itself.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values ('module_factory', true, 20)
on conflict (module_key) do nothing;

insert into public.site_payment_plan_modules (plan_id, module_key)
select p.id, 'module_factory'
from public.site_payment_plans p
where p.is_free = false
on conflict (plan_id, module_key) do nothing;

create table if not exists public.team_factory_users (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  password_secret text not null,
  created_at timestamptz not null default now(),
  constraint team_factory_users_first_name_len check (
    char_length(btrim(first_name)) between 1 and 80
  ),
  constraint team_factory_users_last_name_len check (
    char_length(btrim(last_name)) between 1 and 80
  ),
  constraint team_factory_users_email_len check (
    char_length(btrim(email)) between 3 and 320
  )
);

create unique index if not exists team_factory_users_team_email_idx
  on public.team_factory_users (team_id, lower(email));

create index if not exists team_factory_users_team_created_idx
  on public.team_factory_users (team_id, created_at desc);

alter table public.team_factory_users enable row level security;

revoke all on table public.team_factory_users from anon, authenticated;
grant select, insert, update, delete on table public.team_factory_users to authenticated;

drop policy if exists team_factory_users_deny_anon on public.team_factory_users;
create policy team_factory_users_deny_anon
  on public.team_factory_users for all to anon
  using (false)
  with check (false);

drop policy if exists team_factory_users_deny_authenticated on public.team_factory_users;
create policy team_factory_users_deny_authenticated
  on public.team_factory_users for all to authenticated
  using (false)
  with check (false);
