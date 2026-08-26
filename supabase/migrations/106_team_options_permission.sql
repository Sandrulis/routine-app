-- Drop remaining nav section permissions; gate team "..." menu with team.options.

create or replace function public.owner_role_permissions()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "nav": {},
    "actions": {
      "lists.create": true,
      "lists.edit": true,
      "lists.delete": true,
      "lists.statuses.manage": true,
      "lists.automations.manage": true,
      "tasks.manage": true,
      "folders.create": true,
      "templates.apply": true,
      "files.upload": true,
      "team.options": true,
      "templates.manage": true,
      "team.invite": true,
      "team.members.remove": true,
      "team.roles.manage": true,
      "team.permissions.manage": true,
      "team.settings.edit": true,
      "team.integrations.google_drive": true,
      "team.integrations.onedrive": true,
      "team.delete": true
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
    "nav": {},
    "actions": {
      "lists.create": true,
      "lists.edit": true,
      "lists.delete": false,
      "lists.statuses.manage": false,
      "lists.automations.manage": false,
      "tasks.manage": true,
      "folders.create": true,
      "templates.apply": true,
      "files.upload": true,
      "team.options": true,
      "templates.manage": true,
      "team.invite": true,
      "team.members.remove": false,
      "team.roles.manage": false,
      "team.permissions.manage": false,
      "team.settings.edit": false,
      "team.integrations.google_drive": false,
      "team.integrations.onedrive": false,
      "team.delete": false
    }
  }'::jsonb;
$$;

-- Backfill team.options from former nav.team or menu-related actions.
update public.team_roles
set permissions = jsonb_set(
  coalesce(permissions, '{}'::jsonb),
  '{actions,team.options}',
  to_jsonb(
    slug = 'owner'
    or coalesce((permissions -> 'actions' ->> 'team.options')::boolean, false)
    or coalesce((permissions -> 'nav' ->> 'team')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'templates.manage')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'team.roles.manage')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'team.integrations.google_drive')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'team.integrations.onedrive')::boolean, false)
  ),
  true
);

update public.system_default_roles
set permissions = jsonb_set(
  coalesce(permissions, '{}'::jsonb),
  '{actions,team.options}',
  to_jsonb(
    slug = 'owner'
    or coalesce((permissions -> 'actions' ->> 'team.options')::boolean, false)
    or coalesce((permissions -> 'nav' ->> 'team')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'templates.manage')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'team.roles.manage')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'team.integrations.google_drive')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'team.integrations.onedrive')::boolean, false)
  ),
  true
);

update public.team_roles
set permissions = jsonb_set(permissions, '{nav}', '{}'::jsonb, true);

update public.system_default_roles
set permissions = jsonb_set(permissions, '{nav}', '{}'::jsonb, true);

update public.system_default_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';

update public.system_default_roles
set permissions = public.member_role_permissions()
where slug = 'member';

update public.team_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';
