-- Optional note on subtask attachments; shown as a tooltip on the card.

alter table public.task_files
  add column if not exists note text not null default '';

comment on column public.task_files.note is
  'Optional user note shown as a tooltip on the subtask attachment card.';
