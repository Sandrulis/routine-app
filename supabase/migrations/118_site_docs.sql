-- Public documentation: categories, articles, default-language content,
-- and a site-wide enable flag for the footer link.

alter table public.site_settings
  add column if not exists docs_enabled boolean not null default false;

create table if not exists public.site_docs_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  icon text not null default 'fas fa-book',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_docs_categories_slug_unique unique (slug),
  constraint site_docs_categories_slug_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and length(slug) between 1 and 80
  ),
  constraint site_docs_categories_icon_check check (
    icon ~ '^fa[sbrld]?[[:space:]]+fa-[a-z0-9-]+$'
    and length(icon) between 6 and 64
  )
);

create table if not exists public.site_docs_category_translations (
  category_id uuid not null references public.site_docs_categories(id) on delete cascade,
  language_code text not null references public.site_languages(code) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_docs_category_translations_pk primary key (category_id, language_code),
  constraint site_docs_category_translations_title_check check (
    length(btrim(title)) between 1 and 200
  )
);

create table if not exists public.site_docs_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.site_docs_categories(id) on delete cascade,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_docs_articles_slug_unique unique (category_id, slug),
  constraint site_docs_articles_slug_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and length(slug) between 1 and 80
  )
);

create index if not exists site_docs_articles_category_sort_idx
  on public.site_docs_articles (category_id, sort_order, slug);

create table if not exists public.site_docs_article_translations (
  article_id uuid not null references public.site_docs_articles(id) on delete cascade,
  language_code text not null references public.site_languages(code) on delete cascade,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_docs_article_translations_pk primary key (article_id, language_code),
  constraint site_docs_article_translations_title_check check (
    length(btrim(title)) between 1 and 200
  ),
  constraint site_docs_article_translations_content_check check (
    length(content) <= 200000
  )
);

drop trigger if exists site_docs_categories_set_updated_at on public.site_docs_categories;
create trigger site_docs_categories_set_updated_at
  before update on public.site_docs_categories
  for each row execute function public.set_updated_at();

drop trigger if exists site_docs_category_translations_set_updated_at
  on public.site_docs_category_translations;
create trigger site_docs_category_translations_set_updated_at
  before update on public.site_docs_category_translations
  for each row execute function public.set_updated_at();

drop trigger if exists site_docs_articles_set_updated_at on public.site_docs_articles;
create trigger site_docs_articles_set_updated_at
  before update on public.site_docs_articles
  for each row execute function public.set_updated_at();

drop trigger if exists site_docs_article_translations_set_updated_at
  on public.site_docs_article_translations;
create trigger site_docs_article_translations_set_updated_at
  before update on public.site_docs_article_translations
  for each row execute function public.set_updated_at();

alter table public.site_docs_categories enable row level security;
alter table public.site_docs_category_translations enable row level security;
alter table public.site_docs_articles enable row level security;
alter table public.site_docs_article_translations enable row level security;

revoke all on table public.site_docs_categories from anon, authenticated;
revoke all on table public.site_docs_category_translations from anon, authenticated;
revoke all on table public.site_docs_articles from anon, authenticated;
revoke all on table public.site_docs_article_translations from anon, authenticated;

grant select on table public.site_docs_categories to anon, authenticated;
grant select on table public.site_docs_category_translations to anon, authenticated;
grant select on table public.site_docs_articles to anon, authenticated;
grant select on table public.site_docs_article_translations to anon, authenticated;
grant insert, update, delete on table public.site_docs_categories to authenticated;
grant insert, update, delete on table public.site_docs_category_translations to authenticated;
grant insert, update, delete on table public.site_docs_articles to authenticated;
grant insert, update, delete on table public.site_docs_article_translations to authenticated;

drop policy if exists site_docs_categories_select on public.site_docs_categories;
create policy site_docs_categories_select
  on public.site_docs_categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists site_docs_categories_admin_write on public.site_docs_categories;
create policy site_docs_categories_admin_write
  on public.site_docs_categories
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists site_docs_category_translations_select
  on public.site_docs_category_translations;
create policy site_docs_category_translations_select
  on public.site_docs_category_translations
  for select
  to anon, authenticated
  using (true);

drop policy if exists site_docs_category_translations_admin_write
  on public.site_docs_category_translations;
create policy site_docs_category_translations_admin_write
  on public.site_docs_category_translations
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists site_docs_articles_select on public.site_docs_articles;
create policy site_docs_articles_select
  on public.site_docs_articles
  for select
  to anon, authenticated
  using (true);

drop policy if exists site_docs_articles_admin_write on public.site_docs_articles;
create policy site_docs_articles_admin_write
  on public.site_docs_articles
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists site_docs_article_translations_select
  on public.site_docs_article_translations;
create policy site_docs_article_translations_select
  on public.site_docs_article_translations
  for select
  to anon, authenticated
  using (true);

drop policy if exists site_docs_article_translations_admin_write
  on public.site_docs_article_translations;
create policy site_docs_article_translations_admin_write
  on public.site_docs_article_translations
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());
