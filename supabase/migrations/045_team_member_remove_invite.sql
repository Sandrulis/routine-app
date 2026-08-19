-- Allow invite-capable members to revoke pending invites and remove teammates.

drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete
  on public.team_members for delete to authenticated
  using (
    (
      public.is_team_owner(team_id)
      or public.can_invite_team_members(team_id)
    )
    and user_id is distinct from auth.uid()
    and role <> 'owner'
  );

drop policy if exists team_invitations_delete on public.team_invitations;
create policy team_invitations_delete
  on public.team_invitations for delete to authenticated
  using (
    public.is_team_owner(team_id)
    or public.can_invite_team_members(team_id)
  );
