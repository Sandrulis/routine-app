-- Security hardening: definer search_path, invite token column grants,
-- calendar token hash, admin audit, file has_content flag.

create extension if not exists pgcrypto;

create or replace function public.can_invite_team_members(p_team_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.team_members as m
    left join public.team_roles as r on r.id = m.role_id
    where m.team_id = p_team_id
      and m.user_id = auth.uid()
      and (
        m.role = 'owner'
        or coalesce((r.permissions -> 'actions' ->> 'team.invite')::boolean, false)
      )
  );
$$;

create or replace function public.accept_team_invitation(p_invitation_id text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_inv public.team_invitations%rowtype;
  v_user_email text;
  v_user_name text;
  v_user_avatar text;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  select * into v_inv
  from public.team_invitations
  where id = p_invitation_id
    and status = 'pending';

  if not found then
    raise exception 'invitation_not_found';
  end if;

  select email, name, avatar
  into v_user_email, v_user_name, v_user_avatar
  from public.users
  where id = auth.uid();

  if v_inv.invited_user_id is not null and v_inv.invited_user_id <> auth.uid() then
    raise exception 'invitation_forbidden';
  end if;

  if v_inv.invited_user_id is null
    and lower(v_inv.email) <> lower(coalesce(v_user_email, '')) then
    raise exception 'invitation_forbidden';
  end if;

  update public.team_members
  set
    user_id = auth.uid(),
    avatar_url = coalesce(nullif(v_user_avatar, ''), avatar_url),
    name = coalesce(nullif(btrim(name), ''), nullif(v_user_name, ''), name)
  where id = v_inv.member_id
    and (user_id is null or user_id = auth.uid());

  if not found then
    if not exists (
      select 1
      from public.team_members
      where id = v_inv.member_id
        and user_id = auth.uid()
    ) then
      raise exception 'invitation_member_missing';
    end if;
  end if;

  update public.team_invitations
  set
    status = 'accepted',
    responded_at = now(),
    invited_user_id = auth.uid()
  where id = p_invitation_id;

  update public.app_notifications
  set read_at = coalesce(read_at, now())
  where invitation_id = p_invitation_id;
end;
$$;

create or replace function public.reject_team_invitation(p_invitation_id text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_inv public.team_invitations%rowtype;
  v_user_email text;
  v_team_name text;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  select * into v_inv
  from public.team_invitations
  where id = p_invitation_id
    and status = 'pending';

  if not found then
    raise exception 'invitation_not_found';
  end if;

  select email into v_user_email
  from public.users
  where id = auth.uid();

  if v_inv.invited_user_id is not null and v_inv.invited_user_id <> auth.uid() then
    raise exception 'invitation_forbidden';
  end if;

  if v_inv.invited_user_id is null
    and lower(v_inv.email) <> lower(coalesce(v_user_email, '')) then
    raise exception 'invitation_forbidden';
  end if;

  select name into v_team_name
  from public.teams
  where id = v_inv.team_id;

  insert into public.app_notifications (
    id,
    team_id,
    kind,
    actor_id,
    recipient_id,
    target_user_id,
    invitation_id,
    task_title,
    href,
    created_at,
    read_at
  )
  values (
    'notif-' || replace(gen_random_uuid()::text, '-', ''),
    v_inv.team_id,
    'team_invite_rejected',
    null,
    v_inv.invited_by_member_id,
    auth.uid(),
    p_invitation_id,
    coalesce(v_team_name, ''),
    v_inv.email,
    now(),
    null
  );

  delete from public.app_notifications
  where invitation_id = p_invitation_id
    and kind = 'team_invite';

  update public.team_invitations
  set
    status = 'rejected',
    responded_at = now(),
    invited_user_id = coalesce(invited_user_id, auth.uid())
  where id = p_invitation_id;

  delete from public.team_members
  where id = v_inv.member_id
    and user_id is null;
end;
$$;

create or replace function public.accept_team_invitation_by_token(p_token text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_invitation_id text;
begin
  select id into v_invitation_id
  from public.team_invitations
  where token = p_token
    and status = 'pending';

  if not found then
    raise exception 'invitation_not_found';
  end if;

  perform public.accept_team_invitation(v_invitation_id);
  return v_invitation_id;
end;
$$;

create or replace function public.preview_team_invitation(p_token text)
returns table (
  invitation_id text,
  team_name text,
  inviter_name text,
  email text
)
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select
    i.id,
    t.name,
    inv.name,
    case
      when position('@' in i.email) > 1 then
        left(i.email, 1) || '***@' || split_part(i.email, '@', 2)
      else '***'
    end
  from public.team_invitations as i
  join public.teams as t on t.id = i.team_id
  join public.team_members as inv on inv.id = i.invited_by_member_id
  where i.token = p_token
    and i.status = 'pending';
$$;

create or replace function public.link_team_member_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.team_members as tm
  set
    user_id = new.id,
    name = case
      when btrim(tm.name) = '' then new.name
      else tm.name
    end,
    avatar_url = coalesce(tm.avatar_url, nullif(new.avatar, ''))
  where tm.user_id is null
    and tm.email <> ''
    and lower(tm.email) = lower(new.email)
    and not exists (
      select 1
      from public.team_invitations as i
      where i.member_id = tm.id
        and i.status = 'pending'
    );

  return new;
end;
$$;

revoke select on table public.team_invitations from authenticated;
grant select (
  id,
  team_id,
  member_id,
  invited_by_member_id,
  invited_user_id,
  email,
  status,
  created_at,
  responded_at
) on table public.team_invitations to authenticated;
grant insert, update, delete on table public.team_invitations to authenticated;

alter table public.user_calendar_integrations
  add column if not exists feed_token_hash text;

alter table public.user_calendar_integrations
  drop constraint if exists user_calendar_integrations_feed_token_check;

alter table public.user_calendar_integrations
  add constraint user_calendar_integrations_feed_token_check check (
    feed_token ~ '^[a-f0-9]{64}$'
    or feed_token like 'enc:v1:%'
  );

update public.user_calendar_integrations
set feed_token_hash = encode(digest(convert_to(feed_token, 'UTF8'), 'sha256'), 'hex')
where feed_token_hash is null
  and feed_token is not null
  and feed_token <> '';

update public.user_calendar_integrations
set feed_token_hash = encode(digest(convert_to(user_id::text, 'UTF8'), 'sha256'), 'hex')
where feed_token_hash is null;

alter table public.user_calendar_integrations
  alter column feed_token_hash set not null;

create unique index if not exists user_calendar_integrations_feed_token_hash_uidx
  on public.user_calendar_integrations (feed_token_hash);

alter table public.task_files
  add column if not exists has_content boolean not null default false;

alter table public.list_files
  add column if not exists has_content boolean not null default false;

update public.task_files
set has_content = true
where content is not null and length(btrim(content)) > 0 and has_content = false;

update public.list_files
set has_content = true
where content is not null and length(btrim(content)) > 0 and has_content = false;

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users (id) on delete set null,
  action text not null,
  target text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_created_at_idx
  on public.admin_audit_events (created_at desc);

alter table public.admin_audit_events enable row level security;

revoke all on table public.admin_audit_events from anon, authenticated;
grant select on table public.admin_audit_events to authenticated;

drop policy if exists admin_audit_events_deny_anon on public.admin_audit_events;
create policy admin_audit_events_deny_anon
  on public.admin_audit_events for all to anon
  using (false)
  with check (false);

drop policy if exists admin_audit_events_select_admin on public.admin_audit_events;
create policy admin_audit_events_select_admin
  on public.admin_audit_events for select to authenticated
  using (public.current_user_is_admin());
