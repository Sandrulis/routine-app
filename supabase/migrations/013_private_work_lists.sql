-- Private work lists with per-user viewer access.

alter table public.work_lists
  add column if not exists is_private boolean not null default false,
  add column if not exists created_by uuid references public.users (id) on delete set null;

create table if not exists public.work_list_viewers (
  list_id text not null references public.work_lists (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  primary key (list_id, user_id)
);

create index if not exists work_list_viewers_user_id_idx
  on public.work_list_viewers (user_id);

create or replace function public.can_view_work_list(p_list_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.work_lists as l
    where l.id = p_list_id
      and public.is_team_member(l.team_id)
      and (
        l.is_private = false
        or l.created_by = auth.uid()
        or exists (
          select 1
          from public.work_list_viewers as v
          where v.list_id = l.id
            and v.user_id = auth.uid()
        )
      )
  );
$$;

revoke all on function public.can_view_work_list(text) from public, anon;
grant execute on function public.can_view_work_list(text) to authenticated;

alter table public.work_list_viewers enable row level security;

revoke all on table public.work_list_viewers from anon, authenticated;
grant select, insert, delete on table public.work_list_viewers to authenticated;

drop policy if exists work_list_viewers_deny_anon on public.work_list_viewers;
create policy work_list_viewers_deny_anon
  on public.work_list_viewers for all to anon using (false) with check (false);

drop policy if exists work_list_viewers_select on public.work_list_viewers;
create policy work_list_viewers_select
  on public.work_list_viewers for select to authenticated
  using (public.can_view_work_list(list_id));

drop policy if exists work_list_viewers_insert on public.work_list_viewers;
create policy work_list_viewers_insert
  on public.work_list_viewers for insert to authenticated
  with check (
    exists (
      select 1
      from public.work_lists as l
      where l.id = list_id
        and l.created_by = auth.uid()
    )
  );

drop policy if exists work_list_viewers_delete on public.work_list_viewers;
create policy work_list_viewers_delete
  on public.work_list_viewers for delete to authenticated
  using (
    exists (
      select 1
      from public.work_lists as l
      where l.id = list_id
        and l.created_by = auth.uid()
    )
  );

-- work_lists: replace blanket policy with visibility-aware policies
drop policy if exists work_lists_all on public.work_lists;

drop policy if exists work_lists_select on public.work_lists;
create policy work_lists_select
  on public.work_lists for select to authenticated
  using (public.can_view_work_list(id));

drop policy if exists work_lists_insert on public.work_lists;
create policy work_lists_insert
  on public.work_lists for insert to authenticated
  with check (public.is_team_member(team_id));

drop policy if exists work_lists_update on public.work_lists;
create policy work_lists_update
  on public.work_lists for update to authenticated
  using (
    public.is_team_member(team_id)
    and (created_by = auth.uid() or public.is_team_owner(team_id))
  )
  with check (public.is_team_member(team_id));

drop policy if exists work_lists_delete on public.work_lists;
create policy work_lists_delete
  on public.work_lists for delete to authenticated
  using (
    public.is_team_member(team_id)
    and (created_by = auth.uid() or public.is_team_owner(team_id))
  );

-- work_tasks
drop policy if exists work_tasks_all on public.work_tasks;

drop policy if exists work_tasks_select on public.work_tasks;
create policy work_tasks_select
  on public.work_tasks for select to authenticated
  using (public.can_view_work_list(list_id));

drop policy if exists work_tasks_insert on public.work_tasks;
create policy work_tasks_insert
  on public.work_tasks for insert to authenticated
  with check (public.can_view_work_list(list_id));

drop policy if exists work_tasks_update on public.work_tasks;
create policy work_tasks_update
  on public.work_tasks for update to authenticated
  using (public.can_view_work_list(list_id))
  with check (public.can_view_work_list(list_id));

drop policy if exists work_tasks_delete on public.work_tasks;
create policy work_tasks_delete
  on public.work_tasks for delete to authenticated
  using (public.can_view_work_list(list_id));

-- task_assignees
drop policy if exists task_assignees_all on public.task_assignees;

drop policy if exists task_assignees_select on public.task_assignees;
create policy task_assignees_select
  on public.task_assignees for select to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_assignees_insert on public.task_assignees;
create policy task_assignees_insert
  on public.task_assignees for insert to authenticated
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_assignees_update on public.task_assignees;
create policy task_assignees_update
  on public.task_assignees for update to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  )
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_assignees_delete on public.task_assignees;
create policy task_assignees_delete
  on public.task_assignees for delete to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

-- task_activities
drop policy if exists task_activities_all on public.task_activities;

drop policy if exists task_activities_select on public.task_activities;
create policy task_activities_select
  on public.task_activities for select to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_activities_insert on public.task_activities;
create policy task_activities_insert
  on public.task_activities for insert to authenticated
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_activities_update on public.task_activities;
create policy task_activities_update
  on public.task_activities for update to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  )
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_activities_delete on public.task_activities;
create policy task_activities_delete
  on public.task_activities for delete to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

-- task_files
drop policy if exists task_files_all on public.task_files;

drop policy if exists task_files_select on public.task_files;
create policy task_files_select
  on public.task_files for select to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_files_insert on public.task_files;
create policy task_files_insert
  on public.task_files for insert to authenticated
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_files_update on public.task_files;
create policy task_files_update
  on public.task_files for update to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  )
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_files_delete on public.task_files;
create policy task_files_delete
  on public.task_files for delete to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

-- list_files
drop policy if exists list_files_all on public.list_files;

drop policy if exists list_files_select on public.list_files;
create policy list_files_select
  on public.list_files for select to authenticated
  using (public.can_view_work_list(list_id));

drop policy if exists list_files_insert on public.list_files;
create policy list_files_insert
  on public.list_files for insert to authenticated
  with check (public.can_view_work_list(list_id));

drop policy if exists list_files_update on public.list_files;
create policy list_files_update
  on public.list_files for update to authenticated
  using (public.can_view_work_list(list_id))
  with check (public.can_view_work_list(list_id));

drop policy if exists list_files_delete on public.list_files;
create policy list_files_delete
  on public.list_files for delete to authenticated
  using (public.can_view_work_list(list_id));
