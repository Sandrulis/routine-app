-- OneDrive as first-class file store (same as Google Drive).
-- New uploads keep only metadata + cloud ids; bytes stay on Drive and/or OneDrive.

alter table public.list_files
  add column if not exists onedrive_file_id text;

alter table public.task_files
  add column if not exists onedrive_file_id text;

comment on column public.list_files.onedrive_file_id is
  'Microsoft Graph DriveItem id when the file was uploaded to team OneDrive.';

comment on column public.task_files.onedrive_file_id is
  'Microsoft Graph DriveItem id when the file was uploaded to team OneDrive.';
