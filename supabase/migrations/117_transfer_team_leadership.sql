-- Team leader can appoint another confirmed team user as leader.
-- Roles are swapped atomically; teams.created_by follows the new leader.

create or replace function public.team_members_guard_single_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_catalog.current_setting('routine.allow_owner_transfer', true) = 'on' then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.role = 'owner'
    and new.role is distinct from 'owner'
    and not exists (
      select 1
      from public.team_members as m
      where m.team_id = old.team_id
        and m.id <> old.id
        and m.role = 'owner'
    )
  then
    raise exception 'last_owner';
  end if;

  if new.role = 'owner'
    and (
      tg_op = 'INSERT'
      or old.role is distinct from 'owner'
    )
    and exists (
      select 1
      from public.team_members as m
      where m.team_id = new.team_id
        and m.id <> new.id
        and m.role = 'owner'
    )
  then
    raise exception 'owner_exists';
  end if;

  return new;
end;
$$;

drop trigger if exists team_members_guard_single_owner on public.team_members;
create trigger team_members_guard_single_owner
  after insert or update of role, role_id on public.team_members
  for each row
  execute function public.team_members_guard_single_owner();

create or replace function public.transfer_team_leadership(p_member_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  v_target public.team_members%rowtype;
  v_owner public.team_members%rowtype;
  v_owner_role_id text;
begin
  if uid is null then
    raise exception 'auth_required';
  end if;

  if pg_catalog.btrim(coalesce(p_member_id, '')) = '' then
    raise exception 'team_leader_transfer_failed';
  end if;

  select * into v_target
  from public.team_members
  where id = p_member_id;

  if not found then
    raise exception 'team_leader_transfer_failed';
  end if;

  if v_target.user_id is null then
    raise exception 'team_leader_transfer_pending';
  end if;

  if v_target.user_id = uid then
    raise exception 'team_leader_transfer_self';
  end if;

  if v_target.role = 'owner' then
    raise exception 'team_leader_transfer_failed';
  end if;

  select * into v_owner
  from public.team_members
  where team_id = v_target.team_id
    and user_id = uid
    and role = 'owner';

  if not found then
    raise exception 'team_leader_transfer_forbidden';
  end if;

  select r.id into v_owner_role_id
  from public.team_roles as r
  where r.team_id = v_target.team_id
    and r.slug = 'owner'
  limit 1;

  if v_owner_role_id is null then
    raise exception 'team_leader_transfer_failed';
  end if;

  perform pg_catalog.set_config('routine.allow_owner_transfer', 'on', true);

  perform 1
  from public.teams
  where id = v_target.team_id
  for update;

  update public.team_members
  set role = v_target.role,
      role_id = v_target.role_id
  where id = v_owner.id;

  update public.team_members
  set role = 'owner',
      role_id = v_owner_role_id
  where id = v_target.id;

  update public.teams
  set created_by = v_target.user_id
  where id = v_target.team_id
    and v_target.user_id is not null;
end;
$$;

revoke all on function public.team_members_guard_single_owner() from public, anon;
revoke all on function public.transfer_team_leadership(text) from public, anon;
grant execute on function public.transfer_team_leadership(text) to authenticated;
