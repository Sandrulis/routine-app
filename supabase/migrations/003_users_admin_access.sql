-- Authenticated users can read their own profile (including is_admin).
-- current_user_is_admin() is the server/client gate for the admin panel.

drop policy if exists users_select_own on public.users;
create policy users_select_own
  on public.users
  for select
  to authenticated
  using (id = auth.uid());

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select u.is_admin
      from public.users as u
      where u.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;
