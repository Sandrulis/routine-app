-- Keep existing lists on full_edit so members retain create/delete until the
-- owner tightens access. New lists also default to full_edit (ClickUp-style).

alter table public.work_lists
  alter column default_access_level set default 'full_edit';

update public.work_lists
  set default_access_level = 'full_edit'
  where default_access_level = 'edit';
