-- Legal contact email shown in the privacy policy (controller contact).

alter table public.site_settings
  add column if not exists legal_email text not null default '';
