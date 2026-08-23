-- 044 limited team_members INSERT to can_invite_team_members, which requires
-- an existing membership. Creating a new team then fails when inserting the
-- owner row. Restore the creator bootstrap from 005, and allow deleting a
-- team that never received an owner row (insertTeam cleanup).

create or replace function public.team_has_no_members(p_team_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select not exists (
    select 1
    from public.team_members as m
    where m.team_id = p_team_id
  );
$$;

revoke all on function public.team_has_no_members(text) from public, anon;
grant execute on function public.team_has_no_members(text) to authenticated;

drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert
  on public.team_members for insert to authenticated
  with check (
    public.can_invite_team_members(team_id)
    or (
      user_id = auth.uid()
      and exists (
        select 1
        from public.teams as t
        where t.id = team_id
          and t.created_by = auth.uid()
      )
    )
  );

drop policy if exists teams_delete on public.teams;
create policy teams_delete
  on public.teams for delete to authenticated
  using (
    public.is_team_owner(id)
    or (
      created_by = auth.uid()
      and public.team_has_no_members(id)
    )
  );
