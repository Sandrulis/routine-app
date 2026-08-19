-- Allow reorder activity kind in task history.

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
    'checklist',
    'reordered'
  )
);
