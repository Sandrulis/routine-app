-- Routine schema. Idempotent. RLS deny for anon / authenticated.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar text not null,
  role text not null check (role in ('Vadītājs', 'Projektu vadītājs', 'Darbinieks')),
  manager_id uuid references public.users (id) on delete set null
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists public.project_statuses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  color text not null default '#94a3b8'
);

create table if not exists public.delegation_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status uuid not null references public.project_statuses (id),
  assignee_id uuid references public.users (id) on delete set null,
  project_id uuid not null references public.projects (id) on delete cascade,
  parent_task_id uuid references public.tasks (id) on delete set null,
  progress_type text not null default 'none' check (progress_type in ('none', 'subtasks', 'parts')),
  due_date date
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  parent_task_id uuid not null references public.tasks (id) on delete cascade,
  assignee_id uuid references public.users (id) on delete set null
);

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  completed boolean not null default false,
  marked_by_id uuid references public.users (id) on delete set null,
  marked_at timestamptz,
  parent_task_id uuid not null references public.tasks (id) on delete cascade,
  sort_order integer not null default 0
);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_statuses enable row level security;
alter table public.delegation_templates enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.parts enable row level security;

drop policy if exists users_deny_anon on public.users;
drop policy if exists users_deny_authenticated on public.users;
create policy users_deny_anon on public.users for all to anon using (false) with check (false);
create policy users_deny_authenticated on public.users for all to authenticated using (false) with check (false);

drop policy if exists projects_deny_anon on public.projects;
drop policy if exists projects_deny_authenticated on public.projects;
create policy projects_deny_anon on public.projects for all to anon using (false) with check (false);
create policy projects_deny_authenticated on public.projects for all to authenticated using (false) with check (false);

drop policy if exists project_statuses_deny_anon on public.project_statuses;
drop policy if exists project_statuses_deny_authenticated on public.project_statuses;
create policy project_statuses_deny_anon on public.project_statuses for all to anon using (false) with check (false);
create policy project_statuses_deny_authenticated on public.project_statuses for all to authenticated using (false) with check (false);

drop policy if exists delegation_templates_deny_anon on public.delegation_templates;
drop policy if exists delegation_templates_deny_authenticated on public.delegation_templates;
create policy delegation_templates_deny_anon on public.delegation_templates for all to anon using (false) with check (false);
create policy delegation_templates_deny_authenticated on public.delegation_templates for all to authenticated using (false) with check (false);

drop policy if exists tasks_deny_anon on public.tasks;
drop policy if exists tasks_deny_authenticated on public.tasks;
create policy tasks_deny_anon on public.tasks for all to anon using (false) with check (false);
create policy tasks_deny_authenticated on public.tasks for all to authenticated using (false) with check (false);

drop policy if exists subtasks_deny_anon on public.subtasks;
drop policy if exists subtasks_deny_authenticated on public.subtasks;
create policy subtasks_deny_anon on public.subtasks for all to anon using (false) with check (false);
create policy subtasks_deny_authenticated on public.subtasks for all to authenticated using (false) with check (false);

drop policy if exists parts_deny_anon on public.parts;
drop policy if exists parts_deny_authenticated on public.parts;
create policy parts_deny_anon on public.parts for all to anon using (false) with check (false);
create policy parts_deny_authenticated on public.parts for all to authenticated using (false) with check (false);
