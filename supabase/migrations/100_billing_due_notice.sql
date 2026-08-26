-- billing_due notice when paid plans are turned on for teams with more than
-- the included free owner seat.

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
    'seat_open',
    'billing_due'
  )
);
