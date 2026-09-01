-- Global user announcements (system admin). Shown as a dismissible banner
-- until expires_at (inclusive) while is_enabled is true.

create table if not exists public.site_announcements (
  id uuid primary key default gen_random_uuid(),
  title_values jsonb not null default '{}'::jsonb,
  body_values jsonb not null default '{}'::jsonb,
  expires_at date not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_announcements_active_idx
  on public.site_announcements (is_enabled, expires_at)
  where is_enabled = true;

drop trigger if exists site_announcements_set_updated_at on public.site_announcements;
create trigger site_announcements_set_updated_at
  before update on public.site_announcements
  for each row execute function public.set_updated_at();

alter table public.site_announcements enable row level security;

revoke all on table public.site_announcements from anon, authenticated;
grant select on table public.site_announcements to authenticated;
grant insert, update, delete on table public.site_announcements to authenticated;

drop policy if exists site_announcements_deny_anon on public.site_announcements;
create policy site_announcements_deny_anon
  on public.site_announcements for all to anon
  using (false)
  with check (false);

drop policy if exists site_announcements_select on public.site_announcements;
create policy site_announcements_select
  on public.site_announcements for select to authenticated
  using (true);

drop policy if exists site_announcements_admin_all on public.site_announcements;
create policy site_announcements_admin_all
  on public.site_announcements for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());
