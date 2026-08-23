-- Enable Gmail plugin module if a stub row was created before 078
-- (on conflict do nothing left is_enabled false / sort_order 100).

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_gmail_plugin', true, 19)
on conflict (module_key) do update
set
  is_enabled = true,
  sort_order = excluded.sort_order;
