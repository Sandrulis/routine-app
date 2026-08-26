export const TEAM_NAV_PERMISSION_KEYS = [] as const;

export type TeamNavPermissionKey = (typeof TEAM_NAV_PERMISSION_KEYS)[number];

export const TEAM_ACTION_PERMISSION_KEYS = [
  "lists.create",
  "lists.edit",
  "lists.delete",
  "lists.statuses.manage",
  "lists.automations.manage",
  "tasks.manage",
  "subtasks.status.change",
  "folders.create",
  "folders.archive",
  "tasks.archive",
  "lists.archive.view",
  "subtasks.archive.view",
  "files.upload",
  "files.upload.subtask",
  "files.view",
  "files.forward",
  "team.options",
  "templates.manage",
  "team.invite",
  "team.members.remove",
  "team.roles.manage",
  "team.permissions.manage",
  "team.settings.edit",
  "team.integrations.google_drive",
  "team.integrations.onedrive",
  "team.delete",
] as const;

export type TeamActionPermissionKey =
  (typeof TEAM_ACTION_PERMISSION_KEYS)[number];

export type TeamPermissionSet = {
  nav: Record<TeamNavPermissionKey, boolean>;
  actions: Record<TeamActionPermissionKey, boolean>;
};

export const TEAM_NAV_PERMISSION_LABELS: Record<
  TeamNavPermissionKey,
  { key: string; fallback: string }
> = {};

export const TEAM_ACTION_PERMISSION_GROUPS: {
  titleKey: string;
  title: string;
  keys: TeamActionPermissionKey[];
}[] = [
  {
    titleKey: "team.access.groups.lists",
    title: "Saraksti un uzdevumi",
    keys: [
      "lists.create",
      "lists.edit",
      "lists.delete",
      "tasks.manage",
      "subtasks.status.change",
      "folders.create",
      "folders.archive",
      "tasks.archive",
      "lists.archive.view",
      "subtasks.archive.view",
      "lists.statuses.manage",
      "lists.automations.manage",
      "files.upload",
      "files.upload.subtask",
      "files.view",
      "files.forward",
    ],
  },
  {
    titleKey: "nav.team",
    title: "Komanda",
    keys: [
      "team.options",
      "templates.manage",
      "team.invite",
      "team.members.remove",
      "team.roles.manage",
      "team.permissions.manage",
      "team.settings.edit",
      "team.delete",
    ],
  },
  {
    titleKey: "team.access.groups.integrations",
    title: "Komandas integrācijas",
    keys: [
      "team.integrations.google_drive",
      "team.integrations.onedrive",
    ],
  },
];

export const TEAM_ACTION_PERMISSION_LABELS: Record<
  TeamActionPermissionKey,
  { key: string; fallback: string }
