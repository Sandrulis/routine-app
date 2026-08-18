-- Team-scoped labels for system task statuses.
-- Other teams keep the catalog name until they set their own overlay.

create table if not exists public.team_status_labels (
  team_id text not null references public.teams (id) on delete cascade,
  status_id text not null references public.task_statuses (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, status_id),
  constraint team_status_labels_label_check check (char_length(btrim(label)) > 0)
);

create index if not exists team_status_labels_team_id_idx
  on public.team_status_labels (team_id);

alter table public.team_status_labels enable row level security;

revoke all on table public.team_status_labels from anon, authenticated;
grant select, insert, update, delete on table public.team_status_labels to authenticated;

drop policy if exists team_status_labels_deny_anon on public.team_status_labels;
create policy team_status_labels_deny_anon
  on public.team_status_labels for all to anon using (false) with check (false);

drop policy if exists team_status_labels_select on public.team_status_labels;
create policy team_status_labels_select
  on public.team_status_labels for select to authenticated
  using (public.is_team_member(team_id));

drop policy if exists team_status_labels_insert on public.team_status_labels;
create policy team_status_labels_insert
  on public.team_status_labels for insert to authenticated
  with check (public.is_team_member(team_id));

drop policy if exists team_status_labels_update on public.team_status_labels;
create policy team_status_labels_update
  on public.team_status_labels for update to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists team_status_labels_delete on public.team_status_labels;
create policy team_status_labels_delete
  on public.team_status_labels for delete to authenticated
  using (public.is_team_member(team_id));
