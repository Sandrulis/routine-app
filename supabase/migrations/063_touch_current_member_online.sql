-- Heartbeat for last_online_at. Direct table UPDATE as anon (no JWT yet, or
-- session refresh gap) hits 42501 because anon has no GRANT on team_members.

create or replace function public.touch_current_member_online(
  p_team_id text,
  p_seen_at timestamptz
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
    return;
  end if;

  if p_team_id is null or btrim(p_team_id) = '' then
    return;
  end if;

  update public.team_members
  set last_online_at = coalesce(p_seen_at, now())
  where user_id = uid
    and team_id = p_team_id
    and (
      last_online_at is null
      or last_online_at < coalesce(p_seen_at, now())
    );
end;
$$;

revoke all on function public.touch_current_member_online(text, timestamptz)
  from public, anon;
grant execute on function public.touch_current_member_online(text, timestamptz)
  to authenticated;
