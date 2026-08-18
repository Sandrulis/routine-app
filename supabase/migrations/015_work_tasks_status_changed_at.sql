-- Pēdējās statusa maiņas laiks apakšuzdevumam / uzdevumam
alter table public.work_tasks
  add column if not exists status_changed_at timestamptz;

-- Aizpilda no pēdējās statusa aktivitātes
update public.work_tasks wt
set status_changed_at = sub.latest_at
from (
  select task_id, max(created_at) as latest_at
  from public.task_activities
  where kind = 'status'
  group by task_id
) sub
where wt.id = sub.task_id
  and wt.status_changed_at is null;
