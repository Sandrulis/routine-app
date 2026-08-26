-- Self-service account deletion: 30-day grace period, then purge via cron.

alter table public.users
  add column if not exists account_status text not null default 'active';

alter table public.users
  add column if not exists deletion_requested_at timestamptz;

alter table public.users
  add column if not exists deletion_scheduled_at timestamptz;

alter table public.users
  drop constraint if exists users_account_status_check;

alter table public.users
  add constraint users_account_status_check check (
    account_status in ('active', 'pending_deletion')
  );

alter table public.users
  drop constraint if exists users_deletion_schedule_check;

alter table public.users
  add constraint users_deletion_schedule_check check (
    (
      account_status = 'active'
      and deletion_requested_at is null
      and deletion_scheduled_at is null
    )
    or (
      account_status = 'pending_deletion'
      and deletion_requested_at is not null
      and deletion_scheduled_at is not null
    )
  );

create index if not exists users_pending_deletion_idx
  on public.users (deletion_scheduled_at)
  where account_status = 'pending_deletion';

create or replace function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  scheduled timestamptz;
  admin_count integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1
    from public.users as u
    where u.id = uid
      and u.account_status = 'pending_deletion'
  ) then
    raise exception 'account_deletion_already_pending';
  end if;

  if exists (
    select 1
    from public.users as u
    where u.id = uid
      and u.is_admin = true
  ) then
    select count(*)::integer
    into admin_count
    from public.users as u
    where u.is_admin = true;

    if admin_count <= 1 then
      raise exception 'last_admin';
    end if;
  end if;

  scheduled := pg_catalog.timezone('utc', pg_catalog.now()) + interval '30 days';

  update public.users as u
  set
    account_status = 'pending_deletion',
    deletion_requested_at = pg_catalog.timezone('utc', pg_catalog.now()),
    deletion_scheduled_at = scheduled
  where u.id = uid
    and u.account_status = 'active';

  if not found then
    raise exception 'account_deletion_failed';
  end if;

  return scheduled;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.users as u
  set
    account_status = 'active',
    deletion_requested_at = null,
    deletion_scheduled_at = null
  where u.id = uid
    and u.account_status = 'pending_deletion';

  if not found then
    raise exception 'account_deletion_not_pending';
  end if;
end;
$$;

revoke all on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;

revoke all on function public.cancel_account_deletion() from public, anon;
grant execute on function public.cancel_account_deletion() to authenticated;

alter table public.site_cron_jobs
  drop constraint if exists site_cron_jobs_key_check;

alter table public.site_cron_jobs
  add constraint site_cron_jobs_key_check check (
    job_key in (
      'subtask_start_reminder',
      'subtask_due_reminder',
      'purge_scheduled_account_deletions'
    )
  );

insert into public.site_cron_jobs (job_key, is_enabled, secret_token)
values (
  'purge_scheduled_account_deletions',
  false,
  replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
)
on conflict (job_key) do nothing;
