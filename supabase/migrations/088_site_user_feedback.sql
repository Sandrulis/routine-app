-- User bug reports, feedback and public feature requests with upvotes.
-- Authenticated users submit; feature requests are visible to everyone signed in.

create table if not exists public.site_user_feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  body text not null default '',
  user_id uuid not null references public.users (id) on delete cascade,
  vote_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint site_user_feedback_kind_check check (kind in ('bug', 'feature', 'feedback')),
  constraint site_user_feedback_title_len check (
    char_length(btrim(title)) between 1 and 200
  ),
  constraint site_user_feedback_body_len check (char_length(body) between 0 and 4000),
  constraint site_user_feedback_vote_count_check check (vote_count >= 0)
);

create index if not exists site_user_feedback_kind_votes_idx
  on public.site_user_feedback (kind, vote_count desc, created_at desc);

create index if not exists site_user_feedback_user_id_idx
  on public.site_user_feedback (user_id, created_at desc);

create table if not exists public.site_feature_votes (
  request_id uuid not null references public.site_user_feedback (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create index if not exists site_feature_votes_user_id_idx
  on public.site_feature_votes (user_id);

create or replace function public.site_feature_votes_guard()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1
    from public.site_user_feedback as f
    where f.id = new.request_id
      and f.kind = 'feature'
  ) then
    raise exception 'not_a_feature';
  end if;
  return new;
end;
$$;

drop trigger if exists site_feature_votes_guard on public.site_feature_votes;
create trigger site_feature_votes_guard
  before insert on public.site_feature_votes
  for each row execute function public.site_feature_votes_guard();

create or replace function public.sync_feature_vote_count()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
begin
  v_id := coalesce(new.request_id, old.request_id);
  update public.site_user_feedback
  set vote_count = (
    select count(*)::integer
    from public.site_feature_votes
    where request_id = v_id
  )
  where id = v_id;
  return null;
end;
$$;

drop trigger if exists site_feature_votes_sync_count on public.site_feature_votes;
create trigger site_feature_votes_sync_count
  after insert or delete on public.site_feature_votes
  for each row execute function public.sync_feature_vote_count();

create or replace function public.toggle_feature_vote(p_request_id uuid)
returns table (vote_count integer, voted_by_me boolean)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  uid uuid := auth.uid();
  v_kind text;
  v_exists boolean;
  v_count integer;
begin
  if uid is null then
    raise exception 'auth_required';
  end if;

  select kind into v_kind
  from public.site_user_feedback
  where id = p_request_id;

  if not found or v_kind <> 'feature' then
    raise exception 'feature_not_found';
  end if;

  select exists (
    select 1
    from public.site_feature_votes
    where request_id = p_request_id
      and user_id = uid
  ) into v_exists;

  if v_exists then
    delete from public.site_feature_votes
    where request_id = p_request_id
      and user_id = uid;
  else
    insert into public.site_feature_votes (request_id, user_id)
    values (p_request_id, uid);
  end if;

  select f.vote_count into v_count
  from public.site_user_feedback as f
  where f.id = p_request_id;

  return query select coalesce(v_count, 0), not v_exists;
end;
$$;

revoke all on function public.site_feature_votes_guard() from public, anon, authenticated;
revoke all on function public.sync_feature_vote_count() from public, anon, authenticated;
revoke all on function public.toggle_feature_vote(uuid) from public, anon;
grant execute on function public.toggle_feature_vote(uuid) to authenticated;

alter table public.site_user_feedback enable row level security;
alter table public.site_feature_votes enable row level security;

revoke all on table public.site_user_feedback from anon, authenticated;
grant select, insert on table public.site_user_feedback to authenticated;

revoke all on table public.site_feature_votes from anon, authenticated;
grant select, insert, delete on table public.site_feature_votes to authenticated;

drop policy if exists site_user_feedback_deny_anon on public.site_user_feedback;
create policy site_user_feedback_deny_anon
  on public.site_user_feedback for all to anon
  using (false)
  with check (false);

drop policy if exists site_user_feedback_select on public.site_user_feedback;
create policy site_user_feedback_select
  on public.site_user_feedback for select to authenticated
  using (
    kind = 'feature'
    or user_id = auth.uid()
  );

drop policy if exists site_user_feedback_insert on public.site_user_feedback;
create policy site_user_feedback_insert
  on public.site_user_feedback for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists site_feature_votes_deny_anon on public.site_feature_votes;
create policy site_feature_votes_deny_anon
  on public.site_feature_votes for all to anon
  using (false)
  with check (false);

drop policy if exists site_feature_votes_select on public.site_feature_votes;
create policy site_feature_votes_select
  on public.site_feature_votes for select to authenticated
  using (user_id = auth.uid());

drop policy if exists site_feature_votes_insert on public.site_feature_votes;
create policy site_feature_votes_insert
  on public.site_feature_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.site_user_feedback as f
      where f.id = request_id
        and f.kind = 'feature'
    )
  );

drop policy if exists site_feature_votes_delete on public.site_feature_votes;
create policy site_feature_votes_delete
  on public.site_feature_votes for delete to authenticated
  using (user_id = auth.uid());
