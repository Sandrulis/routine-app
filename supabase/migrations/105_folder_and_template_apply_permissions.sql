-- Separate apply-templates and create-folders from templates.manage / tasks.manage.

create or replace function public.owner_role_permissions()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "nav": {
      "team": true
    },
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
    "nav": {
      "team": true
    },
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

-- Backfill without wiping custom roles.
update public.team_roles
set permissions = jsonb_set(
  jsonb_set(
    coalesce(permissions, '{}'::jsonb),
    '{actions,folders.create}',
    to_jsonb(
      slug = 'owner'
      or coalesce((permissions -> 'actions' ->> 'folders.create')::boolean, false)
      or coalesce((permissions -> 'actions' ->> 'tasks.manage')::boolean, false)
    ),
    true
  ),
  '{actions,templates.apply}',
  to_jsonb(
    slug = 'owner'
    or coalesce((permissions -> 'actions' ->> 'templates.apply')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'templates.manage')::boolean, false)
  ),
  true
);

update public.system_default_roles
set permissions = jsonb_set(
  jsonb_set(
    coalesce(permissions, '{}'::jsonb),
    '{actions,folders.create}',
    to_jsonb(
      slug = 'owner'
      or coalesce((permissions -> 'actions' ->> 'folders.create')::boolean, false)
      or coalesce((permissions -> 'actions' ->> 'tasks.manage')::boolean, false)
    ),
    true
  ),
  '{actions,templates.apply}',
  to_jsonb(
    slug = 'owner'
    or coalesce((permissions -> 'actions' ->> 'templates.apply')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'templates.manage')::boolean, false)
  ),
  true
);

update public.system_default_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';

update public.system_default_roles
set permissions = public.member_role_permissions()
where slug = 'member';

update public.team_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';
