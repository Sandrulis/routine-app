-- Payment plans catalog: global toggle, trial, Early Bird limit,
-- plan prices, and which frontend modules each plan includes.
-- Authenticated admins write; anyone can read (landing pricing later).

alter table public.site_settings
  add column if not exists payment_plans_enabled boolean not null default false;

alter table public.site_settings
  add column if not exists trial_days integer not null default 14;

alter table public.site_settings
  drop constraint if exists site_settings_trial_days_check;
alter table public.site_settings
  add constraint site_settings_trial_days_check
  check (trial_days >= 1 and trial_days <= 365);

alter table public.site_settings
  add column if not exists early_bird_limit integer not null default 0;

alter table public.site_settings
  drop constraint if exists site_settings_early_bird_limit_check;
alter table public.site_settings
  add constraint site_settings_early_bird_limit_check
  check (early_bird_limit >= 0);

create table if not exists public.site_payment_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null,
  name_values jsonb not null default '{}'::jsonb,
  description_values jsonb not null default '{}'::jsonb,
  price_month numeric(12, 2) not null default 0,
  price_quarter numeric(12, 2) not null default 0,
  price_year numeric(12, 2) not null default 0,
  early_bird_price_month numeric(12, 2) not null default 0,
  early_bird_price_quarter numeric(12, 2) not null default 0,
  early_bird_price_year numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_payment_plans_key_unique unique (plan_key),
  constraint site_payment_plans_key_check check (
    plan_key ~ '^[a-z0-9._:-]+$'
    and length(plan_key) between 1 and 64
  ),
  constraint site_payment_plans_price_month_check check (price_month >= 0),
  constraint site_payment_plans_price_quarter_check check (price_quarter >= 0),
  constraint site_payment_plans_price_year_check check (price_year >= 0),
  constraint site_payment_plans_early_bird_price_month_check
    check (early_bird_price_month >= 0),
  constraint site_payment_plans_early_bird_price_quarter_check
    check (early_bird_price_quarter >= 0),
  constraint site_payment_plans_early_bird_price_year_check
    check (early_bird_price_year >= 0)
);

drop trigger if exists site_payment_plans_set_updated_at on public.site_payment_plans;
create trigger site_payment_plans_set_updated_at
  before update on public.site_payment_plans
  for each row execute function public.set_updated_at();

alter table public.site_payment_plans enable row level security;

revoke all on table public.site_payment_plans from anon, authenticated;
grant select on table public.site_payment_plans to anon, authenticated;
grant insert, update, delete on table public.site_payment_plans to authenticated;

drop policy if exists site_payment_plans_select on public.site_payment_plans;
create policy site_payment_plans_select
  on public.site_payment_plans for select
  to anon, authenticated
  using (true);

drop policy if exists site_payment_plans_admin_all on public.site_payment_plans;
create policy site_payment_plans_admin_all
  on public.site_payment_plans for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create table if not exists public.site_payment_plan_modules (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.site_payment_plans (id) on delete cascade,
  module_key text not null,
  created_at timestamptz not null default now(),
  constraint site_payment_plan_modules_unique unique (plan_id, module_key),
  constraint site_payment_plan_modules_key_check check (
    module_key ~ '^[a-z0-9._:-]+$'
    and length(module_key) between 1 and 128
  )
);

create index if not exists site_payment_plan_modules_plan_id_idx
  on public.site_payment_plan_modules (plan_id);

alter table public.site_payment_plan_modules enable row level security;

revoke all on table public.site_payment_plan_modules from anon, authenticated;
grant select on table public.site_payment_plan_modules to anon, authenticated;
grant insert, update, delete on table public.site_payment_plan_modules to authenticated;

drop policy if exists site_payment_plan_modules_select on public.site_payment_plan_modules;
create policy site_payment_plan_modules_select
  on public.site_payment_plan_modules for select
  to anon, authenticated
  using (true);

drop policy if exists site_payment_plan_modules_admin_all on public.site_payment_plan_modules;
create policy site_payment_plan_modules_admin_all
  on public.site_payment_plan_modules for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

alter table public.site_settings
  add column if not exists trial_plan_id uuid
    references public.site_payment_plans (id) on delete set null;

alter table public.teams
  add column if not exists payment_plan_id uuid
    references public.site_payment_plans (id) on delete set null,
  add column if not exists payment_plan_until date,
  add column if not exists payment_plan_paid boolean not null default false,
  add column if not exists payment_plan_is_trial boolean not null default false,
  add column if not exists payment_plan_is_early_bird boolean not null default false;

create index if not exists teams_payment_plan_id_idx
  on public.teams (payment_plan_id);
