-- Open paid-seat notice: persist billing cycle end, allow seat_open
-- notifications, and keep payment plans off unless Stripe is live.

alter table public.teams
  add column if not exists billing_cycle_end date;

alter table public.app_notifications drop constraint if exists app_notifications_kind_check;

alter table public.app_notifications add constraint app_notifications_kind_check check (
  kind in (
    'assigned',
    'unassigned',
    'comment',
    'due',
    'start',
    'file',
    'status_changed',
    'task_updated',
    'team_invite',
    'team_invite_rejected',
    'seat_open'
  )
);

update public.site_settings
set payment_plans_enabled = false
where id = 1
  and payment_plans_enabled = true
  and not exists (
    select 1
    from public.site_integrations
    where integration_key = 'stripe'
      and is_configured = true
      and is_enabled = true
  );
