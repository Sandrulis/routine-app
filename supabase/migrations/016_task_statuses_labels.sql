-- Statusu nosaukumi pa valodām (lv, en, ru u.c.)
alter table public.task_statuses
  add column if not exists labels jsonb not null default '{}'::jsonb;

-- Aizpilda no esošā label un noklusējuma tulkojumiem
update public.task_statuses
set labels = case id
  when 'todo' then '{"lv":"Darāms","en":"To do","ru":"К выполнению"}'::jsonb
  when 'in_progress' then '{"lv":"Procesā","en":"In progress","ru":"В работе"}'::jsonb
  when 'done' then '{"lv":"Gatavs","en":"Done","ru":"Готово"}'::jsonb
  else jsonb_build_object('lv', label)
end
where labels = '{}'::jsonb or labels is null;
