-- Default subtask status layout and custom statuses on template tasks.

alter table public.work_template_items
  add column if not exists task_statuses jsonb not null default '[]'::jsonb,
  add column if not exists hidden_status_ids text[] not null default '{}'::text[],
  add column if not exists status_order text[] not null default '{}'::text[],
  add column if not exists status_group_overrides jsonb not null default '{}'::jsonb;
