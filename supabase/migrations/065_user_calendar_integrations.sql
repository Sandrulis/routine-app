-- Per-user calendar feed (Apple / Google subscribe via secret .ics URL).
-- ICS pollers are unauthenticated; the route uses the service role.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_calendar', true, 22),
  ('module_calendar_apple', true, 23),
  ('module_calendar_google', true, 24)
on conflict (module_key) do nothing;

create table if not exists public.user_calendar_integrations (
  user_id uuid primary key references public.users (id) on delete cascade,
  is_enabled boolean not null default false,
  provider text check (provider is null or provider in ('apple', 'google')),
  feed_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_calendar_integrations_feed_token_unique unique (feed_token),
  constraint user_calendar_integrations_feed_token_check check (
    feed_token ~ '^[a-f0-9]{64}$'
  )
);

create index if not exists user_calendar_integrations_feed_token_idx
  on public.user_calendar_integrations (feed_token);

drop trigger if exists user_calendar_integrations_set_updated_at
  on public.user_calendar_integrations;
create trigger user_calendar_integrations_set_updated_at
  before update on public.user_calendar_integrations
  for each row execute function public.set_updated_at();

alter table public.user_calendar_integrations enable row level security;

revoke all on table public.user_calendar_integrations from anon, authenticated;
grant select, insert, update on table public.user_calendar_integrations to authenticated;

drop policy if exists user_calendar_integrations_deny_anon
  on public.user_calendar_integrations;
create policy user_calendar_integrations_deny_anon
  on public.user_calendar_integrations for all to anon
  using (false)
  with check (false);

drop policy if exists user_calendar_integrations_select_own
  on public.user_calendar_integrations;
create policy user_calendar_integrations_select_own
  on public.user_calendar_integrations for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_calendar_integrations_insert_own
  on public.user_calendar_integrations;
create policy user_calendar_integrations_insert_own
  on public.user_calendar_integrations for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_calendar_integrations_update_own
  on public.user_calendar_integrations;
create policy user_calendar_integrations_update_own
  on public.user_calendar_integrations for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
