-- Paid plans have no member cap: price is per user.
-- Free plans keep a required max_members limit.

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_max_members_check;

alter table public.site_payment_plans
  alter column max_members drop not null;

alter table public.site_payment_plans
  alter column max_members drop default;

update public.site_payment_plans
set max_members = 5
where is_free = true
  and max_members is null;

update public.site_payment_plans
set max_members = null
where is_free = false;

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_max_members_check;

alter table public.site_payment_plans
  add constraint site_payment_plans_max_members_check
  check (
    max_members is null
    or (max_members >= 1 and max_members <= 10000)
  );

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_free_max_members_check;

alter table public.site_payment_plans
  add constraint site_payment_plans_free_max_members_check
  check (
    (is_free = true and max_members is not null)
    or (is_free = false and max_members is null)
  );
