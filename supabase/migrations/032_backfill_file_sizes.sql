-- Backfill file size from stored content when uploads were saved with size 0.

update public.task_files
set size = greatest(
  0,
  (
    case
      when content is null or btrim(content) = '' then 0
      when position(',' in content) > 0 then
        (char_length(split_part(content, ',', 2)) * 3) / 4
      else octet_length(content)
    end
  )::integer
)
where coalesce(size, 0) = 0
  and content is not null
  and btrim(content) <> '';

update public.list_files
set size = greatest(
  0,
  (
    case
      when content is null or btrim(content) = '' then 0
      when position(',' in content) > 0 then
        (char_length(split_part(content, ',', 2)) * 3) / 4
      else octet_length(content)
    end
  )::integer
)
where coalesce(size, 0) = 0
  and content is not null
  and btrim(content) <> '';
