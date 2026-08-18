-- Add Russian as a system language. Translation catalog stays in app/lib/i18n
-- (messages.ts / messages-ru.ts); site_translations is overlay only.

insert into public.site_languages (code, name, is_active, is_default, sort_order)
values ('ru', 'Русский', true, false, 30)
on conflict (code) do update
set
  name = excluded.name,
  is_active = true,
  sort_order = excluded.sort_order;

update public.site_settings
set slogan_values = coalesce(slogan_values, '{}'::jsonb) || jsonb_build_object(
  'ru', 'Командный список задач'
)
where id = 1
  and coalesce(slogan_values->>'ru', '') = '';
