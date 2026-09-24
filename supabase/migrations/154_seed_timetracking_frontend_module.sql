-- Checklist time tracking. Visible only while this module is enabled.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_timetracking', true, 19)
on conflict (module_key) do nothing;

insert into public.site_payment_plan_modules (plan_id, module_key)
select p.id, 'module_timetracking'
from public.site_payment_plans p
on conflict (plan_id, module_key) do nothing;
