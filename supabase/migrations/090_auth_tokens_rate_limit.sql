-- Durable rate limits, auth lockout, hashed invite/cron tokens.

create extension if not exists pgcrypto;
set search_path = public, extensions, pg_catalog;

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  hit_count integer not null default 1,
  reset_at timestamptz not null
);

create table if not exists public.auth_lockouts (
  email_hash text primary key,
  failure_count integer not null default 0,
  locked_until timestamptz
);

alter table public.rate_limit_buckets enable row level security;
alter table public.auth_lockouts enable row level security;

revoke all on table public.rate_limit_buckets from anon, authenticated;
revoke all on table public.auth_lockouts from anon, authenticated;

drop policy if exists rate_limit_buckets_deny_anon on public.rate_limit_buckets;
create policy rate_limit_buckets_deny_anon
  on public.rate_limit_buckets for all to anon
  using (false) with check (false);

drop policy if exists rate_limit_buckets_deny_authenticated on public.rate_limit_buckets;
create policy rate_limit_buckets_deny_authenticated
  on public.rate_limit_buckets for all to authenticated
  using (false) with check (false);

drop policy if exists auth_lockouts_deny_anon on public.auth_lockouts;
create policy auth_lockouts_deny_anon
  on public.auth_lockouts for all to anon
  using (false) with check (false);

drop policy if exists auth_lockouts_deny_authenticated on public.auth_lockouts;
create policy auth_lockouts_deny_authenticated
  on public.auth_lockouts for all to authenticated
  using (false) with check (false);

alter table public.team_invitations
  add column if not exists token_hash text;

update public.team_invitations
set token_hash = encode(extensions.digest(convert_to(token, 'UTF8'), 'sha256'::text), 'hex')
where token_hash is null
  and token is not null
  and token <> ''
  and token not like 'enc:v1:%';

create unique index if not exists team_invitations_token_hash_uidx
  on public.team_invitations (token_hash)
  where token_hash is not null;

alter table public.site_cron_jobs
  add column if not exists secret_token_hash text;

update public.site_cron_jobs
set secret_token_hash = encode(extensions.digest(convert_to(secret_token, 'UTF8'), 'sha256'::text), 'hex')
where secret_token_hash is null
  and secret_token is not null
  and secret_token <> ''
  and secret_token not like 'enc:v1:%';

create unique index if not exists site_cron_jobs_secret_token_hash_uidx
  on public.site_cron_jobs (secret_token_hash)
  where secret_token_hash is not null;

create or replace function public.accept_team_invitation_by_token(p_token text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_invitation_id text;
  v_hash text;
begin
  v_hash := encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'::text), 'hex');

  select id into v_invitation_id
  from public.team_invitations
  where status = 'pending'
    and (
      token_hash = v_hash
      or (token_hash is null and token = p_token)
    );

  if not found then
    raise exception 'invitation_not_found';
  end if;

  perform public.accept_team_invitation(v_invitation_id);
  return v_invitation_id;
end;
$$;

drop function if exists public.preview_team_invitation(text);

create function public.preview_team_invitation(p_token text)
returns table (
  invitation_id text,
  team_name text,
  inviter_name text,
  email text,
  account_exists boolean
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
    )
  from public.team_invitations as i
  join public.teams as t on t.id = i.team_id
  join public.team_members as inv on inv.id = i.invited_by_member_id
  where i.status = 'pending'
    and (
      i.token_hash = encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'::text), 'hex')
      or (i.token_hash is null and i.token = p_token)
    );
$$;

revoke all on function public.preview_team_invitation(text) from public;
grant execute on function public.preview_team_invitation(text) to anon, authenticated;
revoke all on function public.accept_team_invitation_by_token(text) from public, anon;
grant execute on function public.accept_team_invitation_by_token(text) to authenticated;
