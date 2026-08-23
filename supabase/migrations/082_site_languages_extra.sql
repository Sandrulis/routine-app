-- Additional UI languages. Catalogs live in app/lib/i18n/messages-*.ts;
-- site_translations remains overlay only.

insert into public.site_languages (code, name, is_active, is_default, sort_order)
values
  ('de', 'Deutsch', true, false, 40),
  ('fr', 'Français', true, false, 50),
  ('es', 'Español', true, false, 60),
  ('nl', 'Nederlands', true, false, 70),
  ('da', 'Dansk', true, false, 80),
  ('no', 'Norsk', true, false, 90),
  ('fi', 'Suomi', true, false, 100),
  ('pl', 'Polski', true, false, 110),
  ('lt', 'Lietuvių', true, false, 120),
  ('et', 'Eesti', true, false, 130)
on conflict (code) do update
set
  name = excluded.name,
  is_active = true,
  sort_order = excluded.sort_order;

update public.site_settings
set slogan_values = coalesce(slogan_values, '{}'::jsonb) || jsonb_build_object(
  'de', 'Team-Aufgabenliste',
  'fr', 'Liste de tâches d''équipe',
  'es', 'Lista de tareas del equipo',
  'nl', 'Team-takenlijst',
  'da', 'Teamopgaveliste',
  'no', 'Teamoppgaveliste',
  'fi', 'Tiimin tehtävälista',
  'pl', 'Lista zadań zespołu',
  'lt', 'Komandos darbų sąrašas',
  'et', 'Meeskonna ülesannete nimekiri'
)
where id = 1;

update public.task_statuses
set labels = labels || case id
  when 'todo' then '{
    "de":"Offen","fr":"À faire","es":"Por hacer","nl":"Te doen",
    "da":"Opgave","no":"Gjøremål","fi":"Tekemättä","pl":"Do zrobienia",
    "lt":"Atliktina","et":"Tegemata"
  }'::jsonb
  when 'in_progress' then '{
    "de":"In Bearbeitung","fr":"En cours","es":"En curso","nl":"Bezig",
    "da":"I gang","no":"Pågår","fi":"Käynnissä","pl":"W toku",
    "lt":"Vykdoma","et":"Töös"
  }'::jsonb
  when 'done' then '{
    "de":"Fertig","fr":"Terminé","es":"Hecho","nl":"Klaar",
    "da":"Færdig","no":"Ferdig","fi":"Valmis","pl":"Gotowe",
    "lt":"Atlikta","et":"Valmis"
  }'::jsonb
  else '{}'::jsonb
end
where id in ('todo', 'in_progress', 'done');
