-- Drive-primary file storage: optional mirror to Routine server (default off).

alter table public.team_google_drive_integrations
  add column if not exists store_on_server boolean not null default false;

alter table public.list_files
  add column if not exists google_drive_file_id text;

alter table public.task_files
  add column if not exists google_drive_file_id text;

comment on column public.team_google_drive_integrations.store_on_server is
  'When false (default), file bytes stay on Google Drive only; when true, also store content in Routine.';
