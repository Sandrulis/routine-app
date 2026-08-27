-- Images attached to documentation articles. Content is a data URL;
-- public pages load bytes via /api/docs/images/:id (service role).

create table if not exists public.site_docs_article_images (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.site_docs_articles(id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  byte_size integer not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint site_docs_article_images_file_name_check check (
    length(btrim(file_name)) between 1 and 200
  ),
  constraint site_docs_article_images_mime_check check (
    mime_type in ('image/png', 'image/jpeg', 'image/gif', 'image/webp')
  ),
  constraint site_docs_article_images_byte_size_check check (
    byte_size between 1 and 1500000
  ),
  constraint site_docs_article_images_content_check check (
    content like 'data:image/%'
    and length(content) between 24 and 2100000
  )
);

create index if not exists site_docs_article_images_article_idx
  on public.site_docs_article_images (article_id, created_at);

alter table public.site_docs_article_images enable row level security;

revoke all on table public.site_docs_article_images from anon, authenticated;

grant select, insert, update, delete on table public.site_docs_article_images to authenticated;

drop policy if exists site_docs_article_images_admin_all on public.site_docs_article_images;
create policy site_docs_article_images_admin_all
  on public.site_docs_article_images
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());
