-- Cloudflare Turnstile bot protection for auth flows.

insert into public.site_integrations (integration_key)
values ('turnstile')
on conflict (integration_key) do nothing;

create or replace function public.public_turnstile_config()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'enabled', exists (
      select 1
      from public.site_integrations
      where integration_key = 'turnstile'
        and is_configured
        and is_enabled
        and nullif(trim(client_id), '') is not null
    ),
    'siteKey', coalesce(
      (
        select trim(client_id)
        from public.site_integrations
        where integration_key = 'turnstile'
          and is_configured
          and is_enabled
        limit 1
      ),
      ''
    )
  );
$$;

revoke all on function public.public_turnstile_config() from public;
grant execute on function public.public_turnstile_config() to anon, authenticated;
