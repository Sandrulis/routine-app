-- Archive work items (tasks/folders) with all descendants. Separate from deleted_at.

alter table public.work_tasks
  add column if not exists archived_at timestamptz;

create index if not exists work_tasks_list_archived_idx
  on public.work_tasks (list_id)
  where archived_at is not null;
