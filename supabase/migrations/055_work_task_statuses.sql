-- Per-parent-task statuses for subtasks under a work task.
-- System catalog: task_statuses. List extras: list_statuses. Task extras: work_task_statuses.

create table if not exists public.work_task_statuses (
  id text primary key,
  parent_task_id text not null references public.work_tasks (id) on delete cascade,
  list_id text not null references public.work_lists (id) on delete cascade,
  team_id text not null references public.teams (id) on delete cascade,
  label text not null default '',
  labels jsonb not null default '{}'::jsonb,
  color text not null default '#71717a',
  sort_order int not null default 0,
  group_key text not null default 'active',
  created_at timestamptz not null default now(),
  constraint work_task_statuses_group_key_check
    check (group_key in ('not_started', 'active', 'closed'))
);

create index if not exists work_task_statuses_parent_task_id_idx
  on public.work_task_statuses (parent_task_id, sort_order);
create index if not exists work_task_statuses_list_id_idx
  on public.work_task_statuses (list_id);
create index if not exists work_task_statuses_team_id_idx
  on public.work_task_statuses (team_id);

alter table public.work_tasks
  add column if not exists hidden_status_ids text[] not null default '{}',
  add column if not exists status_order text[] not null default '{}',
  add column if not exists status_group_overrides jsonb not null default '{}'::jsonb;

alter table public.work_task_statuses enable row level security;

revoke all on table public.work_task_statuses from anon, authenticated;
grant select, insert, update, delete on table public.work_task_statuses to authenticated;

drop policy if exists work_task_statuses_deny_anon on public.work_task_statuses;
create policy work_task_statuses_deny_anon
  on public.work_task_statuses for all to anon using (false) with check (false);

drop policy if exists work_task_statuses_select on public.work_task_statuses;
create policy work_task_statuses_select
  on public.work_task_statuses for select to authenticated
  using (public.work_list_has_access(list_id, 'view'));

drop policy if exists work_task_statuses_insert on public.work_task_statuses;
create policy work_task_statuses_insert
  on public.work_task_statuses for insert to authenticated
  with check (
    public.work_list_has_access(list_id, 'edit')
    and exists (
      select 1
      from public.work_tasks as t
      where t.id = parent_task_id
        and t.list_id = list_id
        and t.team_id = team_id
    )
  );

drop policy if exists work_task_statuses_update on public.work_task_statuses;
create policy work_task_statuses_update
  on public.work_task_statuses for update to authenticated
  using (public.work_list_has_access(list_id, 'edit'))
  with check (
    public.work_list_has_access(list_id, 'edit')
    and exists (
      select 1
      from public.work_tasks as t
      where t.id = parent_task_id
        and t.list_id = list_id
        and t.team_id = team_id
    )
  );

drop policy if exists work_task_statuses_delete on public.work_task_statuses;
create policy work_task_statuses_delete
  on public.work_task_statuses for delete to authenticated
  using (public.work_list_has_access(list_id, 'edit'));
