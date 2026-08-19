-- Seed private-list frontend module (enabled so current behaviour stays).
-- When the module is turned off, all private lists become public.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_private_list', true, 5)
on conflict (module_key) do nothing;

create or replace function public.publish_all_private_work_lists()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Not allowed';
  end if;

  update public.work_lists
  set is_private = false
  where is_private = true;
end;
$$;

revoke all on function public.publish_all_private_work_lists() from public, anon;
grant execute on function public.publish_all_private_work_lists() to authenticated;
