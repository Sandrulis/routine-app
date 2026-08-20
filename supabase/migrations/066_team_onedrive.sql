-- OneDrive team integration + frontend module.
-- Tokens are not granted to authenticated/anon; app uses service role.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_onedrive', false, 17)
on conflict (module_key) do nothing;

create table if not exists public.team_onedrive_integrations (
  team_id text primary key references public.teams (id) on delete cascade,
  is_connected boolean not null default false,
  is_enabled boolean not null default false,
  folder_path text not null default 'Routine',
  account_email text not null default '',
  refresh_token text,
  access_token text,
  access_token_expires_at timestamptz,
  connected_by uuid references public.users (id) on delete set null,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists team_onedrive_integrations_set_updated_at
  on public.team_onedrive_integrations;
create trigger team_onedrive_integrations_set_updated_at
  before update on public.team_onedrive_integrations
  for each row execute function public.set_updated_at();

alter table public.team_onedrive_integrations enable row level security;

revoke all on table public.team_onedrive_integrations from anon, authenticated;

drop policy if exists team_onedrive_integrations_deny_anon
  on public.team_onedrive_integrations;
create policy team_onedrive_integrations_deny_anon
  on public.team_onedrive_integrations for all to anon
  using (false)
  with check (false);

drop policy if exists team_onedrive_integrations_deny_authenticated
  on public.team_onedrive_integrations;
create policy team_onedrive_integrations_deny_authenticated
  on public.team_onedrive_integrations for all to authenticated
  using (false)
  with check (false);
