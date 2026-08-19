-- Template items: folders and nested tree (mirror work_tasks structure).

alter table public.work_template_items
  drop constraint if exists work_template_items_root_kind_check;

alter table public.work_template_items
  drop constraint if exists work_template_items_kind_check;

alter table public.work_template_items
  add constraint work_template_items_kind_check
  check (kind in ('task', 'subtask', 'folder'));

alter table public.work_template_items
  add constraint work_template_items_root_kind_check
  check (
    (parent_id is null and kind in ('task', 'folder'))
    or (parent_id is not null)
  );
