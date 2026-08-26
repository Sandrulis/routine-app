-- Separate team Google Drive / OneDrive configure permissions from team.settings.edit.

create or replace function public.owner_role_permissions()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "nav": {
      "dashboard": true,
      "lists": true,
      "team": true,
      "templates": true,
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
      "dashboard": true,
      "lists": true,
      "team": true,
      "templates": true,
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

-- Backfill without wiping custom role permissions.
-- Inherit from team.settings.edit so previous integrators keep access; owner always on.
update public.team_roles
set permissions = jsonb_set(
  jsonb_set(
    coalesce(permissions, '{}'::jsonb),
    '{actions,team.integrations.google_drive}',
    to_jsonb(
      slug = 'owner'
      or coalesce((permissions -> 'actions' ->> 'team.settings.edit')::boolean, false)
    ),
    true
  ),
  '{actions,team.integrations.onedrive}',
  to_jsonb(
    slug = 'owner'
    or coalesce((permissions -> 'actions' ->> 'team.settings.edit')::boolean, false)
  ),
  true
);

update public.system_default_roles
set permissions = jsonb_set(
  jsonb_set(
    coalesce(permissions, '{}'::jsonb),
    '{actions,team.integrations.google_drive}',
    to_jsonb(
      slug = 'owner'
      or coalesce((permissions -> 'actions' ->> 'team.settings.edit')::boolean, false)
    ),
    true
  ),
  '{actions,team.integrations.onedrive}',
  to_jsonb(
    slug = 'owner'
    or coalesce((permissions -> 'actions' ->> 'team.settings.edit')::boolean, false)
  ),
  true
);

-- Keep system defaults for owner/member aligned with SQL helpers.
update public.system_default_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';

update public.system_default_roles
set permissions = public.member_role_permissions()
where slug = 'member';

update public.team_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';
