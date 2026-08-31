-- New list/task files keep only metadata + Drive id. Bytes stay on Google Drive.
-- Existing content rows are kept; updates cannot add new content.

create or replace function public.strip_work_file_content()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    new.content := null;
    new.has_content := false;
    return new;
  end if;

  if new.content is distinct from old.content then
    new.content := old.content;
    new.has_content := old.has_content;
  end if;
  return new;
end;
$$;

drop trigger if exists list_files_strip_content on public.list_files;
create trigger list_files_strip_content
  before insert or update on public.list_files
  for each row
  execute function public.strip_work_file_content();

drop trigger if exists task_files_strip_content on public.task_files;
create trigger task_files_strip_content
  before insert or update on public.task_files
  for each row
  execute function public.strip_work_file_content();

comment on column public.team_google_drive_integrations.store_on_server is
  'Unused for new uploads: file bytes are stored on Google Drive only.';
