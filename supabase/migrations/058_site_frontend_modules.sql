-- System admin: frontend feature modules (key + enabled flag).
-- Authenticated users can read enabled flags; only admins can write.

create table if not exists public.site_frontend_modules (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  is_enabled boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_frontend_modules_key_unique unique (module_key),
  constraint site_frontend_modules_key_check check (
    module_key ~ '^[a-z0-9._:-]+$'
    and length(module_key) between 1 and 128
  )
);

drop trigger if exists site_frontend_modules_set_updated_at on public.site_frontend_modules;
create trigger site_frontend_modules_set_updated_at
  before update on public.site_frontend_modules
  for each row execute function public.set_updated_at();

alter table public.site_frontend_modules enable row level security;

revoke all on table public.site_frontend_modules from anon, authenticated;
grant select on table public.site_frontend_modules to authenticated;
grant insert, update, delete on table public.site_frontend_modules to authenticated;

drop policy if exists site_frontend_modules_deny_anon on public.site_frontend_modules;
create policy site_frontend_modules_deny_anon
  on public.site_frontend_modules for all to anon
  using (false)
  with check (false);

drop policy if exists site_frontend_modules_select on public.site_frontend_modules;
create policy site_frontend_modules_select
  on public.site_frontend_modules for select to authenticated
  using (true);

drop policy if exists site_frontend_modules_admin_all on public.site_frontend_modules;
create policy site_frontend_modules_admin_all
  on public.site_frontend_modules for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_templates', true, 10),
  ('module_automations', true, 20)
on conflict (module_key) do nothing;
