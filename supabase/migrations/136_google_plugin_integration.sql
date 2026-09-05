-- Separate Google Cloud OAuth app for the Gmail Chrome plugin.

insert into public.site_integrations (integration_key)
values ('google_plugin')
on conflict (integration_key) do nothing;
