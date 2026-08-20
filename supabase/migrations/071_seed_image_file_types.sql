-- Allow common image uploads (png, jpg/jpeg, gif, webp) in list tree and subtasks.

insert into public.file_type_extensions (extension, mime_type, icon, color, sort_order) values
  ('png',  'image/png',  'fas fa-file-image', '#0ea5e8', 6),
  ('jpg',  'image/jpeg', 'fas fa-file-image', '#0ea5e8', 7),
  ('jpeg', 'image/jpeg', 'fas fa-file-image', '#0ea5e8', 8),
  ('gif',  'image/gif',  'fas fa-file-image', '#0ea5e8', 9),
  ('webp', 'image/webp', 'fas fa-file-image', '#0ea5e8', 10)
on conflict (extension) do update set
  mime_type = excluded.mime_type,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order;
