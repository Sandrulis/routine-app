-- System admins can read and manage all users and teams from the admin panel.
-- Listing no longer depends on SUPABASE_SERVICE_ROLE_KEY (needed only for Auth admin APIs).

grant select, insert, update, delete on table public.users to authenticated;

drop policy if exists users_select_admin on public.users;
create policy users_select_admin
  on public.users
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists users_insert_admin on public.users;
create policy users_insert_admin
  on public.users
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists users_update_admin on public.users;
create policy users_update_admin
  on public.users
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists users_delete_admin on public.users;
create policy users_delete_admin
  on public.users
  for delete
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists teams_select_admin on public.teams;
create policy teams_select_admin
  on public.teams
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists teams_update_admin on public.teams;
create policy teams_update_admin
  on public.teams
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists teams_delete_admin on public.teams;
create policy teams_delete_admin
  on public.teams
  for delete
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists team_members_select_admin on public.team_members;
create policy team_members_select_admin
  on public.team_members
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists team_members_insert_admin on public.team_members;
create policy team_members_insert_admin
  on public.team_members
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists team_members_update_admin on public.team_members;
create policy team_members_update_admin
  on public.team_members
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists team_members_delete_admin on public.team_members;
create policy team_members_delete_admin
  on public.team_members
  for delete
  to authenticated
  using (public.current_user_is_admin());
