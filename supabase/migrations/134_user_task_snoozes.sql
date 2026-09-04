-- Per-user dashboard snooze: hide assigned tasks from Home until a time.

create table if not exists public.user_task_snoozes (
  user_id uuid not null references public.users (id) on delete cascade,
  task_id text not null references public.work_tasks (id) on delete cascade,
  snooze_until timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

create index if not exists user_task_snoozes_user_until_idx
  on public.user_task_snoozes (user_id, snooze_until);

alter table public.user_task_snoozes enable row level security;

revoke all on table public.user_task_snoozes from anon, authenticated;
grant select, insert, update, delete on table public.user_task_snoozes to authenticated;

drop policy if exists user_task_snoozes_deny_anon on public.user_task_snoozes;
create policy user_task_snoozes_deny_anon
  on public.user_task_snoozes for all to anon
  using (false) with check (false);

drop policy if exists user_task_snoozes_select_own on public.user_task_snoozes;
create policy user_task_snoozes_select_own
  on public.user_task_snoozes for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_task_snoozes_insert_own on public.user_task_snoozes;
create policy user_task_snoozes_insert_own
  on public.user_task_snoozes for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_task_snoozes_update_own on public.user_task_snoozes;
create policy user_task_snoozes_update_own
  on public.user_task_snoozes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_task_snoozes_delete_own on public.user_task_snoozes;
create policy user_task_snoozes_delete_own
  on public.user_task_snoozes for delete to authenticated
  using (user_id = auth.uid());
