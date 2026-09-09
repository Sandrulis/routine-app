-- System admins can read lists and tasks across all teams (counts in admin Teams).

drop policy if exists work_lists_select_admin on public.work_lists;
create policy work_lists_select_admin
  on public.work_lists
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists work_tasks_select_admin on public.work_tasks;
create policy work_tasks_select_admin
  on public.work_tasks
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists list_statuses_select_admin on public.list_statuses;
create policy list_statuses_select_admin
  on public.list_statuses
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists work_task_statuses_select_admin on public.work_task_statuses;
create policy work_task_statuses_select_admin
  on public.work_task_statuses
  for select
  to authenticated
  using (public.current_user_is_admin());
