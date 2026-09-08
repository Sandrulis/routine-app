-- Personal To do rail (module_todo): per-user items, done is archived not deleted.

create table if not exists public.user_todos (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_todos_title_len check (
    char_length(btrim(title)) between 1 and 500
  )
);

create index if not exists user_todos_user_active_idx
  on public.user_todos (user_id, sort_order, created_at)
  where is_done = false;

create index if not exists user_todos_user_done_idx
  on public.user_todos (user_id, completed_at desc)
  where is_done = true;

drop trigger if exists user_todos_set_updated_at on public.user_todos;
create trigger user_todos_set_updated_at
  before update on public.user_todos
  for each row execute function public.set_updated_at();

alter table public.user_todos enable row level security;

revoke all on table public.user_todos from anon, authenticated;
grant select, insert, update, delete on table public.user_todos to authenticated;

drop policy if exists user_todos_deny_anon on public.user_todos;
create policy user_todos_deny_anon
  on public.user_todos for all to anon
  using (false)
  with check (false);

drop policy if exists user_todos_select_own on public.user_todos;
create policy user_todos_select_own
  on public.user_todos for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_todos_insert_own on public.user_todos;
create policy user_todos_insert_own
  on public.user_todos for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_todos_update_own on public.user_todos;
create policy user_todos_update_own
  on public.user_todos for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_todos_delete_own on public.user_todos;
create policy user_todos_delete_own
  on public.user_todos for delete to authenticated
  using (user_id = auth.uid());

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_todo', true, 17)
on conflict (module_key) do nothing;

insert into public.site_payment_plan_modules (plan_id, module_key)
select p.id, 'module_todo'
from public.site_payment_plans p
on conflict (plan_id, module_key) do nothing;
