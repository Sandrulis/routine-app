-- Default task statuses that new teams inherit.
-- Admin can rename, recolor, reorder or add new statuses.

create table if not exists public.task_statuses (
  id text primary key,
  label text not null,
  color text not null default '#71717a',
  sort_order int not null default 0,
  group_key text not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.task_statuses enable row level security;

revoke all on table public.task_statuses from anon, authenticated;
grant select on table public.task_statuses to authenticated;

drop policy if exists task_statuses_deny_anon on public.task_statuses;
create policy task_statuses_deny_anon
  on public.task_statuses for all to anon using (false) with check (false);

drop policy if exists task_statuses_select on public.task_statuses;
create policy task_statuses_select
  on public.task_statuses for select to authenticated using (true);

drop policy if exists task_statuses_admin_all on public.task_statuses;
create policy task_statuses_admin_all
  on public.task_statuses for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Seed default statuses matching current hardcoded values
insert into public.task_statuses (id, label, color, sort_order, group_key) values
  ('todo',        'Darāms',   '#a1a1aa', 0, 'not_started'),
  ('in_progress', 'Procesā',  '#f97316', 1, 'active'),
  ('done',        'Gatavs',   '#10b981', 2, 'closed')
on conflict (id) do update set
  label = excluded.label,
  color = excluded.color,
  sort_order = excluded.sort_order,
  group_key = excluded.group_key;
