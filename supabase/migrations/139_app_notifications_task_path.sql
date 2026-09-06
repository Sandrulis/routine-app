-- Snapshot of list / folder / parent path for task notifications.

alter table public.app_notifications
  add column if not exists task_path text;
