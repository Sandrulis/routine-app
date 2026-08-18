-- Admin CRUD uz task_statuses: politika jau ir, bet GRANT bija tikai SELECT.
grant insert, update, delete on table public.task_statuses to authenticated;
