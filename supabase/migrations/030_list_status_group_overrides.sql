-- Per-list group placement for statuses dragged between groups.

alter table public.work_lists
  add column if not exists status_group_overrides jsonb not null default '{}'::jsonb;
