-- Per-list access levels for roles and members: full_edit, edit, comment, view.

alter table public.work_lists
  add column if not exists default_access_level text not null default 'edit';

alter table public.work_list_viewers
  add column if not exists access_level text not null default 'full_edit';

alter table public.work_list_viewer_roles
  add column if not exists access_level text not null default 'full_edit';

alter table public.work_list_viewers
  alter column access_level set default 'edit';

alter table public.work_list_viewer_roles
  alter column access_level set default 'edit';

alter table public.work_lists
  drop constraint if exists work_lists_default_access_level_check;
alter table public.work_lists
  add constraint work_lists_default_access_level_check
  check (default_access_level in ('full_edit', 'edit', 'comment', 'view'));

alter table public.work_list_viewers
  drop constraint if exists work_list_viewers_access_level_check;
alter table public.work_list_viewers
  add constraint work_list_viewers_access_level_check
  check (access_level in ('full_edit', 'edit', 'comment', 'view'));

alter table public.work_list_viewer_roles
  drop constraint if exists work_list_viewer_roles_access_level_check;
alter table public.work_list_viewer_roles
  add constraint work_list_viewer_roles_access_level_check
  check (access_level in ('full_edit', 'edit', 'comment', 'view'));

create or replace function public.work_list_access_rank(p_level text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_level
    when 'full_edit' then 3
    when 'edit' then 2
    when 'comment' then 1
    when 'view' then 0
    else -1
  end;
$$;

create or replace function public.work_list_access_level(p_list_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.current_user_is_admin() then 'full_edit'
    when exists (
      select 1
      from public.work_lists as l
      where l.id = p_list_id
        and (
          l.created_by = auth.uid()
          or public.is_team_owner(l.team_id)
        )
    ) then 'full_edit'
    when not public.can_view_work_list(p_list_id) then null
    else coalesce(
      (
        select v.access_level
        from public.work_list_viewers as v
        where v.list_id = p_list_id
          and v.user_id = auth.uid()
        limit 1
      ),
      (
        select vr.access_level
        from public.work_list_viewer_roles as vr
        join public.work_lists as l
          on l.id = vr.list_id
        join public.team_roles as r
          on r.id = vr.role_id
         and r.team_id = l.team_id
        join public.team_members as m
          on m.team_id = l.team_id
         and m.user_id = auth.uid()
         and (
           m.role_id = r.id
           or (m.role_id is null and m.role = r.slug)
         )
        where vr.list_id = p_list_id
        order by public.work_list_access_rank(vr.access_level) desc
        limit 1
      ),
      (
        select l.default_access_level
        from public.work_lists as l
        where l.id = p_list_id
      )
    )
  end;
$$;

create or replace function public.work_list_has_access(p_list_id text, p_min text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.work_list_access_rank(public.work_list_access_level(p_list_id))
    >= public.work_list_access_rank(p_min);
$$;

revoke all on function public.work_list_access_rank(text) from public, anon;
grant execute on function public.work_list_access_rank(text) to authenticated;
revoke all on function public.work_list_access_level(text) from public, anon;
grant execute on function public.work_list_access_level(text) to authenticated;
revoke all on function public.work_list_has_access(text, text) from public, anon;
grant execute on function public.work_list_has_access(text, text) to authenticated;

drop policy if exists work_lists_update on public.work_lists;
create policy work_lists_update
  on public.work_lists for update to authenticated
  using (public.work_list_has_access(id, 'edit'))
  with check (public.work_list_has_access(id, 'edit'));

drop policy if exists work_lists_delete on public.work_lists;
create policy work_lists_delete
  on public.work_lists for delete to authenticated
  using (public.work_list_has_access(id, 'full_edit'));

drop policy if exists work_tasks_insert on public.work_tasks;
create policy work_tasks_insert
  on public.work_tasks for insert to authenticated
  with check (public.work_list_has_access(list_id, 'full_edit'));

drop policy if exists work_tasks_update on public.work_tasks;
create policy work_tasks_update
  on public.work_tasks for update to authenticated
  using (public.work_list_has_access(list_id, 'comment'))
  with check (public.work_list_has_access(list_id, 'comment'));

drop policy if exists work_tasks_delete on public.work_tasks;
create policy work_tasks_delete
  on public.work_tasks for delete to authenticated
  using (public.work_list_has_access(list_id, 'edit'));

drop policy if exists task_assignees_insert on public.task_assignees;
create policy task_assignees_insert
  on public.task_assignees for insert to authenticated
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

drop policy if exists task_assignees_update on public.task_assignees;
create policy task_assignees_update
  on public.task_assignees for update to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  )
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

drop policy if exists task_assignees_delete on public.task_assignees;
create policy task_assignees_delete
  on public.task_assignees for delete to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

drop policy if exists task_activities_insert on public.task_activities;
create policy task_activities_insert
  on public.task_activities for insert to authenticated
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id
        and (
          (kind = 'comment' and public.work_list_has_access(t.list_id, 'comment'))
          or (kind <> 'comment' and public.work_list_has_access(t.list_id, 'edit'))
        )
    )
  );

drop policy if exists task_files_insert on public.task_files;
create policy task_files_insert
  on public.task_files for insert to authenticated
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

drop policy if exists task_files_update on public.task_files;
create policy task_files_update
  on public.task_files for update to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  )
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

drop policy if exists task_files_delete on public.task_files;
create policy task_files_delete
  on public.task_files for delete to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

drop policy if exists list_files_insert on public.list_files;
create policy list_files_insert
  on public.list_files for insert to authenticated
  with check (public.work_list_has_access(list_id, 'full_edit'));

drop policy if exists list_files_update on public.list_files;
create policy list_files_update
  on public.list_files for update to authenticated
  using (public.work_list_has_access(list_id, 'edit'))
  with check (public.work_list_has_access(list_id, 'edit'));

drop policy if exists list_files_delete on public.list_files;
create policy list_files_delete
  on public.list_files for delete to authenticated
  using (public.work_list_has_access(list_id, 'edit'));

drop policy if exists work_list_viewers_insert on public.work_list_viewers;
create policy work_list_viewers_insert
  on public.work_list_viewers for insert to authenticated
  with check (public.work_list_has_access(list_id, 'edit'));

drop policy if exists work_list_viewers_delete on public.work_list_viewers;
create policy work_list_viewers_delete
  on public.work_list_viewers for delete to authenticated
  using (public.work_list_has_access(list_id, 'edit'));

drop policy if exists work_list_viewer_roles_insert on public.work_list_viewer_roles;
create policy work_list_viewer_roles_insert
  on public.work_list_viewer_roles for insert to authenticated
  with check (
    public.work_list_has_access(list_id, 'edit')
    and exists (
      select 1
      from public.work_lists as l
      join public.team_roles as r
        on r.id = role_id
       and r.team_id = l.team_id
      where l.id = list_id
    )
  );

drop policy if exists work_list_viewer_roles_delete on public.work_list_viewer_roles;
create policy work_list_viewer_roles_delete
  on public.work_list_viewer_roles for delete to authenticated
  using (public.work_list_has_access(list_id, 'edit'));
