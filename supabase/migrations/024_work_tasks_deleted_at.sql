-- Soft-hide for subtasks: not a real status, only deleted_at for archive display.

alter table public.work_tasks
  add column if not exists deleted_at timestamptz;
