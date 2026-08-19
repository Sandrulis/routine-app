-- Notify inviter when an invite is declined; extend notification kinds.

alter table public.app_notifications
  drop constraint if exists app_notifications_kind_check;

alter table public.app_notifications
  add constraint app_notifications_kind_check
  check (kind in (
    'assigned',
    'comment',
    'due',
    'file',
    'team_invite',
    'team_invite_rejected'
  ));

create or replace function public.reject_team_invitation(p_invitation_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.team_invitations%rowtype;
  v_user_email text;
  v_team_name text;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  select * into v_inv
  from public.team_invitations
  where id = p_invitation_id
    and status = 'pending';

  if not found then
    raise exception 'invitation_not_found';
  end if;

  select email into v_user_email
  from public.users
  where id = auth.uid();

  if v_inv.invited_user_id is not null and v_inv.invited_user_id <> auth.uid() then
    raise exception 'invitation_forbidden';
  end if;

  if v_inv.invited_user_id is null
    and lower(v_inv.email) <> lower(coalesce(v_user_email, '')) then
    raise exception 'invitation_forbidden';
  end if;

  select name into v_team_name
  from public.teams
  where id = v_inv.team_id;

  update public.team_invitations
  set
    status = 'rejected',
    responded_at = now(),
    invited_user_id = coalesce(invited_user_id, auth.uid())
  where id = p_invitation_id;

  delete from public.team_members
  where id = v_inv.member_id
    and user_id is null;

  update public.app_notifications
  set read_at = coalesce(read_at, now())
  where invitation_id = p_invitation_id;

  insert into public.app_notifications (
    id,
    team_id,
    kind,
    actor_id,
    recipient_id,
    target_user_id,
    invitation_id,
    task_title,
    href,
    created_at,
    read_at
  )
  values (
    'notif-' || replace(gen_random_uuid()::text, '-', ''),
    v_inv.team_id,
    'team_invite_rejected',
    null,
    v_inv.invited_by_member_id,
    auth.uid(),
    p_invitation_id,
    coalesce(v_team_name, ''),
    v_inv.email,
    now(),
    null
  );
end;
$$;

revoke all on function public.reject_team_invitation(text) from public, anon;
grant execute on function public.reject_team_invitation(text) to authenticated;
