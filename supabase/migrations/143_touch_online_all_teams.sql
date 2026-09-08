-- Presence is per user, not per open team. Keep the old signature so callers
-- do not change; p_team_id is unused.

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
  seen_at timestamptz := coalesce(p_seen_at, pg_catalog.now());
begin
  if uid is null then
    return;
  end if;

  update public.team_members
  set last_online_at = seen_at
  where user_id = uid
    and (
      last_online_at is null
      or last_online_at < seen_at
    );
end;
$$;

revoke all on function public.touch_current_member_online(text, timestamptz)
  from public, anon;
grant execute on function public.touch_current_member_online(text, timestamptz)
  to authenticated;
