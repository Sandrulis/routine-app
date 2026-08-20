-- Text / HTML for Gmail extension email capture and common notes.

insert into public.file_type_extensions (extension, mime_type, icon, color, sort_order) values
  ('txt',  'text/plain', 'fas fa-file-lines', '#64748b', 11),
  ('html', 'text/html',  'fas fa-file-code',  '#ea580c', 12)
on conflict (extension) do update set
  mime_type = excluded.mime_type,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order;
