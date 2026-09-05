-- Allow small text/html email exports to keep DB content for in-app preview.
-- Binary files stay cloud-only (content stripped on insert).

create or replace function public.strip_work_file_content()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  mime text := lower(trim(coalesce(new.mime_type, '')));
  -- data: URL for ≤1.5MB file is typically under ~2.1MB character length
  max_content_chars int := 2500000;
begin
  if tg_op = 'INSERT' then
    if new.content is not null
      and length(btrim(new.content)) > 0
      and length(new.content) <= max_content_chars
      and (
        mime in ('text/plain', 'text/html', 'text/csv', 'application/json')
        or lower(coalesce(new.name, '')) ~ '\.(txt|html|htm|csv|json|md|log)$'
      )
    then
      new.has_content := true;
      return new;
    end if;
    new.content := null;
    new.has_content := false;
    return new;
  end if;

  -- UPDATE: keep existing content unless clearing; allow replacing text content
  if new.content is distinct from old.content then
    if new.content is null or btrim(new.content) = '' then
      new.content := null;
      new.has_content := false;
      return new;
    end if;
    if length(new.content) <= max_content_chars
      and (
        mime in ('text/plain', 'text/html', 'text/csv', 'application/json')
        or lower(coalesce(new.name, '')) ~ '\.(txt|html|htm|csv|json|md|log)$'
      )
    then
      new.has_content := true;
      return new;
    end if;
    new.content := old.content;
    new.has_content := old.has_content;
  end if;
  return new;
end;
$$;

comment on function public.strip_work_file_content() is
  'Strip binary file bytes from list/task_files; keep small text/html content for preview (e.g. Gmail .txt).';
