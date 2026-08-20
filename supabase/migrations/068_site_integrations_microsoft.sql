-- Seed Microsoft OAuth system integration for OneDrive / Azure AD app.

insert into public.site_integrations (integration_key)
values ('microsoft_oauth')
on conflict (integration_key) do nothing;
