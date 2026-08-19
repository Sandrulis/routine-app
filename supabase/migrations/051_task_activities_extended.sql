-- Extended task activity kinds and diff fields for subtask history.

alter table public.task_activities
  add column if not exists from_date_value date,
  add column if not exists from_assignee_ids text[] not null default '{}',
  add column if not exists previous_text text,
  add column if not exists from_parent_id text,
  add column if not exists to_parent_id text,
  add column if not exists metadata jsonb;

alter table public.task_activities drop constraint if exists task_activities_kind_check;

alter table public.task_activities add constraint task_activities_kind_check check (
  kind in (
    'created',
    'status',
    'assignees',
    'assignee_added',
    'assignee_removed',
    'start_date',
    'due_date',
    'comment',
    'file',
    'file_removed',
    'file_renamed',
    'title',
    'description',
    'moved',
    'hidden',
    'restored',
    'checklist'
  )
);
