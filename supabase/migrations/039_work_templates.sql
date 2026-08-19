-- Team-scoped work templates: named task lists with nested subtask lists.

create table if not exists public.work_templates (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint work_templates_name_check check (char_length(btrim(name)) > 0)
);

create index if not exists work_templates_team_id_idx
  on public.work_templates (team_id, sort_order, created_at);

create table if not exists public.work_template_items (
  id text primary key,
  template_id text not null references public.work_templates (id) on delete cascade,
  parent_id text references public.work_template_items (id) on delete cascade,
  kind text not null default 'task' check (kind in ('task', 'subtask')),
  title text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  constraint work_template_items_root_kind_check check (
    (parent_id is null and kind = 'task')
    or (parent_id is not null and kind = 'subtask')
  )
);

create index if not exists work_template_items_template_id_idx
  on public.work_template_items (template_id, parent_id, sort_order);

alter table public.work_templates enable row level security;
alter table public.work_template_items enable row level security;

revoke all on table public.work_templates from anon, authenticated;
revoke all on table public.work_template_items from anon, authenticated;
grant select, insert, update, delete on table public.work_templates to authenticated;
grant select, insert, update, delete on table public.work_template_items to authenticated;

drop policy if exists work_templates_deny_anon on public.work_templates;
create policy work_templates_deny_anon
  on public.work_templates for all to anon using (false) with check (false);

drop policy if exists work_templates_select on public.work_templates;
create policy work_templates_select
  on public.work_templates for select to authenticated
  using (public.is_team_member(team_id));

drop policy if exists work_templates_insert on public.work_templates;
create policy work_templates_insert
  on public.work_templates for insert to authenticated
  with check (public.is_team_member(team_id));

drop policy if exists work_templates_update on public.work_templates;
create policy work_templates_update
  on public.work_templates for update to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists work_templates_delete on public.work_templates;
create policy work_templates_delete
  on public.work_templates for delete to authenticated
  using (public.is_team_member(team_id));

drop policy if exists work_template_items_deny_anon on public.work_template_items;
create policy work_template_items_deny_anon
  on public.work_template_items for all to anon using (false) with check (false);

drop policy if exists work_template_items_select on public.work_template_items;
create policy work_template_items_select
  on public.work_template_items for select to authenticated
  using (
    exists (
      select 1
      from public.work_templates as t
      where t.id = template_id and public.is_team_member(t.team_id)
    )
  );

drop policy if exists work_template_items_insert on public.work_template_items;
create policy work_template_items_insert
  on public.work_template_items for insert to authenticated
  with check (
    exists (
      select 1
      from public.work_templates as t
      where t.id = template_id and public.is_team_member(t.team_id)
    )
  );

drop policy if exists work_template_items_update on public.work_template_items;
create policy work_template_items_update
  on public.work_template_items for update to authenticated
  using (
    exists (
      select 1
      from public.work_templates as t
      where t.id = template_id and public.is_team_member(t.team_id)
    )
  )
  with check (
    exists (
      select 1
      from public.work_templates as t
      where t.id = template_id and public.is_team_member(t.team_id)
    )
  );

drop policy if exists work_template_items_delete on public.work_template_items;
create policy work_template_items_delete
  on public.work_template_items for delete to authenticated
  using (
    exists (
      select 1
      from public.work_templates as t
      where t.id = template_id and public.is_team_member(t.team_id)
    )
  );
