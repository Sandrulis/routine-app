-- Queue notification emails and send one digest per recipient.

alter table public.app_notifications
  add column if not exists email_sent_at timestamptz;

-- Existing rows were already emailed (or never should be resent).
update public.app_notifications
set email_sent_at = coalesce(created_at, now())
where email_sent_at is null;

create index if not exists app_notifications_email_pending_idx
  on public.app_notifications (created_at)
  where email_sent_at is null;
