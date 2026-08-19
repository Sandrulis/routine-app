-- Default assignees and checklists on template tasks/subtasks.

alter table public.work_template_items
  add column if not exists assignee_ids text[] not null default '{}'::text[],
  add column if not exists checklists jsonb not null default '[]'::jsonb;
