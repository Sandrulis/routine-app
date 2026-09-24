alter table public.work_tasks
  add column if not exists factory_shared boolean not null default false;
