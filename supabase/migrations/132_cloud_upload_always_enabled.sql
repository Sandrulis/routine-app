-- Uploads follow connection only: no separate upload-enabled checkbox in team UI.
update public.team_google_drive_integrations
set is_enabled = true
where is_connected = true
  and is_enabled is distinct from true;

update public.team_onedrive_integrations
set is_enabled = true
where is_connected = true
  and is_enabled is distinct from true;
