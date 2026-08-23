-- Italian and Swedish UI languages. Catalogs live in app/lib/i18n/messages-*.ts;
-- site_translations remains overlay only.

insert into public.site_languages (code, name, is_active, is_default, sort_order)
values
  ('it', 'Italiano', true, false, 140),
  ('sv', 'Svenska', true, false, 150)
on conflict (code) do update
set
  name = excluded.name,
  is_active = true,
  sort_order = excluded.sort_order;

update public.site_settings
set slogan_values = coalesce(slogan_values, '{}'::jsonb) || jsonb_build_object(
  'it', 'Elenco attività del team',
  'sv', 'Teamets att-göra-lista'
)
where id = 1;

update public.task_statuses
set labels = labels || case id
  when 'todo' then '{"it":"Da fare","sv":"Att göra"}'::jsonb
  when 'in_progress' then '{"it":"In corso","sv":"Pågår"}'::jsonb
  when 'done' then '{"it":"Fatto","sv":"Klar"}'::jsonb
  else '{}'::jsonb
end
where id in ('todo', 'in_progress', 'done');
