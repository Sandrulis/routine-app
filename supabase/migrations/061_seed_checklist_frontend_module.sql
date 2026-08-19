-- Seed checklist frontend module (enabled so current behaviour stays).

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_checklist', true, 18)
on conflict (module_key) do nothing;
