-- Optional slogan (subtitle) for documentation articles.

alter table public.site_docs_article_translations
  add column if not exists slogan text not null default '';

alter table public.site_docs_article_translations
  drop constraint if exists site_docs_article_translations_slogan_check;

alter table public.site_docs_article_translations
  add constraint site_docs_article_translations_slogan_check check (
    length(slogan) <= 300
  );
