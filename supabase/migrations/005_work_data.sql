-- Shared team work data. Text ids match the app (`team-…`, `list-…`, `task-…`).

create table if not exists public.teams (
  id text primary key,
  name text not null,
  initials text not null default '',
  icon text,
  color text not null default 'black',
  logo_url text,
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  email text not null default '',
  name text not null default '',
  role text not null default '',
  tone_class_name text not null default '',
  avatar_url text,
  last_online_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists team_members_team_user_idx
  on public.team_members (team_id, user_id)
  where user_id is not null;

create unique index if not exists team_members_team_email_idx
  on public.team_members (team_id, lower(email))
  where email <> '';

create index if not exists team_members_team_id_idx on public.team_members (team_id);
create index if not exists team_members_user_id_idx on public.team_members (user_id);

create table if not exists public.work_lists (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  name text not null,
  description text not null default '',
  icon text,
  color text not null default 'black',
  kind text not null default 'list' check (kind in ('list', 'folder')),
  created_at timestamptz not null default now()
);

create index if not exists work_lists_team_id_idx on public.work_lists (team_id);

create table if not exists public.work_tasks (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  list_id text not null references public.work_lists (id) on delete cascade,
  parent_id text references public.work_tasks (id) on delete cascade,
  kind text not null check (kind in ('task', 'subtask', 'folder')),
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  start_date date,
  due_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists work_tasks_team_id_idx on public.work_tasks (team_id);
create index if not exists work_tasks_list_id_idx on public.work_tasks (list_id);
create index if not exists work_tasks_parent_id_idx on public.work_tasks (parent_id);

create table if not exists public.task_assignees (
  task_id text not null references public.work_tasks (id) on delete cascade,
  member_id text not null references public.team_members (id) on delete cascade,
  primary key (task_id, member_id)
);

create table if not exists public.task_activities (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  task_id text not null references public.work_tasks (id) on delete cascade,
  actor_id text not null default '',
  kind text not null check (
    kind in ('created', 'status', 'assignees', 'start_date', 'due_date', 'comment', 'file')
  ),
  from_status text,
  to_status text,
  assignee_ids text[] not null default '{}',
  date_value date,
  text text,
  file_name text,
  created_at timestamptz not null default now()
);

create index if not exists task_activities_task_id_idx on public.task_activities (task_id);

create table if not exists public.task_files (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  task_id text not null references public.work_tasks (id) on delete cascade,
  name text not null,
  mime_type text not null default 'application/octet-stream',
  size integer not null default 0,
  content text,
  created_at timestamptz not null default now()
);

create index if not exists task_files_task_id_idx on public.task_files (task_id);

create table if not exists public.list_files (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  list_id text not null references public.work_lists (id) on delete cascade,
  parent_id text,
  name text not null,
  mime_type text not null default 'application/octet-stream',
  size integer not null default 0,
  content text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists list_files_list_id_idx on public.list_files (list_id);

create table if not exists public.app_notifications (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  kind text not null check (kind in ('assigned', 'comment', 'due', 'file')),
  actor_id text,
  recipient_id text,
  task_title text not null,
  href text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists app_notifications_team_id_idx on public.app_notifications (team_id);
create index if not exists app_notifications_recipient_idx on public.app_notifications (recipient_id);

create table if not exists public.team_todos (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  assignee_id text,
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists team_todos_team_id_idx on public.team_todos (team_id);

create or replace function public.is_team_member(p_team_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members as m
    where m.team_id = p_team_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_team_owner(p_team_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members as m
    where m.team_id = p_team_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

revoke all on function public.is_team_member(text) from public, anon;
revoke all on function public.is_team_owner(text) from public, anon;
grant execute on function public.is_team_member(text) to authenticated;
grant execute on function public.is_team_owner(text) to authenticated;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.work_lists enable row level security;
alter table public.work_tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_activities enable row level security;
alter table public.task_files enable row level security;
alter table public.list_files enable row level security;
alter table public.app_notifications enable row level security;
alter table public.team_todos enable row level security;

revoke all on table public.teams from anon, authenticated;
revoke all on table public.team_members from anon, authenticated;
revoke all on table public.work_lists from anon, authenticated;
revoke all on table public.work_tasks from anon, authenticated;
revoke all on table public.task_assignees from anon, authenticated;
revoke all on table public.task_activities from anon, authenticated;
revoke all on table public.task_files from anon, authenticated;
revoke all on table public.list_files from anon, authenticated;
revoke all on table public.app_notifications from anon, authenticated;
revoke all on table public.team_todos from anon, authenticated;

grant select, insert, update, delete on table public.teams to authenticated;
grant select, insert, update, delete on table public.team_members to authenticated;
grant select, insert, update, delete on table public.work_lists to authenticated;
grant select, insert, update, delete on table public.work_tasks to authenticated;
grant select, insert, update, delete on table public.task_assignees to authenticated;
grant select, insert, update, delete on table public.task_activities to authenticated;
grant select, insert, update, delete on table public.task_files to authenticated;
grant select, insert, update, delete on table public.list_files to authenticated;
grant select, insert, update, delete on table public.app_notifications to authenticated;
grant select, insert, update, delete on table public.team_todos to authenticated;

drop policy if exists teams_deny_anon on public.teams;
create policy teams_deny_anon on public.teams for all to anon using (false) with check (false);
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams for select to authenticated
  using (public.is_team_member(id) or created_by = auth.uid());
drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams for insert to authenticated
  with check (created_by = auth.uid());
drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update to authenticated
  using (public.is_team_owner(id)) with check (public.is_team_owner(id));
drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams for delete to authenticated
  using (public.is_team_owner(id));

drop policy if exists team_members_deny_anon on public.team_members;
create policy team_members_deny_anon on public.team_members for all to anon using (false) with check (false);
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select to authenticated
  using (public.is_team_member(team_id) or user_id = auth.uid());
drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert on public.team_members for insert to authenticated
  with check (
    public.is_team_owner(team_id)
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.teams as t
        where t.id = team_id and t.created_by = auth.uid()
      )
    )
  );
drop policy if exists team_members_update on public.team_members;
create policy team_members_update on public.team_members for update to authenticated
  using (public.is_team_owner(team_id) or user_id = auth.uid())
  with check (public.is_team_owner(team_id) or user_id = auth.uid());
drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete on public.team_members for delete to authenticated
  using (public.is_team_owner(team_id) and user_id is distinct from auth.uid());

drop policy if exists work_lists_deny_anon on public.work_lists;
create policy work_lists_deny_anon on public.work_lists for all to anon using (false) with check (false);
drop policy if exists work_lists_all on public.work_lists;
create policy work_lists_all on public.work_lists for all to authenticated
  using (public.is_team_member(team_id)) with check (public.is_team_member(team_id));

drop policy if exists work_tasks_deny_anon on public.work_tasks;
create policy work_tasks_deny_anon on public.work_tasks for all to anon using (false) with check (false);
drop policy if exists work_tasks_all on public.work_tasks;
create policy work_tasks_all on public.work_tasks for all to authenticated
  using (public.is_team_member(team_id)) with check (public.is_team_member(team_id));

drop policy if exists task_assignees_deny_anon on public.task_assignees;
create policy task_assignees_deny_anon on public.task_assignees for all to anon using (false) with check (false);
drop policy if exists task_assignees_all on public.task_assignees;
create policy task_assignees_all on public.task_assignees for all to authenticated
  using (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.is_team_member(t.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.work_tasks as t
      where t.id = task_id and public.is_team_member(t.team_id)
    )
  );

drop policy if exists task_activities_deny_anon on public.task_activities;
create policy task_activities_deny_anon on public.task_activities for all to anon using (false) with check (false);
drop policy if exists task_activities_all on public.task_activities;
create policy task_activities_all on public.task_activities for all to authenticated
  using (public.is_team_member(team_id)) with check (public.is_team_member(team_id));

drop policy if exists task_files_deny_anon on public.task_files;
create policy task_files_deny_anon on public.task_files for all to anon using (false) with check (false);
drop policy if exists task_files_all on public.task_files;
create policy task_files_all on public.task_files for all to authenticated
  using (public.is_team_member(team_id)) with check (public.is_team_member(team_id));

drop policy if exists list_files_deny_anon on public.list_files;
create policy list_files_deny_anon on public.list_files for all to anon using (false) with check (false);
drop policy if exists list_files_all on public.list_files;
create policy list_files_all on public.list_files for all to authenticated
  using (public.is_team_member(team_id)) with check (public.is_team_member(team_id));

drop policy if exists app_notifications_deny_anon on public.app_notifications;
create policy app_notifications_deny_anon on public.app_notifications for all to anon using (false) with check (false);
drop policy if exists app_notifications_all on public.app_notifications;
create policy app_notifications_all on public.app_notifications for all to authenticated
  using (public.is_team_member(team_id)) with check (public.is_team_member(team_id));

drop policy if exists team_todos_deny_anon on public.team_todos;
create policy team_todos_deny_anon on public.team_todos for all to anon using (false) with check (false);
drop policy if exists team_todos_all on public.team_todos;
create policy team_todos_all on public.team_todos for all to authenticated
  using (public.is_team_member(team_id)) with check (public.is_team_member(team_id));

drop policy if exists users_select_teammates on public.users;
create policy users_select_teammates
  on public.users
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.team_members as mine
      join public.team_members as theirs on theirs.team_id = mine.team_id
      where mine.user_id = auth.uid()
        and theirs.user_id = users.id
    )
  );

create or replace function public.link_team_member_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.team_members
  set
    user_id = new.id,
    name = case
      when pg_catalog.btrim(name) = '' then new.name
      else name
    end,
    avatar_url = coalesce(avatar_url, nullif(new.avatar, ''))
  where user_id is null
    and email <> ''
    and lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists users_link_team_members on public.users;
create trigger users_link_team_members
  after insert or update of email, name, avatar on public.users
  for each row
  execute function public.link_team_member_user();

create or replace function public.ensure_user_profile(
  p_name text default '',
  p_avatar text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  display_name text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  display_name := nullif(pg_catalog.btrim(coalesce(p_name, '')), '');
  if display_name is null then
    display_name := coalesce(auth.jwt() ->> 'email', 'User');
  end if;

  insert into public.users (id, email, name, avatar)
  values (
    uid,
    coalesce(auth.jwt() ->> 'email', ''),
    display_name,
    coalesce(p_avatar, '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    avatar = excluded.avatar;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.teams;
exception when duplicate_object then null; when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.team_members;
exception when duplicate_object then null; when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.work_lists;
exception when duplicate_object then null; when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.work_tasks;
exception when duplicate_object then null; when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.task_assignees;
exception when duplicate_object then null; when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.task_activities;
exception when duplicate_object then null; when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.task_files;
exception when duplicate_object then null; when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.list_files;
exception when duplicate_object then null; when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.app_notifications;
exception when duplicate_object then null; when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.team_todos;
exception when duplicate_object then null; when undefined_object then null;
end $$;
