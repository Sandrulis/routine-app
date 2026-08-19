-- Seed file-upload frontend module (enabled so current behaviour stays).

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_file_upload', true, 15)
on conflict (module_key) do nothing;
