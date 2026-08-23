-- Invite preview: whether the invited email already has a public.users row
-- (or invited_user_id). Email stays masked for privacy.

drop function if exists public.preview_team_invitation(text);

create function public.preview_team_invitation(p_token text)
returns table (
  invitation_id text,
  team_name text,
  inviter_name text,
  email text,
  account_exists boolean
)
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select
    i.id,
    t.name,
    inv.name,
    case
      when position('@' in i.email) > 1 then
        left(i.email, 1) || '***@' || split_part(i.email, '@', 2)
      else '***'
    end,
    (
      i.invited_user_id is not null
      or exists (
        select 1
        from public.users as u
        where lower(u.email) = lower(i.email)
      )
    )
  from public.team_invitations as i
  join public.teams as t on t.id = i.team_id
  join public.team_members as inv on inv.id = i.invited_by_member_id
  where i.token = p_token
    and i.status = 'pending';
$$;

revoke all on function public.preview_team_invitation(text) from public;
grant execute on function public.preview_team_invitation(text) to anon, authenticated;
