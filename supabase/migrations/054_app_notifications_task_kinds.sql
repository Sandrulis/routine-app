-- Task-related notification kinds for stakeholder alerts.

alter table public.app_notifications drop constraint if exists app_notifications_kind_check;

alter table public.app_notifications add constraint app_notifications_kind_check check (
  kind in (
    'assigned',
    'unassigned',
    'comment',
    'due',
    'file',
    'status_changed',
    'task_updated',
    'team_invite',
    'team_invite_rejected'
  )
);
