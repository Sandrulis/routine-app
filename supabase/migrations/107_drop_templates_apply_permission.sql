-- Drop templates.apply; applying templates uses templates.manage.
-- Rename folders.create meaning is UI-only (Add folder / subfolders).

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

-- If someone only had templates.apply, keep templates.manage so Create → template stays.
update public.team_roles
set permissions = jsonb_set(
  coalesce(permissions, '{}'::jsonb),
  '{actions,templates.manage}',
  to_jsonb(
    coalesce((permissions -> 'actions' ->> 'templates.manage')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'templates.apply')::boolean, false)
  ),
  true
);

update public.system_default_roles
set permissions = jsonb_set(
  coalesce(permissions, '{}'::jsonb),
  '{actions,templates.manage}',
  to_jsonb(
    coalesce((permissions -> 'actions' ->> 'templates.manage')::boolean, false)
    or coalesce((permissions -> 'actions' ->> 'templates.apply')::boolean, false)
  ),
  true
);

update public.team_roles
set permissions = permissions #- '{actions,templates.apply}';

update public.system_default_roles
set permissions = permissions #- '{actions,templates.apply}';

update public.system_default_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';

update public.system_default_roles
set permissions = public.member_role_permissions()
where slug = 'member';

update public.team_roles
set permissions = public.owner_role_permissions()
where slug = 'owner';
