-- Per-list status order and hidden system statuses.

alter table public.work_lists
  add column if not exists hidden_status_ids text[] not null default '{}',
  add column if not exists status_order text[] not null default '{}';
