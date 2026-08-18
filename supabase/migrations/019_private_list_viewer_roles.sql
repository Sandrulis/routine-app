-- Private work lists: grant access by team role and/or individual members.

create table if not exists public.work_list_viewer_roles (
  list_id text not null references public.work_lists (id) on delete cascade,
  role_id text not null references public.team_roles (id) on delete cascade,
  primary key (list_id, role_id)
);

create index if not exists work_list_viewer_roles_role_id_idx
  on public.work_list_viewer_roles (role_id);

alter table public.work_list_viewer_roles enable row level security;

revoke all on table public.work_list_viewer_roles from anon, authenticated;
grant select, insert, delete on table public.work_list_viewer_roles to authenticated;

drop policy if exists work_list_viewer_roles_deny_anon on public.work_list_viewer_roles;
create policy work_list_viewer_roles_deny_anon
  on public.work_list_viewer_roles for all to anon using (false) with check (false);

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
      )
  );
$$;

drop policy if exists work_list_viewer_roles_select on public.work_list_viewer_roles;
create policy work_list_viewer_roles_select
  on public.work_list_viewer_roles for select to authenticated
  using (public.can_view_work_list(list_id));

drop policy if exists work_list_viewer_roles_insert on public.work_list_viewer_roles;
create policy work_list_viewer_roles_insert
  on public.work_list_viewer_roles for insert to authenticated
  with check (
    exists (
      select 1
      from public.work_lists as l
      join public.team_roles as r
        on r.id = role_id
       and r.team_id = l.team_id
      where l.id = list_id
        and (l.created_by = auth.uid() or public.is_team_owner(l.team_id))
    )
  );

drop policy if exists work_list_viewer_roles_delete on public.work_list_viewer_roles;
create policy work_list_viewer_roles_delete
  on public.work_list_viewer_roles for delete to authenticated
  using (
    exists (
      select 1
      from public.work_lists as l
      where l.id = list_id
        and (l.created_by = auth.uid() or public.is_team_owner(l.team_id))
    )
  );
