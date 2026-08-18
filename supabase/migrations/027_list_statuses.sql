-- Per-list team statuses. System catalog stays in task_statuses.
-- Each work list can define extra statuses visible only inside that team/list.

create table if not exists public.list_statuses (
  id text primary key,
  list_id text not null references public.work_lists (id) on delete cascade,
  team_id text not null references public.teams (id) on delete cascade,
  label text not null default '',
  labels jsonb not null default '{}'::jsonb,
  color text not null default '#71717a',
  sort_order int not null default 0,
  group_key text not null default 'active',
  created_at timestamptz not null default now(),
  constraint list_statuses_group_key_check
    check (group_key in ('not_started', 'active', 'closed'))
);

create index if not exists list_statuses_list_id_idx
  on public.list_statuses (list_id, sort_order);
create index if not exists list_statuses_team_id_idx
  on public.list_statuses (team_id);

alter table public.list_statuses enable row level security;

revoke all on table public.list_statuses from anon, authenticated;
grant select, insert, update, delete on table public.list_statuses to authenticated;

drop policy if exists list_statuses_deny_anon on public.list_statuses;
create policy list_statuses_deny_anon
  on public.list_statuses for all to anon using (false) with check (false);

drop policy if exists list_statuses_select on public.list_statuses;
create policy list_statuses_select
  on public.list_statuses for select to authenticated
  using (public.work_list_has_access(list_id, 'view'));

drop policy if exists list_statuses_insert on public.list_statuses;
create policy list_statuses_insert
  on public.list_statuses for insert to authenticated
  with check (
    public.work_list_has_access(list_id, 'edit')
    and exists (
      select 1
      from public.work_lists as l
      where l.id = list_id
        and l.team_id = team_id
    )
  );

drop policy if exists list_statuses_update on public.list_statuses;
create policy list_statuses_update
  on public.list_statuses for update to authenticated
  using (public.work_list_has_access(list_id, 'edit'))
  with check (
    public.work_list_has_access(list_id, 'edit')
    and exists (
      select 1
      from public.work_lists as l
      where l.id = list_id
        and l.team_id = team_id
    )
  );

drop policy if exists list_statuses_delete on public.list_statuses;
create policy list_statuses_delete
  on public.list_statuses for delete to authenticated
  using (public.work_list_has_access(list_id, 'edit'));
