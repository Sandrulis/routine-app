-- Fix reject_team_invitation: insert inviter notification before member delete
-- cascades remove the invitation row.

alter table public.app_notifications
  drop constraint if exists app_notifications_invitation_id_fkey;

alter table public.app_notifications
  add constraint app_notifications_invitation_id_fkey
  foreign key (invitation_id) references public.team_invitations (id) on delete set null;

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

  delete from public.app_notifications
  where invitation_id = p_invitation_id
    and kind = 'team_invite';

  update public.team_invitations
  set
    status = 'rejected',
    responded_at = now(),
    invited_user_id = coalesce(invited_user_id, auth.uid())
  where id = p_invitation_id;

  delete from public.team_members
  where id = v_inv.member_id
    and user_id is null;
end;
$$;

revoke all on function public.reject_team_invitation(text) from public, anon;
grant execute on function public.reject_team_invitation(text) to authenticated;

-- Allow invitees to remove their pending placeholder row when rejecting.
drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete
  on public.team_members for delete to authenticated
  using (
    (
      user_id = auth.uid()
      and role <> 'owner'
    )
    or (
      user_id is null
      and exists (
        select 1
        from public.team_invitations as i
        where i.member_id = team_members.id
          and i.status = 'pending'
          and (
            i.invited_user_id = auth.uid()
            or (
              i.invited_user_id is null
              and lower(i.email) = lower(
                coalesce(
                  (select u.email from public.users as u where u.id = auth.uid()),
                  ''
                )
              )
            )
          )
      )
    )
    or (
      (
        public.is_team_owner(team_id)
        or public.can_invite_team_members(team_id)
      )
      and user_id is distinct from auth.uid()
      and role <> 'owner'
    )
  );
