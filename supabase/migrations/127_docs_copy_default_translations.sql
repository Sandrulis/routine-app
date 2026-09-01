-- Copy default-language docs text into every other site language.
-- Existing translations are kept; images stay shared on the article.

insert into public.site_docs_category_translations (category_id, language_code, title)
select
  source.category_id,
  languages.code,
  source.title
from public.site_docs_category_translations source
join public.site_languages default_language
  on default_language.is_default = true
 and default_language.code = source.language_code
join public.site_languages languages
  on languages.code <> source.language_code
on conflict (category_id, language_code) do nothing;

insert into public.site_docs_article_translations (
  article_id,
  language_code,
  title,
  slogan,
  content
)
select
  source.article_id,
  languages.code,
  source.title,
  source.slogan,
  source.content
from public.site_docs_article_translations source
join public.site_languages default_language
  on default_language.is_default = true
 and default_language.code = source.language_code
join public.site_languages languages
  on languages.code <> source.language_code
on conflict (article_id, language_code) do nothing;
