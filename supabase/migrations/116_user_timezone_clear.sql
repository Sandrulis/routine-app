-- Allow clearing user timezone (fallback to site_settings.timezone).

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

  if tz = '' then
    update public.users
    set timezone = null
    where id = uid;
    return;
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
