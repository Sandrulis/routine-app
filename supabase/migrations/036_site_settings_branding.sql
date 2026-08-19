-- System branding: logo and favicon stored as data URLs.

alter table public.site_settings
  add column if not exists logo_url text,
  add column if not exists favicon_url text;
