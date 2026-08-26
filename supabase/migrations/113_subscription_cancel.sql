-- Scheduled subscription cancellation (Stripe cancel_at_period_end)
alter table public.teams
  add column if not exists subscription_cancel_at_period_end boolean not null default false;

alter table public.teams
  add column if not exists billing_period_end_at timestamptz;

comment on column public.teams.subscription_cancel_at_period_end is
  'True when Stripe subscription is set to cancel at current period end.';
comment on column public.teams.billing_period_end_at is
  'Stripe current period end (UTC) for countdown and billing UI.';
