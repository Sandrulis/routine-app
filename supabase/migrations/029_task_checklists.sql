-- Nested checklists on work tasks (name + items). Used to block completing
-- a task until every named checklist item is checked.

alter table public.work_tasks
  add column if not exists checklists jsonb not null default '[]'::jsonb;
