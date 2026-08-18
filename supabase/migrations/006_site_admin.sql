-- System admin content: languages, translations, settings.
-- Access is server-side via service role (createAdminClient). Clients are denied.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.site_languages (
  code text primary key,
  name text not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_languages_code_check check (code ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

create unique index if not exists site_languages_single_default_idx
  on public.site_languages (is_default)
  where is_default = true;

drop trigger if exists site_languages_set_updated_at on public.site_languages;
create trigger site_languages_set_updated_at
  before update on public.site_languages
  for each row execute function public.set_updated_at();

alter table public.site_languages enable row level security;

drop policy if exists "site_languages deny client access" on public.site_languages;
create policy "site_languages deny client access"
  on public.site_languages
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

insert into public.site_languages (code, name, is_active, is_default, sort_order)
values
  ('lv', 'Latviešu', true, true, 10),
  ('en', 'English', true, false, 20)
on conflict (code) do update
set
  name = excluded.name,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

create table if not exists public.site_translations (
  translation_key text primary key,
  namespace text not null default '',
  description text not null default '',
  values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_translations_key_check
    check (translation_key ~ '^[a-zA-Z0-9_.:-]+$')
);

create index if not exists site_translations_namespace_idx
  on public.site_translations (namespace);

drop trigger if exists site_translations_set_updated_at on public.site_translations;
create trigger site_translations_set_updated_at
  before update on public.site_translations
  for each row execute function public.set_updated_at();

alter table public.site_translations enable row level security;

drop policy if exists "site_translations deny client access" on public.site_translations;
create policy "site_translations deny client access"
  on public.site_translations
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  system_name text not null default 'Routine',
  slogan text not null default 'Komandas darāmo darbu saraksts',
  slogan_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "site_settings deny client access" on public.site_settings;
create policy "site_settings deny client access"
  on public.site_settings
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

insert into public.site_settings (id, system_name, slogan, slogan_values)
values (
  1,
  'Routine',
  'Komandas darāmo darbu saraksts',
  jsonb_build_object(
    'lv', 'Komandas darāmo darbu saraksts',
    'en', 'Team to-do list'
  )
)
on conflict (id) do nothing;
