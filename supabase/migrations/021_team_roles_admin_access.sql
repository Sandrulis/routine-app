-- System admins can manage team roles from the frontend, not only as team owners.

drop policy if exists team_roles_select_admin on public.team_roles;
create policy team_roles_select_admin
  on public.team_roles
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists team_roles_insert_admin on public.team_roles;
create policy team_roles_insert_admin
  on public.team_roles
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists team_roles_update_admin on public.team_roles;
create policy team_roles_update_admin
  on public.team_roles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists team_roles_delete_admin on public.team_roles;
create policy team_roles_delete_admin
  on public.team_roles
  for delete
  to authenticated
  using (public.current_user_is_admin() and is_system = false);
