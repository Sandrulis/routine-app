-- System logo fallback: background color for initials avatar (same palette as teams/lists).

alter table public.site_settings
  add column if not exists logo_color text not null default 'black';
