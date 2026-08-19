export const TEAM_NAV_PERMISSION_KEYS = [
  "dashboard",
  "lists",
  "team",
  "templates",
  "settings",
] as const;

export type TeamNavPermissionKey = (typeof TEAM_NAV_PERMISSION_KEYS)[number];

export const TEAM_ACTION_PERMISSION_KEYS = [
  "lists.create",
  "lists.edit",
  "lists.delete",
  "lists.statuses.manage",
  "lists.automations.manage",
  "tasks.manage",
  "files.upload",
  "templates.manage",
  "team.invite",
  "team.members.remove",
  "team.roles.manage",
  "team.permissions.manage",
  "team.settings.edit",
  "team.delete",
  "settings.save",
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
> = {
  dashboard: { key: "nav.home", fallback: "Sākums" },
  lists: { key: "nav.lists", fallback: "Saraksts" },
  team: { key: "nav.team", fallback: "Komanda" },
  templates: { key: "nav.templates", fallback: "Šabloni" },
  settings: { key: "nav.settings", fallback: "Uzstādījumi" },
};

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
      "lists.statuses.manage",
      "lists.automations.manage",
      "files.upload",
    ],
  },
  {
    titleKey: "team.access.groups.templates",
    title: "Šabloni",
    keys: ["templates.manage"],
  },
  {
    titleKey: "nav.team",
    title: "Komanda",
    keys: [
      "team.invite",
      "team.members.remove",
      "team.roles.manage",
      "team.permissions.manage",
      "team.settings.edit",
      "team.delete",
    ],
  },
  {
    titleKey: "nav.settings",
    title: "Uzstādījumi",
    keys: ["settings.save"],
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
  "files.upload": {
    key: "team.access.actions.files_upload",
    fallback: "Augšupielādēt failus",
  },
  "templates.manage": {
    key: "team.access.actions.templates_manage",
    fallback: "Pārvaldīt šablonus",
  },
  "team.invite": {
    key: "team.access.actions.team_invite",
    fallback: "Uzaicināt biedrus",
  },
  "team.members.remove": {
    key: "team.access.actions.team_members_remove",
    fallback: "Noņemt biedrus",
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
  "team.delete": {
    key: "team.access.actions.team_delete",
    fallback: "Dzēst komandu",
  },
  "settings.save": {
    key: "team.access.actions.settings_save",
    fallback: "Saglabāt uzstādījumus",
  },
};

export function createFullTeamPermissions(enabled = true): TeamPermissionSet {
  return {
    nav: Object.fromEntries(
      TEAM_NAV_PERMISSION_KEYS.map((key) => [key, enabled]),
    ) as Record<TeamNavPermissionKey, boolean>,
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

  for (const key of TEAM_NAV_PERMISSION_KEYS) {
    if (typeof record.nav?.[key] === "boolean") {
      full.nav[key] = record.nav[key];
    }
  }

  for (const key of TEAM_ACTION_PERMISSION_KEYS) {
    if (typeof record.actions?.[key] === "boolean") {
      full.actions[key] = record.actions[key];
    }
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
