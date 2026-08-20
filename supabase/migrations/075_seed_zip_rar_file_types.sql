-- Allow zip / rar archives in list tree and subtask attachments (incl. Gmail extension).

insert into public.file_type_extensions (extension, mime_type, icon, color, sort_order) values
  ('zip', 'application/zip',     'fas fa-file-zipper', '#a855f7', 13),
  ('rar', 'application/vnd.rar', 'fas fa-file-zipper', '#9333ea', 14)
on conflict (extension) do update set
  mime_type = excluded.mime_type,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order;
