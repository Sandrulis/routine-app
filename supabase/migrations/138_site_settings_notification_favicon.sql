-- Optional favicon shown in the browser tab when the user has unread notifications.

alter table public.site_settings
  add column if not exists notification_favicon_url text;
