-- Last seen client IP for system admins. Teammates must not read this table.

create table if not exists public.user_last_ips (
  user_id uuid primary key references public.users (id) on delete cascade,
  ip text not null,
  country_code text,
  updated_at timestamptz not null default now(),
  constraint user_last_ips_ip_len check (
    char_length(btrim(ip)) between 1 and 128
  ),
  constraint user_last_ips_country_code_fmt check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  )
);

alter table public.user_last_ips enable row level security;

revoke all on table public.user_last_ips from anon, authenticated;
grant select on table public.user_last_ips to authenticated;

drop policy if exists user_last_ips_deny_anon on public.user_last_ips;
create policy user_last_ips_deny_anon
  on public.user_last_ips for all to anon
  using (false)
  with check (false);

drop policy if exists user_last_ips_select_admin on public.user_last_ips;
create policy user_last_ips_select_admin
  on public.user_last_ips for select to authenticated
  using (public.current_user_is_admin());

create or replace function public.record_user_last_ip(
  p_user_id uuid,
  p_ip text,
  p_country_code text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ip_value text;
  country_value text;
begin
  if p_user_id is null then
    return;
  end if;

  ip_value := nullif(pg_catalog.btrim(coalesce(p_ip, '')), '');
  if ip_value is null or ip_value = 'unknown' then
    return;
  end if;
  ip_value := pg_catalog.left(ip_value, 128);

  country_value := nullif(pg_catalog.upper(pg_catalog.btrim(coalesce(p_country_code, ''))), '');
  if country_value is not null and country_value !~ '^[A-Z]{2}$' then
    country_value := null;
  end if;
  if country_value in ('XX', 'T1', 'A1', 'A2') then
    country_value := null;
  end if;

  insert into public.user_last_ips (user_id, ip, country_code, updated_at)
  values (p_user_id, ip_value, country_value, pg_catalog.now())
  on conflict (user_id) do update
  set
    ip = excluded.ip,
    country_code = coalesce(excluded.country_code, public.user_last_ips.country_code),
    updated_at = pg_catalog.now()
  where public.user_last_ips.ip is distinct from excluded.ip
     or (
       excluded.country_code is not null
       and public.user_last_ips.country_code is distinct from excluded.country_code
     );
end;
$$;

revoke all on function public.record_user_last_ip(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_user_last_ip(uuid, text, text) to service_role;
