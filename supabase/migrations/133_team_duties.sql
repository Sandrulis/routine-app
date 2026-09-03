-- Team duties (job labels) alongside permission roles.
-- One member has one role (permissions) and can have many duties (identity / routing).

create table if not exists public.team_duties (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists team_duties_team_id_idx on public.team_duties (team_id);

create unique index if not exists team_duties_team_name_lower_idx
  on public.team_duties (team_id, lower(name));

create table if not exists public.team_member_duties (
  member_id text not null references public.team_members (id) on delete cascade,
  duty_id text not null references public.team_duties (id) on delete cascade,
  primary key (member_id, duty_id)
);

create index if not exists team_member_duties_duty_id_idx
  on public.team_member_duties (duty_id);

create table if not exists public.task_assignee_duties (
  task_id text not null references public.work_tasks (id) on delete cascade,
  duty_id text not null references public.team_duties (id) on delete cascade,
  primary key (task_id, duty_id)
);

create index if not exists task_assignee_duties_duty_id_idx
  on public.task_assignee_duties (duty_id);

create table if not exists public.work_list_viewer_duties (
  list_id text not null references public.work_lists (id) on delete cascade,
  duty_id text not null references public.team_duties (id) on delete cascade,
  access_level text not null default 'edit',
  primary key (list_id, duty_id),
  constraint work_list_viewer_duties_access_level_check
    check (access_level in ('full_edit', 'edit', 'comment', 'view'))
);

create index if not exists work_list_viewer_duties_duty_id_idx
  on public.work_list_viewer_duties (duty_id);

-- RLS: team_duties
alter table public.team_duties enable row level security;
revoke all on table public.team_duties from anon, authenticated;
grant select, insert, update, delete on table public.team_duties to authenticated;

drop policy if exists team_duties_deny_anon on public.team_duties;
create policy team_duties_deny_anon
  on public.team_duties for all to anon using (false) with check (false);

drop policy if exists team_duties_select on public.team_duties;
create policy team_duties_select
  on public.team_duties for select to authenticated
  using (public.is_team_member(team_id) or public.current_user_is_admin());

drop policy if exists team_duties_insert on public.team_duties;
create policy team_duties_insert
  on public.team_duties for insert to authenticated
  with check (public.is_team_owner(team_id) or public.current_user_is_admin());

drop policy if exists team_duties_update on public.team_duties;
create policy team_duties_update
  on public.team_duties for update to authenticated
  using (public.is_team_owner(team_id) or public.current_user_is_admin())
  with check (public.is_team_owner(team_id) or public.current_user_is_admin());

drop policy if exists team_duties_delete on public.team_duties;
create policy team_duties_delete
  on public.team_duties for delete to authenticated
  using (public.is_team_owner(team_id) or public.current_user_is_admin());

-- RLS: team_member_duties
alter table public.team_member_duties enable row level security;
revoke all on table public.team_member_duties from anon, authenticated;
grant select, insert, delete on table public.team_member_duties to authenticated;

drop policy if exists team_member_duties_deny_anon on public.team_member_duties;
create policy team_member_duties_deny_anon
  on public.team_member_duties for all to anon using (false) with check (false);

drop policy if exists team_member_duties_select on public.team_member_duties;
create policy team_member_duties_select
  on public.team_member_duties for select to authenticated
  using (
    exists (
      select 1
      from public.team_members as m
      where m.id = member_id
        and (public.is_team_member(m.team_id) or public.current_user_is_admin())
    )
  );

drop policy if exists team_member_duties_insert on public.team_member_duties;
create policy team_member_duties_insert
  on public.team_member_duties for insert to authenticated
  with check (
    exists (
      select 1
      from public.team_members as m
      join public.team_duties as d on d.id = duty_id and d.team_id = m.team_id
      where m.id = member_id
        and (public.is_team_owner(m.team_id) or public.current_user_is_admin())
    )
  );

drop policy if exists team_member_duties_delete on public.team_member_duties;
create policy team_member_duties_delete
  on public.team_member_duties for delete to authenticated
  using (
    exists (
      select 1
      from public.team_members as m
      where m.id = member_id
        and (public.is_team_owner(m.team_id) or public.current_user_is_admin())
    )
  );

-- RLS: task_assignee_duties
alter table public.task_assignee_duties enable row level security;
revoke all on table public.task_assignee_duties from anon, authenticated;
grant select, insert, delete on table public.task_assignee_duties to authenticated;

drop policy if exists task_assignee_duties_deny_anon on public.task_assignee_duties;
create policy task_assignee_duties_deny_anon
  on public.task_assignee_duties for all to anon using (false) with check (false);

drop policy if exists task_assignee_duties_select on public.task_assignee_duties;
create policy task_assignee_duties_select
  on public.task_assignee_duties for select to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.can_view_work_list(t.list_id)
    )
  );

drop policy if exists task_assignee_duties_insert on public.task_assignee_duties;
create policy task_assignee_duties_insert
  on public.task_assignee_duties for insert to authenticated
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

drop policy if exists task_assignee_duties_delete on public.task_assignee_duties;
create policy task_assignee_duties_delete
  on public.task_assignee_duties for delete to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.work_list_has_access(t.list_id, 'edit')
    )
  );

