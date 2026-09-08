-- Show pending custom-email signups in the admin user list.
-- They still must not receive is_admin until the email is confirmed.

insert into public.users (id, email, name, avatar, created_at, last_sign_in_at)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(
    nullif(pg_catalog.btrim(au.raw_user_meta_data ->> 'name'), ''),
    nullif(pg_catalog.btrim(au.raw_user_meta_data ->> 'full_name'), ''),
    nullif(pg_catalog.btrim(au.email), ''),
    'User'
  ),
  coalesce(au.raw_user_meta_data ->> 'avatar_url', ''),
  au.created_at,
  au.last_sign_in_at
from auth.users as au
where not exists (
  select 1
  from public.users as profile
  where profile.id = au.id
)
on conflict (id) do nothing;
