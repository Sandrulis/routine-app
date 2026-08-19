-- Team invitations: Supabase email for new users, in-app notification for existing users.

create or replace function public.can_invite_team_members(p_team_id text)
returns boolean
language sql
stable
security definer
set search_path = public
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

revoke all on function public.can_invite_team_members(text) from public, anon;
grant execute on function public.can_invite_team_members(text) to authenticated;

create table if not exists public.team_invitations (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  member_id text not null references public.team_members (id) on delete cascade,
  invited_by_member_id text not null references public.team_members (id) on delete cascade,
  invited_user_id uuid references public.users (id) on delete set null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  token text not null unique,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists team_invitations_team_id_idx
  on public.team_invitations (team_id);

create index if not exists team_invitations_invited_user_idx
  on public.team_invitations (invited_user_id)
  where invited_user_id is not null;

create index if not exists team_invitations_pending_email_idx
  on public.team_invitations (team_id, lower(email))
  where status = 'pending';

alter table public.app_notifications
  drop constraint if exists app_notifications_kind_check;

alter table public.app_notifications
  add constraint app_notifications_kind_check
  check (kind in ('assigned', 'comment', 'due', 'file', 'team_invite'));

alter table public.app_notifications
  add column if not exists target_user_id uuid references public.users (id) on delete cascade;

alter table public.app_notifications
  add column if not exists invitation_id text references public.team_invitations (id) on delete cascade;

create index if not exists app_notifications_target_user_idx
  on public.app_notifications (target_user_id)
  where target_user_id is not null;

alter table public.team_invitations enable row level security;

revoke all on table public.team_invitations from anon, authenticated;
grant select, insert, update, delete on table public.team_invitations to authenticated;

drop policy if exists team_invitations_deny_anon on public.team_invitations;
create policy team_invitations_deny_anon
  on public.team_invitations for all to anon
  using (false) with check (false);

drop policy if exists team_invitations_select on public.team_invitations;
create policy team_invitations_select
  on public.team_invitations for select to authenticated
  using (
    invited_user_id = auth.uid()
    or public.is_team_member(team_id)
  );

drop policy if exists team_invitations_insert on public.team_invitations;
create policy team_invitations_insert
  on public.team_invitations for insert to authenticated
  with check (public.can_invite_team_members(team_id));

drop policy if exists team_invitations_update on public.team_invitations;
create policy team_invitations_update
  on public.team_invitations for update to authenticated
  using (
    (invited_user_id = auth.uid() and status = 'pending')
    or public.can_invite_team_members(team_id)
  )
  with check (
    (invited_user_id = auth.uid() and status in ('accepted', 'rejected'))
    or public.can_invite_team_members(team_id)
  );

drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert
  on public.team_members for insert to authenticated
  with check (public.can_invite_team_members(team_id));

drop policy if exists app_notifications_all on public.app_notifications;
create policy app_notifications_all
  on public.app_notifications for all to authenticated
  using (
    public.is_team_member(team_id)
    or target_user_id = auth.uid()
  )
  with check (
    public.is_team_member(team_id)
    or target_user_id = auth.uid()
  );

create or replace function public.accept_team_invitation(p_invitation_id text)
returns void
language plpgsql
security definer
set search_path = public
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
    name = coalesce(nullif(trim(name), ''), nullif(v_user_name, ''), name)
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
set search_path = public
as $$
declare
  v_inv public.team_invitations%rowtype;
  v_user_email text;
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

  update public.team_invitations
  set
    status = 'rejected',
    responded_at = now(),
    invited_user_id = coalesce(invited_user_id, auth.uid())
  where id = p_invitation_id;

  delete from public.team_members
  where id = v_inv.member_id
    and user_id is null;

  update public.app_notifications
  set read_at = coalesce(read_at, now())
  where invitation_id = p_invitation_id;
end;
$$;

create or replace function public.accept_team_invitation_by_token(p_token text)
returns text
language plpgsql
security definer
set search_path = public
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

revoke all on function public.accept_team_invitation(text) from public, anon;
revoke all on function public.reject_team_invitation(text) from public, anon;
revoke all on function public.accept_team_invitation_by_token(text) from public, anon;

grant execute on function public.accept_team_invitation(text) to authenticated;
grant execute on function public.reject_team_invitation(text) to authenticated;
grant execute on function public.accept_team_invitation_by_token(text) to authenticated;

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
set search_path = public
as $$
  select
    i.id,
    t.name,
    inv.name,
    i.email
  from public.team_invitations as i
  join public.teams as t on t.id = i.team_id
  join public.team_members as inv on inv.id = i.invited_by_member_id
  where i.token = p_token
    and i.status = 'pending';
$$;

revoke all on function public.preview_team_invitation(text) from public;
grant execute on function public.preview_team_invitation(text) to anon, authenticated;

create or replace function public.complete_pending_invitations_for_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null and (tg_op = 'INSERT' or old.user_id is null) then
    update public.team_invitations
    set
      status = 'accepted',
      responded_at = coalesce(responded_at, now()),
      invited_user_id = coalesce(invited_user_id, new.user_id)
    where member_id = new.id
      and status = 'pending';

    update public.app_notifications
    set read_at = coalesce(read_at, now())
    where invitation_id in (
      select i.id
      from public.team_invitations as i
      where i.member_id = new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists team_members_complete_invitations on public.team_members;
create trigger team_members_complete_invitations
  after insert or update of user_id on public.team_members
  for each row
  execute function public.complete_pending_invitations_for_member();
