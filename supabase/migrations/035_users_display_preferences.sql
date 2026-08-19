-- Per-user display preferences (nullable = use system default from site_settings).

alter table public.users
  add column if not exists week_start_day text,
  add column if not exists date_format text,
  add column if not exists date_separator text,
  add column if not exists time_format text;

alter table public.users
  drop constraint if exists users_week_start_day_check;

alter table public.users
  add constraint users_week_start_day_check
  check (week_start_day is null or week_start_day in ('monday', 'sunday'));

alter table public.users
  drop constraint if exists users_date_format_check;

alter table public.users
  add constraint users_date_format_check
  check (date_format is null or date_format in ('Y-m-d', 'd-m-Y', 'd/m/Y', 'm/d/Y', 'd.m.Y'));

alter table public.users
  drop constraint if exists users_date_separator_check;

alter table public.users
  add constraint users_date_separator_check
  check (date_separator is null or date_separator in ('.', '-', '/', ' '));

alter table public.users
  drop constraint if exists users_time_format_check;

alter table public.users
  add constraint users_time_format_check
  check (time_format is null or time_format in ('12', '24'));

create or replace function public.set_current_user_display_preferences(
  p_week_start_day text default null,
  p_date_format text default null,
  p_date_separator text default null,
  p_time_format text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_week_start_day is not null
    and p_week_start_day not in ('monday', 'sunday') then
    raise exception 'Invalid week start day';
  end if;

  if p_date_format is not null
    and p_date_format not in ('Y-m-d', 'd-m-Y', 'd/m/Y', 'm/d/Y', 'd.m.Y') then
    raise exception 'Invalid date format';
  end if;

  if p_date_separator is not null
    and p_date_separator not in ('.', '-', '/', ' ') then
    raise exception 'Invalid date separator';
  end if;

  if p_time_format is not null
    and p_time_format not in ('12', '24') then
    raise exception 'Invalid time format';
  end if;

  update public.users
  set
    week_start_day = p_week_start_day,
    date_format = p_date_format,
    date_separator = p_date_separator,
    time_format = p_time_format
  where id = uid;
end;
$$;

revoke all on function public.set_current_user_display_preferences(text, text, text, text)
  from public, anon;
grant execute on function public.set_current_user_display_preferences(text, text, text, text)
  to authenticated;