> = {
  "lists.create": {
    key: "team.access.actions.lists_create",
    fallback: "Veidot sarakstus",
  },
  "lists.edit": {
    key: "team.access.actions.lists_edit",
    fallback: "Labot sarakstus",
  },
  "lists.delete": {
    key: "team.access.actions.lists_delete",
    fallback: "Dzēst sarakstus",
  },
  "lists.statuses.manage": {
    key: "team.access.actions.lists_statuses",
    fallback: "Pārvaldīt saraksta statusus",
  },
  "lists.automations.manage": {
    key: "team.access.actions.lists_automations",
    fallback: "Pārvaldīt automatizācijas",
  },
  "tasks.manage": {
    key: "team.access.actions.tasks_manage",
    fallback: "Pārvaldīt uzdevumus",
  },
  "subtasks.status.change": {
    key: "team.access.actions.subtasks_status_change",
    fallback: "Mainīt statusu apakšuzdevumam",
  },
  "folders.create": {
    key: "team.access.actions.folders_create",
    fallback: "Pievienot mapi / apakšmapes",
  },
  "folders.archive": {
    key: "team.access.actions.folders_archive",
    fallback: "Arhivēt mapes",
  },
  "tasks.archive": {
    key: "team.access.actions.tasks_archive",
    fallback: "Arhivēt uzdevumus",
  },
  "lists.archive.view": {
    key: "team.access.actions.lists_archive_view",
    fallback: "Apskatīt Saraksta arhīvu",
  },
  "subtasks.archive.view": {
    key: "team.access.actions.subtasks_archive_view",
    fallback: "Apskatīt Apakšuzdevumu arhīvu",
  },
  "files.upload": {
    key: "team.access.actions.files_upload",
    fallback: "Augšupielādēt failus",
  },
  "files.upload.subtask": {
    key: "team.access.actions.files_upload_subtask",
    fallback: "Augšupielādēt apakšuzdevumam pielikumus",
  },
  "files.view": {
    key: "team.access.actions.files_view",
    fallback: "Apskatīt Pielikumus",
  },
  "files.forward": {
    key: "team.access.actions.files_forward",
    fallback: "Pārsūtīt pielikumus",
  },
  "team.options": {
    key: "team.access.actions.team_options",
    fallback: "Komandas opcijas",
  },
  "templates.manage": {
    key: "team.access.actions.templates_manage",
    fallback: "Pārvaldīt šablonus",
  },
  "team.invite": {
    key: "team.access.actions.team_invite",
    fallback: "Uzaicināt lietotājus",
  },
  "team.members.remove": {
    key: "team.access.actions.team_members_remove",
    fallback: "Noņemt lietotājus",
  },
  "team.roles.manage": {
    key: "team.access.actions.team_roles",
    fallback: "Pārvaldīt komandas lomas",
  },
  "team.permissions.manage": {
    key: "team.access.actions.team_permissions",
    fallback: "Pārvaldīt lomu pieejas",
  },
  "team.settings.edit": {
    key: "team.access.actions.team_settings_edit",
    fallback: "Labot komandas datus",
  },
  "team.integrations.google_drive": {
    key: "team.access.actions.team_integrations_google_drive",
    fallback: "Pārvaldīt Google Drive",
  },
  "team.integrations.onedrive": {
    key: "team.access.actions.team_integrations_onedrive",
    fallback: "Pārvaldīt OneDrive",
  },
  "team.delete": {
    key: "team.access.actions.team_delete",
    fallback: "Dzēst komandu",
  },
};

export function createFullTeamPermissions(enabled = true): TeamPermissionSet {
  return {
    nav: {} as Record<TeamNavPermissionKey, boolean>,
    actions: Object.fromEntries(
      TEAM_ACTION_PERMISSION_KEYS.map((key) => [key, enabled]),
    ) as Record<TeamActionPermissionKey, boolean>,
  };
}

export function createMemberTeamPermissions(): TeamPermissionSet {
  const permissions = createFullTeamPermissions(true);
  permissions.actions["lists.delete"] = false;
  permissions.actions["lists.statuses.manage"] = false;
  permissions.actions["lists.automations.manage"] = false;
  permissions.actions["team.roles.manage"] = false;
  permissions.actions["team.permissions.manage"] = false;
  permissions.actions["team.settings.edit"] = false;
  permissions.actions["team.integrations.google_drive"] = false;
  permissions.actions["team.integrations.onedrive"] = false;
  permissions.actions["team.delete"] = false;
  permissions.actions["team.members.remove"] = false;
  return permissions;
}

export function normalizeTeamPermissionSet(value: unknown): TeamPermissionSet {
  const full = createFullTeamPermissions(false);
  if (!value || typeof value !== "object") {
    return full;
  }

  const record = value as {
    nav?: Record<string, boolean>;
    actions?: Record<string, boolean>;
  };

  for (const key of TEAM_ACTION_PERMISSION_KEYS) {
    if (typeof record.actions?.[key] === "boolean") {
      full.actions[key] = record.actions[key];
    }
  }

  // Legacy: folders.archive.view → subtasks.archive.view
  if (
    !full.actions["subtasks.archive.view"] &&
    record.actions?.["folders.archive.view"] === true
  ) {
    full.actions["subtasks.archive.view"] = true;
  }

  // Legacy: nav.templates → templates.manage
  if (
    !full.actions["templates.manage"] &&
    record.nav?.templates === true
  ) {
    full.actions["templates.manage"] = true;
  }

  // Legacy: nav.team or former menu abilities → team.options
  if (
    !full.actions["team.options"] &&
    (record.nav?.team === true ||
      record.actions?.["templates.manage"] === true ||
      record.actions?.["team.roles.manage"] === true ||
      record.actions?.["team.integrations.google_drive"] === true ||
      record.actions?.["team.integrations.onedrive"] === true)
  ) {
    full.actions["team.options"] = true;
  }

  return full;
}

export function cloneTeamPermissions(
  permissions: TeamPermissionSet,
): TeamPermissionSet {
  return {
    nav: { ...permissions.nav },
    actions: { ...permissions.actions },
  };
}

export function sameTeamPermissions(
  left: TeamPermissionSet,
  right: TeamPermissionSet,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
