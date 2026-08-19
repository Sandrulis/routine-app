-- Allow confirmed members to remove themselves from a team (not owners).

drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete
  on public.team_members for delete to authenticated
  using (
    (
      user_id = auth.uid()
      and role <> 'owner'
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
