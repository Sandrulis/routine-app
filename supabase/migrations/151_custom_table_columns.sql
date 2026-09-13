-- Custom table columns: list-level column definitions and per-task values.

alter table public.work_lists
  add column if not exists custom_columns jsonb not null default '[]'::jsonb;

alter table public.work_tasks
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;
