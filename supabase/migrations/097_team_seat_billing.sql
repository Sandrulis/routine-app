-- Stripe seat billing: one subscription per team, pending_payment seats,
-- accept blocked until a paid or open seat is available.

insert into public.site_integrations (integration_key)
values ('stripe')
on conflict (integration_key) do nothing;

alter table public.teams
  add column if not exists stripe_customer_id text;

alter table public.teams
  add column if not exists stripe_subscription_id text;

alter table public.teams
  add column if not exists paid_seat_count integer not null default 0;

alter table public.teams
  add column if not exists billing_period text;

alter table public.teams
  drop constraint if exists teams_paid_seat_count_check;

alter table public.teams
  add constraint teams_paid_seat_count_check
  check (paid_seat_count >= 0);

alter table public.teams
  drop constraint if exists teams_billing_period_check;

alter table public.teams
  add constraint teams_billing_period_check
  check (
    billing_period is null
    or billing_period in ('month', 'quarter', 'year')
  );

create index if not exists teams_stripe_customer_id_idx
  on public.teams (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists teams_stripe_subscription_id_idx
  on public.teams (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.team_members
  add column if not exists seat_status text not null default 'active';

alter table public.team_members
  drop constraint if exists team_members_seat_status_check;

alter table public.team_members
  add constraint team_members_seat_status_check
  check (seat_status in ('active', 'pending_payment'));

update public.team_members
set seat_status = 'active'
where seat_status is null or btrim(seat_status) = '';

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
  v_seat_status text;
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

  select seat_status into v_seat_status
  from public.team_members
  where id = v_inv.member_id;

  if coalesce(v_seat_status, 'active') = 'pending_payment' then
    raise exception 'invitation_payment_required';
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

drop function if exists public.preview_team_invitation(text);

create function public.preview_team_invitation(p_token text)
returns table (
  invitation_id text,
  team_name text,
  inviter_name text,
  email text,
  account_exists boolean,
  awaiting_payment boolean
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
    end,
    (
      i.invited_user_id is not null
      or exists (
        select 1
        from public.users as u
        where lower(u.email) = lower(i.email)
      )
    ),
    coalesce(m.seat_status, 'active') = 'pending_payment'
  from public.team_invitations as i
  join public.teams as t on t.id = i.team_id
  join public.team_members as inv on inv.id = i.invited_by_member_id
  join public.team_members as m on m.id = i.member_id
  where i.status = 'pending'
    and (
      i.token_hash = encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'::text), 'hex')
      or (i.token_hash is null and i.token = p_token)
    );
$$;

revoke all on function public.preview_team_invitation(text) from public;
grant execute on function public.preview_team_invitation(text) to anon, authenticated;
