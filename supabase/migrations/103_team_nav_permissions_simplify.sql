-- Drop always-on section toggles (Sākums, Saraksts) and fold Šabloni into
-- templates.manage under the Komanda action group.

create or replace function public.owner_role_permissions()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "nav": {
      "team": true,
      "settings": true
    },
    "actions": {
      "lists.create": true,
      "lists.edit": true,
      "lists.delete": true,
      "lists.statuses.manage": true,
      "lists.automations.manage": true,
      "tasks.manage": true,
      "files.upload": true,
      "templates.manage": true,
      "team.invite": true,
      "team.members.remove": true,
      "team.roles.manage": true,
      "team.permissions.manage": true,
      "team.settings.edit": true,
      "team.integrations.google_drive": true,
      "team.integrations.onedrive": true,
      "team.delete": true,
      "settings.save": true
    }
  }'::jsonb;
$$;

create or replace function public.member_role_permissions()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "nav": {
      "team": true,
      "settings": true
    },
    "actions": {
      "lists.create": true,
      "lists.edit": true,
      "lists.delete": false,
      "lists.statuses.manage": false,
      "lists.automations.manage": false,
      "tasks.manage": true,
      "files.upload": true,
      "templates.manage": true,
      "team.invite": true,
      "team.members.remove": false,
      "team.roles.manage": false,
      "team.permissions.manage": false,
      "team.settings.edit": false,
      "team.integrations.google_drive": false,
      "team.integrations.onedrive": false,
      "team.delete": false,
      "settings.save": true
    }
  }'::jsonb;
$$;

-- Preserve templates access if someone only had the old nav.templates flag.
update public.team_roles
set permissions = jsonb_set(
  coalesce(permissions, '{}'::jsonb),
  '{actions,templates.manage}',
  to_jsonb(
    coalesce((permissions -> 'actions' ->> 'templates.manage')::boolean, false)
    or coalesce((permissions -> 'nav' ->> 'templates')::boolean, false)
  ),
  true
);

update public.system_default_roles
set permissions = jsonb_set(
  coalesce(permissions, '{}'::jsonb),
  '{actions,templates.manage}',
  to_jsonb(
    coalesce((permissions -> 'actions' ->> 'templates.manage')::boolean, false)
    or coalesce((permissions -> 'nav' ->> 'templates')::boolean, false)
  ),
  true
);

-- Strip removed nav keys from stored JSON.
update public.team_roles
set permissions = permissions
  #- '{nav,dashboard}'
  #- '{nav,lists}'
  #- '{nav,templates}';

update public.system_default_roles
set permissions = permissions
  #- '{nav,dashboard}'
  #- '{nav,lists}'
  #- '{nav,templates}';

-- Keep system defaults and owner roles aligned with SQL helpers.
update public.system_default_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';

update public.system_default_roles
set permissions = public.member_role_permissions()
where slug = 'member';

update public.team_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';
