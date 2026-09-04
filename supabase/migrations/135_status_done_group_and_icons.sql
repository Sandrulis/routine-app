-- Add "done" status group between active and closed; optional per-status icon.

alter table public.task_statuses
  drop constraint if exists task_statuses_group_key_check;

alter table public.task_statuses
  add constraint task_statuses_group_key_check
  check (group_key in ('not_started', 'active', 'done', 'closed'));

alter table public.list_statuses
  drop constraint if exists list_statuses_group_key_check;

alter table public.list_statuses
  add constraint list_statuses_group_key_check
  check (group_key in ('not_started', 'active', 'done', 'closed'));

alter table public.work_task_statuses
  drop constraint if exists work_task_statuses_group_key_check;

alter table public.work_task_statuses
  add constraint work_task_statuses_group_key_check
  check (group_key in ('not_started', 'active', 'done', 'closed'));

alter table public.task_statuses
  add column if not exists icon text;

alter table public.list_statuses
  add column if not exists icon text;

alter table public.work_task_statuses
  add column if not exists icon text;

update public.task_statuses
set group_key = 'done'
where id = 'done' and group_key = 'closed';
