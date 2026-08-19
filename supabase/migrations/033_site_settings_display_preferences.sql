-- System display preferences: week start, date format, separator, time format.

alter table public.site_settings
  add column if not exists week_start_day text not null default 'monday',
  add column if not exists date_format text not null default 'd.m.Y',
  add column if not exists date_separator text not null default '.',
  add column if not exists time_format text not null default '24';

alter table public.site_settings
  drop constraint if exists site_settings_week_start_day_check;

alter table public.site_settings
  add constraint site_settings_week_start_day_check
  check (week_start_day in ('monday', 'sunday'));

alter table public.site_settings
  drop constraint if exists site_settings_date_format_check;

alter table public.site_settings
  add constraint site_settings_date_format_check
  check (date_format in ('Y-m-d', 'd-m-Y', 'd/m/Y', 'm/d/Y', 'd.m.Y'));

alter table public.site_settings
  drop constraint if exists site_settings_date_separator_check;

alter table public.site_settings
  add constraint site_settings_date_separator_check
  check (date_separator in ('.', '-', '/', ' '));

alter table public.site_settings
  drop constraint if exists site_settings_time_format_check;

alter table public.site_settings
  add constraint site_settings_time_format_check
  check (time_format in ('12', '24'));

update public.site_settings
set
  week_start_day = coalesce(week_start_day, 'monday'),
  date_format = coalesce(date_format, 'd.m.Y'),
  date_separator = coalesce(date_separator, '.'),
  time_format = coalesce(time_format, '24')
where id = 1;
