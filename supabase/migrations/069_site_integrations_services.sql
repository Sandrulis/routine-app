-- API-style site integrations: Resend, Umami, Sentry.

insert into public.site_integrations (integration_key)
values
  ('resend'),
  ('umami'),
  ('sentry')
on conflict (integration_key) do nothing;
