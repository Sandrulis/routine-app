-- Public login page needs to know which methods are on without reading secrets.
-- site_integrations is deny-all for anon/authenticated.

create or replace function public.public_sign_in_methods()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'email', exists (
      select 1
      from public.site_integrations
      where integration_key = 'resend'
        and is_configured
        and is_enabled
    ),
    'google', exists (
      select 1
      from public.site_integrations
      where integration_key = 'google_oauth'
        and is_configured
        and is_enabled
    ),
    'microsoft', exists (
      select 1
      from public.site_integrations
      where integration_key = 'microsoft_oauth'
        and is_configured
        and is_enabled
    )
  );
$$;

revoke all on function public.public_sign_in_methods() from public;
grant execute on function public.public_sign_in_methods() to anon, authenticated;
