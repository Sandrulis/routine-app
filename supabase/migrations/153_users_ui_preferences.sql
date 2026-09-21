-- Per-user table UI preferences (status group sort, hidden columns).
-- Not shown on the profile settings page; synced across devices.

alter table public.users
  add column if not exists ui_preferences jsonb not null default '{}'::jsonb;

alter table public.users
  drop constraint if exists users_ui_preferences_object;

alter table public.users
  add constraint users_ui_preferences_object
  check (jsonb_typeof(ui_preferences) = 'object');

create or replace function public.set_current_user_ui_preferences(
  p_status_group_sort text default null,
  p_hidden_table_columns jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  next_prefs jsonb;
  col_id text;
  col_count integer := 0;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_status_group_sort is not null
    and p_status_group_sort not in ('asc', 'desc') then
    raise exception 'Invalid status group sort';
  end if;

  if p_hidden_table_columns is not null then
    if jsonb_typeof(p_hidden_table_columns) <> 'array' then
      raise exception 'Invalid hidden table columns';
    end if;
    for col_id in
      select jsonb_array_elements_text(p_hidden_table_columns)
    loop
      col_count := col_count + 1;
      if col_count > 80 then
        raise exception 'Invalid hidden table columns';
      end if;
      if col_id is null
        or char_length(col_id) < 1
        or char_length(col_id) > 80
        or col_id !~ '^[A-Za-z0-9_-]+$' then
        raise exception 'Invalid hidden table columns';
      end if;
    end loop;
  end if;

  select coalesce(u.ui_preferences, '{}'::jsonb)
  into next_prefs
  from public.users as u
  where u.id = uid;

  if next_prefs is null then
    next_prefs := '{}'::jsonb;
  end if;

  if p_status_group_sort is not null then
    next_prefs := next_prefs || jsonb_build_object('statusGroupSort', p_status_group_sort);
  end if;

  if p_hidden_table_columns is not null then
    next_prefs := next_prefs || jsonb_build_object('hiddenTableColumns', p_hidden_table_columns);
  end if;

  update public.users
  set ui_preferences = next_prefs
  where id = uid;
end;
$$;

revoke all on function public.set_current_user_ui_preferences(text, jsonb)
  from public, anon;
grant execute on function public.set_current_user_ui_preferences(text, jsonb)
  to authenticated;
