-- Backfill creator on legacy work lists so private visibility works.

update public.work_lists as l
set created_by = t.created_by
from public.teams as t
where l.team_id = t.id
  and l.created_by is null;

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
      )
  );
$$;

drop policy if exists work_list_viewers_insert on public.work_list_viewers;
create policy work_list_viewers_insert
  on public.work_list_viewers for insert to authenticated
  with check (
    exists (
      select 1
      from public.work_lists as l
      where l.id = list_id
        and (l.created_by = auth.uid() or public.is_team_owner(l.team_id))
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
        and (l.created_by = auth.uid() or public.is_team_owner(l.team_id))
    )
  );
