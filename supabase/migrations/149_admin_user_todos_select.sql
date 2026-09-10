-- System admins can read personal to-do rows across users (counts in admin Users).

drop policy if exists user_todos_select_admin on public.user_todos;
create policy user_todos_select_admin
  on public.user_todos
  for select
  to authenticated
  using (public.current_user_is_admin());
