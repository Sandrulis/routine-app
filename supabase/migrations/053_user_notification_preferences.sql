-- Per-user in-app notification toggles (missing row = enabled).

create table if not exists public.user_notification_preferences (
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

create index if not exists user_notification_preferences_user_id_idx
  on public.user_notification_preferences (user_id);

alter table public.user_notification_preferences enable row level security;

revoke all on table public.user_notification_preferences from anon, authenticated;
grant select, insert, update, delete on table public.user_notification_preferences to authenticated;

drop policy if exists user_notification_preferences_deny_anon
  on public.user_notification_preferences;
create policy user_notification_preferences_deny_anon
  on public.user_notification_preferences for all to anon
  using (false) with check (false);

drop policy if exists user_notification_preferences_select_own
  on public.user_notification_preferences;
create policy user_notification_preferences_select_own
  on public.user_notification_preferences for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_notification_preferences_insert_own
  on public.user_notification_preferences;
create policy user_notification_preferences_insert_own
  on public.user_notification_preferences for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_notification_preferences_update_own
  on public.user_notification_preferences;
create policy user_notification_preferences_update_own
  on public.user_notification_preferences for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_notification_preferences_delete_own
  on public.user_notification_preferences;
create policy user_notification_preferences_delete_own
  on public.user_notification_preferences for delete to authenticated
  using (user_id = auth.uid());
