-- Gmail Chrome plugin frontend module + per-user Gmail OAuth tokens.
-- Tokens are not granted to authenticated/anon; app uses service role.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_gmail_plugin', true, 19)
on conflict (module_key) do update
set
  is_enabled = excluded.is_enabled,
  sort_order = excluded.sort_order;

create table if not exists public.user_gmail_connections (
  user_id uuid primary key references public.users (id) on delete cascade,
  google_email text not null default '',
  refresh_token text,
  access_token text,
  access_token_expires_at timestamptz,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_gmail_connections_set_updated_at
  on public.user_gmail_connections;
create trigger user_gmail_connections_set_updated_at
  before update on public.user_gmail_connections
  for each row execute function public.set_updated_at();

alter table public.user_gmail_connections enable row level security;

revoke all on table public.user_gmail_connections from anon, authenticated;

drop policy if exists user_gmail_connections_deny_anon
  on public.user_gmail_connections;
create policy user_gmail_connections_deny_anon
  on public.user_gmail_connections for all to anon
  using (false)
  with check (false);

drop policy if exists user_gmail_connections_deny_authenticated
  on public.user_gmail_connections;
create policy user_gmail_connections_deny_authenticated
  on public.user_gmail_connections for all to authenticated
  using (false)
  with check (false);
