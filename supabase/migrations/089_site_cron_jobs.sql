-- Admin-managed cron jobs for cron-job.org. Service role only (token in URL).

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
    'team_invite_rejected'
  )
);

create table if not exists public.site_cron_jobs (
  job_key text primary key,
  is_enabled boolean not null default false,
  secret_token text not null unique,
  last_run_at timestamptz,
  last_run_ok boolean,
  last_run_message text,
  last_notified_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_cron_jobs_key_check check (
    job_key in ('subtask_start_reminder', 'subtask_due_reminder')
  ),
  constraint site_cron_jobs_token_len check (char_length(secret_token) >= 32)
);

drop trigger if exists site_cron_jobs_set_updated_at on public.site_cron_jobs;
create trigger site_cron_jobs_set_updated_at
  before update on public.site_cron_jobs
  for each row execute function public.set_updated_at();

insert into public.site_cron_jobs (job_key, is_enabled, secret_token)
values
  (
    'subtask_start_reminder',
    false,
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
  ),
  (
    'subtask_due_reminder',
    false,
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
  )
on conflict (job_key) do nothing;

alter table public.site_cron_jobs enable row level security;

revoke all on table public.site_cron_jobs from anon, authenticated;

drop policy if exists site_cron_jobs_deny_anon on public.site_cron_jobs;
create policy site_cron_jobs_deny_anon
  on public.site_cron_jobs for all to anon
  using (false)
  with check (false);

drop policy if exists site_cron_jobs_deny_authenticated on public.site_cron_jobs;
create policy site_cron_jobs_deny_authenticated
  on public.site_cron_jobs for all to authenticated
  using (false)
  with check (false);
