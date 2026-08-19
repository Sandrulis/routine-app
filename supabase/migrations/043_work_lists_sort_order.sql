-- Custom sort order for lists and folders in the sidebar.

alter table public.work_lists
  add column if not exists sort_order integer not null default 0;

create index if not exists work_lists_team_id_sort_order_idx
  on public.work_lists (team_id, sort_order);

-- Backfill existing rows by creation time within each team.
with ranked as (
  select
    id,
    row_number() over (partition by team_id order by created_at, id) - 1 as new_sort_order
  from public.work_lists
)
update public.work_lists as l
set sort_order = ranked.new_sort_order
from ranked
where l.id = ranked.id;
