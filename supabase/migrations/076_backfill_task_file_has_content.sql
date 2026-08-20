-- Backfill has_content for rows that store content but were inserted without the flag
-- (e.g. early Gmail extension uploads). Fixes UI/download treating them as empty.

update public.task_files
set has_content = true
where content is not null
  and length(btrim(content)) > 0
  and has_content = false;

update public.list_files
set has_content = true
where content is not null
  and length(btrim(content)) > 0
  and has_content = false;
