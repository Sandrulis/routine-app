-- Seed file-forward frontend module. Existing admin rows keep is_enabled.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_send_file', true, 16)
on conflict (module_key) do nothing;
