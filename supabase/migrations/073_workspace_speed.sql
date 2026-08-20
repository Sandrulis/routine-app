-- Workspace speed: team_id indexes and batched write RPCs.

create index if not exists task_activities_team_id_idx
  on public.task_activities (team_id);
create index if not exists task_activities_task_created_idx
  on public.task_activities (task_id, created_at desc);
create index if not exists task_files_team_id_idx
  on public.task_files (team_id);
create index if not exists list_files_team_id_idx
  on public.list_files (team_id);
create index if not exists app_notifications_recipient_created_idx
  on public.app_notifications (recipient_id, created_at desc);

alter table public.task_files
  add column if not exists has_content boolean not null default false;
alter table public.list_files
  add column if not exists has_content boolean not null default false;

update public.task_files
set has_content = true
where content is not null
  and has_content = false;
update public.list_files
set has_content = true
where content is not null
  and has_content = false;

create or replace function public.update_task_sort_orders(p_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;

  update public.work_tasks as t
  set sort_order = u.ord::integer - 1
  from unnest(p_ids) with ordinality as u(id, ord)
  where t.id = u.id
    and public.is_team_member(t.team_id);
end;
$$;

create or replace function public.update_list_sort_orders(p_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;

  update public.work_lists as l
  set sort_order = u.ord::integer - 1
  from unnest(p_ids) with ordinality as u(id, ord)
  where l.id = u.id
    and public.is_team_member(l.team_id);
end;
$$;

create or replace function public.update_list_status_sort_orders(p_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;

  update public.list_statuses as s
  set sort_order = u.ord::integer - 1
  from unnest(p_ids) with ordinality as u(id, ord)
  where s.id = u.id
    and public.is_team_member(s.team_id);
end;
$$;

create or replace function public.update_work_task_status_sort_orders(p_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;

  update public.work_task_statuses as s
  set sort_order = u.ord::integer - 1
  from unnest(p_ids) with ordinality as u(id, ord)
  where s.id = u.id
    and public.is_team_member(s.team_id);
end;
$$;

create or replace function public.update_team_role_sort_orders(p_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;

  update public.team_roles as r
  set sort_order = u.ord::integer - 1
  from unnest(p_ids) with ordinality as u(id, ord)
  where r.id = u.id
    and public.is_team_member(r.team_id);
end;
$$;

create or replace function public.set_task_assignees(p_task_id text, p_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id text;
  v_ids text[] := coalesce(p_ids, '{}');
begin
  if p_task_id is null or btrim(p_task_id) = '' then
    return;
  end if;

  select t.team_id into v_team_id
  from public.work_tasks as t
  where t.id = p_task_id;

  if v_team_id is null or not public.is_team_member(v_team_id) then
    raise exception 'not allowed';
  end if;

  delete from public.task_assignees where task_id = p_task_id;
  delete from public.task_assignee_roles where task_id = p_task_id;

  if cardinality(v_ids) = 0 then
    return;
  end if;

  insert into public.task_assignees (task_id, member_id)
  select distinct p_task_id, m.id
  from public.team_members as m
  where m.team_id = v_team_id
    and m.id = any (v_ids);

  insert into public.task_assignee_roles (task_id, role_id)
  select distinct p_task_id, r.id
  from public.team_roles as r
  where r.team_id = v_team_id
    and r.id = any (v_ids)
    and not exists (
      select 1
      from public.team_members as m
      where m.id = r.id
    );
end;
$$;

create or replace function public.update_tasks_status(
  p_ids text[],
  p_status text,
  p_changed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;

  update public.work_tasks as t
  set
    status = p_status,
    status_changed_at = coalesce(p_changed_at, now())
  where t.id = any (p_ids)
    and public.is_team_member(t.team_id);
end;
$$;

revoke all on function public.update_task_sort_orders(text[]) from public, anon;
revoke all on function public.update_list_sort_orders(text[]) from public, anon;
revoke all on function public.update_list_status_sort_orders(text[]) from public, anon;
revoke all on function public.update_work_task_status_sort_orders(text[]) from public, anon;
revoke all on function public.update_team_role_sort_orders(text[]) from public, anon;
revoke all on function public.set_task_assignees(text, text[]) from public, anon;
revoke all on function public.update_tasks_status(text[], text, timestamptz) from public, anon;

grant execute on function public.update_task_sort_orders(text[]) to authenticated;
grant execute on function public.update_list_sort_orders(text[]) to authenticated;
grant execute on function public.update_list_status_sort_orders(text[]) to authenticated;
grant execute on function public.update_work_task_status_sort_orders(text[]) to authenticated;
grant execute on function public.update_team_role_sort_orders(text[]) to authenticated;
grant execute on function public.set_task_assignees(text, text[]) to authenticated;
grant execute on function public.update_tasks_status(text[], text, timestamptz) to authenticated;
