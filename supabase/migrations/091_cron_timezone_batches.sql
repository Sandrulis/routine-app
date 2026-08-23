-- Timezone for cron reminders + RPC so the signed-in user can store IANA tz.

alter table public.site_settings
  add column if not exists timezone text not null default 'Europe/Riga';

alter table public.users
  add column if not exists timezone text;

update public.site_settings
set timezone = coalesce(nullif(trim(timezone), ''), 'Europe/Riga')
where id = 1;

create or replace function public.set_current_user_timezone(p_timezone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  tz text := trim(coalesce(p_timezone, ''));
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if char_length(tz) < 3 or char_length(tz) > 64 then
    raise exception 'Invalid timezone';
  end if;
  if tz !~ '^[A-Za-z0-9_+\-/]+$' then
    raise exception 'Invalid timezone';
  end if;

  update public.users
  set timezone = tz
  where id = uid;
end;
$$;

revoke all on function public.set_current_user_timezone(text) from public, anon;
grant execute on function public.set_current_user_timezone(text) to authenticated;