-- RLS: work_list_viewer_duties
alter table public.work_list_viewer_duties enable row level security;
revoke all on table public.work_list_viewer_duties from anon, authenticated;
grant select, insert, delete on table public.work_list_viewer_duties to authenticated;

drop policy if exists work_list_viewer_duties_deny_anon on public.work_list_viewer_duties;
create policy work_list_viewer_duties_deny_anon
  on public.work_list_viewer_duties for all to anon using (false) with check (false);

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
        or (l.created_by is null and public.is_team_owner(l.team_id))
        or exists (
          select 1
          from public.work_list_viewers as v
          where v.list_id = l.id
            and v.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.work_list_viewer_roles as vr
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
          where vr.list_id = l.id
        )
        or exists (
          select 1
          from public.work_list_viewer_duties as vd
          join public.team_duties as d
            on d.id = vd.duty_id
           and d.team_id = l.team_id
          join public.team_members as m
            on m.team_id = l.team_id
           and m.user_id = auth.uid()
          join public.team_member_duties as md
            on md.member_id = m.id
           and md.duty_id = d.id
          where vd.list_id = l.id
        )
      )
  );
$$;

drop policy if exists work_list_viewer_duties_select on public.work_list_viewer_duties;
create policy work_list_viewer_duties_select
  on public.work_list_viewer_duties for select to authenticated
  using (public.can_view_work_list(list_id));

drop policy if exists work_list_viewer_duties_insert on public.work_list_viewer_duties;
create policy work_list_viewer_duties_insert
  on public.work_list_viewer_duties for insert to authenticated
  with check (
    exists (
      select 1
      from public.work_lists as l
      join public.team_duties as d
        on d.id = duty_id
       and d.team_id = l.team_id
      where l.id = list_id
        and (l.created_by = auth.uid() or public.is_team_owner(l.team_id))
    )
  );

drop policy if exists work_list_viewer_duties_delete on public.work_list_viewer_duties;
create policy work_list_viewer_duties_delete
  on public.work_list_viewer_duties for delete to authenticated
  using (
    exists (
      select 1
      from public.work_lists as l
      where l.id = list_id
        and (l.created_by = auth.uid() or public.is_team_owner(l.team_id))
    )
  );

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
        select access_level
        from (
          select vr.access_level, public.work_list_access_rank(vr.access_level) as rank
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
          union all
          select vd.access_level, public.work_list_access_rank(vd.access_level) as rank
          from public.work_list_viewer_duties as vd
          join public.work_lists as l
            on l.id = vd.list_id
          join public.team_duties as d
            on d.id = vd.duty_id
           and d.team_id = l.team_id
          join public.team_members as m
            on m.team_id = l.team_id
           and m.user_id = auth.uid()
          join public.team_member_duties as md
            on md.member_id = m.id
           and md.duty_id = d.id
          where vd.list_id = p_list_id
        ) as grants
        order by rank desc
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
  delete from public.task_assignee_duties where task_id = p_task_id;

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

  insert into public.task_assignee_duties (task_id, duty_id)
  select distinct p_task_id, d.id
  from public.team_duties as d
  where d.team_id = v_team_id
    and d.id = any (v_ids)
    and not exists (
      select 1
      from public.team_members as m
      where m.id = d.id
    )
    and not exists (
      select 1
      from public.team_roles as r
      where r.id = d.id
    );
end;
$$;

create or replace function public.update_team_duty_sort_orders(p_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id text;
  v_id text;
  v_index integer := 0;
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;

  select d.team_id into v_team_id
  from public.team_duties as d
  where d.id = p_ids[1];

  if v_team_id is null then
    return;
  end if;

  if not (public.is_team_owner(v_team_id) or public.current_user_is_admin()) then
    raise exception 'not allowed';
  end if;

  foreach v_id in array p_ids loop
    update public.team_duties as d
    set sort_order = v_index
    where d.id = v_id
      and d.team_id = v_team_id;
    v_index := v_index + 1;
  end loop;
end;
$$;

create or replace function public.set_member_duties(p_member_id text, p_duty_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id text;
  v_ids text[] := coalesce(p_duty_ids, '{}');
begin
  if p_member_id is null or btrim(p_member_id) = '' then
    return;
  end if;

  select m.team_id into v_team_id
  from public.team_members as m
  where m.id = p_member_id;

  if v_team_id is null then
    raise exception 'not allowed';
  end if;

  if not (public.is_team_owner(v_team_id) or public.current_user_is_admin()) then
    raise exception 'not allowed';
  end if;

  delete from public.team_member_duties where member_id = p_member_id;

  if cardinality(v_ids) = 0 then
    return;
  end if;

  insert into public.team_member_duties (member_id, duty_id)
  select distinct p_member_id, d.id
  from public.team_duties as d
  where d.team_id = v_team_id
    and d.id = any (v_ids);
end;
$$;

revoke all on function public.update_team_duty_sort_orders(text[]) from public, anon;
grant execute on function public.update_team_duty_sort_orders(text[]) to authenticated;
revoke all on function public.set_member_duties(text, text[]) from public, anon;
grant execute on function public.set_member_duties(text, text[]) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.team_duties;
exception when duplicate_object then null; when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.team_member_duties;
exception when duplicate_object then null; when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.task_assignee_duties;
exception when duplicate_object then null; when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.work_list_viewer_duties;
exception when duplicate_object then null; when undefined_object then null;
end $$;
