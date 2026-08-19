-- Per-list automations: triggers and actions scoped to a work list.

create table if not exists public.work_list_automations (
  id text primary key,
  list_id text not null references public.work_lists (id) on delete cascade,
  team_id text not null references public.teams (id) on delete cascade,
  trigger_kind text not null default 'folder_created',
  action_kind text not null default 'apply_template',
  template_id text references public.work_templates (id) on delete set null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint work_list_automations_trigger_kind_check
    check (trigger_kind in ('folder_created')),
  constraint work_list_automations_action_kind_check
    check (action_kind in ('apply_template')),
  constraint work_list_automations_unique_rule
    unique (list_id, trigger_kind, action_kind)
);

create index if not exists work_list_automations_list_id_idx
  on public.work_list_automations (list_id, sort_order);
create index if not exists work_list_automations_team_id_idx
  on public.work_list_automations (team_id);

alter table public.work_list_automations enable row level security;

revoke all on table public.work_list_automations from anon, authenticated;
grant select, insert, update, delete on table public.work_list_automations to authenticated;

drop policy if exists work_list_automations_deny_anon on public.work_list_automations;
create policy work_list_automations_deny_anon
  on public.work_list_automations for all to anon using (false) with check (false);

drop policy if exists work_list_automations_select on public.work_list_automations;
create policy work_list_automations_select
  on public.work_list_automations for select to authenticated
  using (public.work_list_has_access(list_id, 'view'));

drop policy if exists work_list_automations_insert on public.work_list_automations;
create policy work_list_automations_insert
  on public.work_list_automations for insert to authenticated
  with check (
    public.work_list_has_access(list_id, 'edit')
    and exists (
      select 1
      from public.work_lists as l
      where l.id = list_id
        and l.team_id = team_id
    )
    and (
      template_id is null
      or exists (
        select 1
        from public.work_templates as t
        where t.id = template_id
          and t.team_id = team_id
      )
    )
  );

drop policy if exists work_list_automations_update on public.work_list_automations;
create policy work_list_automations_update
  on public.work_list_automations for update to authenticated
  using (public.work_list_has_access(list_id, 'edit'))
  with check (
    public.work_list_has_access(list_id, 'edit')
    and exists (
      select 1
      from public.work_lists as l
      where l.id = list_id
        and l.team_id = team_id
    )
    and (
      template_id is null
      or exists (
        select 1
        from public.work_templates as t
        where t.id = template_id
          and t.team_id = team_id
      )
    )
  );

drop policy if exists work_list_automations_delete on public.work_list_automations;
create policy work_list_automations_delete
  on public.work_list_automations for delete to authenticated
  using (public.work_list_has_access(list_id, 'edit'));
