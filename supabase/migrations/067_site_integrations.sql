-- System-level OAuth integrations (admin-configured).

create table if not exists public.site_integrations (
  integration_key text primary key,
  client_id text not null default '',
  client_secret text not null default '',
  is_configured boolean not null default false,
  is_enabled boolean not null default false,
  configured_account_email text not null default '',
  configured_by uuid references public.users (id) on delete set null,
  configured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_integrations_key_check check (integration_key ~ '^[a-z0-9_]+$')
);

drop trigger if exists site_integrations_set_updated_at on public.site_integrations;
create trigger site_integrations_set_updated_at
  before update on public.site_integrations
  for each row execute function public.set_updated_at();

alter table public.site_integrations enable row level security;

revoke all on table public.site_integrations from anon, authenticated;

drop policy if exists site_integrations_deny_anon on public.site_integrations;
create policy site_integrations_deny_anon
  on public.site_integrations for all to anon
  using (false)
  with check (false);

drop policy if exists site_integrations_deny_authenticated on public.site_integrations;
create policy site_integrations_deny_authenticated
  on public.site_integrations for all to authenticated
  using (false)
  with check (false);

insert into public.site_integrations (integration_key)
values ('google_oauth')
on conflict (integration_key) do nothing;
