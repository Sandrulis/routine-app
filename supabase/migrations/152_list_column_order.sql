-- Persist user-defined table column order per list (built-in + custom ids).

alter table public.work_lists
  add column if not exists column_order jsonb not null default '[]'::jsonb;
