-- VIP teams skip payment, seat and module limits. Only system admins may change is_vip.

alter table public.teams
  add column if not exists is_vip boolean not null default false;

comment on column public.teams.is_vip is
  'When true, the team has no billing, seat or plan-module limits and does not pay.';

create or replace function public.teams_guard_is_vip()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_vip is true and not public.current_user_is_admin() then
      new.is_vip := false;
    end if;
    return new;
  end if;

  if old.is_vip is distinct from new.is_vip and not public.current_user_is_admin() then
    raise exception 'forbidden';
  end if;
  return new;
end;
$$;

drop trigger if exists teams_guard_is_vip on public.teams;
create trigger teams_guard_is_vip
  before insert or update on public.teams
  for each row
  execute function public.teams_guard_is_vip();
