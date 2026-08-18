-- Task status catalog (task_statuses) can have custom ids.
-- work_tasks.status still had a check for todo / in_progress / done only,
-- so picking a catalog status (or next-status from the catalog order) failed.

alter table public.work_tasks
  drop constraint if exists work_tasks_status_check;
