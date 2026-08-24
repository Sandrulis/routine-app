-- Max team members per payment plan.

alter table public.site_payment_plans
  add column if not exists max_members integer not null default 5;

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_max_members_check;

alter table public.site_payment_plans
  add constraint site_payment_plans_max_members_check
  check (max_members >= 1 and max_members <= 10000);
