-- Registered users must explicitly accept team invites (notifications or invite link).
-- Do not auto-link team_members by email or auto-accept pending invitations.

drop trigger if exists team_members_complete_invitations on public.team_members;
drop function if exists public.complete_pending_invitations_for_member();

create or replace function public.link_team_member_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.team_members as tm
  set
    user_id = new.id,
    name = case
      when btrim(tm.name) = '' then new.name
      else tm.name
    end,
    avatar_url = coalesce(tm.avatar_url, nullif(new.avatar, ''))
  where tm.user_id is null
    and tm.email <> ''
    and lower(tm.email) = lower(new.email)
    and not exists (
      select 1
      from public.team_invitations as i
      where i.member_id = tm.id
        and i.status = 'pending'
    );

  return new;
end;
$$;

-- Clear mistaken auto-links while the invite is still pending.
update public.team_members as tm
set user_id = null
where tm.user_id is not null
  and exists (
    select 1
    from public.team_invitations as i
    where i.member_id = tm.id
      and i.status = 'pending'
  );
