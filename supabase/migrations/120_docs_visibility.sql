-- Visibility for public documentation categories and articles.

alter table public.site_docs_categories
  add column if not exists is_visible boolean not null default true;

alter table public.site_docs_articles
  add column if not exists is_visible boolean not null default true;
