-- Allowed file extensions for list tree and subtask uploads.
-- System admins manage extension, MIME type, icon and color.

create table if not exists public.file_type_extensions (
  extension text primary key,
  mime_type text not null,
  icon text not null default 'fas fa-file',
  color text not null default '#71717a',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint file_type_extensions_extension_check check (extension ~ '^[a-z0-9]+$')
);

alter table public.file_type_extensions enable row level security;

revoke all on table public.file_type_extensions from anon, authenticated;
grant select on table public.file_type_extensions to authenticated;

drop policy if exists file_type_extensions_deny_anon on public.file_type_extensions;
create policy file_type_extensions_deny_anon
  on public.file_type_extensions for all to anon using (false) with check (false);

drop policy if exists file_type_extensions_select on public.file_type_extensions;
create policy file_type_extensions_select
  on public.file_type_extensions for select to authenticated using (true);

drop policy if exists file_type_extensions_admin_all on public.file_type_extensions;
create policy file_type_extensions_admin_all
  on public.file_type_extensions for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

insert into public.file_type_extensions (extension, mime_type, icon, color, sort_order) values
  ('pdf',  'application/pdf', 'fas fa-file-pdf', '#f43f5e', 0),
  ('dwg',  'application/acad', 'fas fa-compass-drafting', '#6366f1', 1),
  ('doc',  'application/msword', 'fas fa-file-word', '#0284c7', 2),
  ('docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'fas fa-file-word', '#0284c7', 3),
  ('xls',  'application/vnd.ms-excel', 'fas fa-file-excel', '#059669', 4),
  ('xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'fas fa-file-excel', '#059669', 5)
on conflict (extension) do update set
  mime_type = excluded.mime_type,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order;
