-- Assign a whole team role (group) to a task, in addition to individual members.

create table if not exists public.task_assignee_roles (
  task_id text not null references public.work_tasks (id) on delete cascade,
  role_id text not null references public.team_roles (id) on delete cascade,
  primary key (task_id, role_id)
);

create index if not exists task_assignee_roles_role_id_idx
  on public.task_assignee_roles (role_id);

alter table public.task_assignee_roles enable row level security;

revoke all on table public.task_assignee_roles from anon, authenticated;
grant select, insert, delete on table public.task_assignee_roles to authenticated;

drop policy if exists task_assignee_roles_deny_anon on public.task_assignee_roles;
create policy task_assignee_roles_deny_anon
  on public.task_assignee_roles for all to anon using (false) with check (false);

drop policy if exists task_assignee_roles_select on public.task_assignee_roles;
create policy task_assignee_roles_select
  on public.task_assignee_roles for select to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_assignee_roles_insert on public.task_assignee_roles;
create policy task_assignee_roles_insert
  on public.task_assignee_roles for insert to authenticated
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

drop policy if exists task_assignee_roles_delete on public.task_assignee_roles;
create policy task_assignee_roles_delete
  on public.task_assignee_roles for delete to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.task_assignee_roles;
exception when duplicate_object then null; when undefined_object then null;
end $$;
