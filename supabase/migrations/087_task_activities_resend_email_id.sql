-- Index for Resend webhook / poll updates on file_forwarded activities.
create index if not exists task_activities_resend_email_id_idx
  on public.task_activities ((metadata->>'resendEmailId'))
  where kind = 'file_forwarded' and metadata ? 'resendEmailId';
