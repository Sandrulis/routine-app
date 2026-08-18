import { currentTeamRole, OWNER_TEAM_ROLE, type TeamMember, type TeamRole } from "@/app/lib/team";

export const LIST_ACCESS_LEVELS = ["full_edit", "edit", "comment", "view"] as const;

export type ListAccessLevel = (typeof LIST_ACCESS_LEVELS)[number];

export type ListAccessChoice = ListAccessLevel | "none";

export const LIST_ACCESS_RANK: Record<ListAccessLevel, number> = {
  view: 0,
  comment: 1,
  edit: 2,
  full_edit: 3,
};

export const DEFAULT_LIST_ACCESS_LEVEL: ListAccessLevel = "full_edit";

export const LIST_ACCESS_OPTIONS: {
  id: ListAccessLevel;
  titleKey: string;
  title: string;
  hintKey: string;
  hint: string;
}[] = [
  {
    id: "full_edit",
    titleKey: "lists.access.full_edit",
    title: "Pilna labošana",
    hintKey: "lists.access.full_edit.hint",
    hint: "Var veidot uzdevumus, labot saraksta iestatījumus un dzēst šo sarakstu.",
  },
  {
    id: "edit",
    titleKey: "lists.access.edit",
    title: "Labot",
    hintKey: "lists.access.edit.hint",
    hint: "Var labot uzdevumus un saraksta iestatījumus. Nevar veidot uzdevumus vai dzēst sarakstu.",
  },
  {
    id: "comment",
    titleKey: "lists.access.comment",
    title: "Komentēt",
    hintKey: "lists.access.comment.hint",
    hint: "Var komentēt. Izpildītājs var mainīt statusu. Nevar labot saraksta iestatījumus.",
  },
  {
    id: "view",
    titleKey: "lists.access.view",
    title: "Tikai skatīt",
    hintKey: "lists.access.view.hint",
    hint: "Tikai lasīšana. Nevar labot uzdevumus, sarakstu vai komentēt.",
  },
];

export type ListAccessSource = {
  isPrivate: boolean;
  createdBy: string | null;
  defaultAccessLevel: ListAccessLevel;
  viewerUserIds: string[];
  viewerRoleIds: string[];
  viewerUserAccess: Record<string, ListAccessLevel>;
  viewerRoleAccess: Record<string, ListAccessLevel>;
};

export type ListAccessCapabilities = {
  level: ListAccessLevel | null;
  canView: boolean;
  canComment: boolean;
  canChangeStatus: boolean;
  canEditTasks: boolean;
  canCreateTasks: boolean;
  canEditList: boolean;
  canDeleteList: boolean;
};

export function isListAccessLevel(value: unknown): value is ListAccessLevel {
  return (
    typeof value === "string" &&
    (LIST_ACCESS_LEVELS as readonly string[]).includes(value)
  );
}

export function parseListAccessLevel(
  value: unknown,
  fallback: ListAccessLevel = DEFAULT_LIST_ACCESS_LEVEL,
): ListAccessLevel {
  return isListAccessLevel(value) ? value : fallback;
}

export function parseAccessMap(value: unknown): Record<string, ListAccessLevel> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const next: Record<string, ListAccessLevel> = {};
  for (const [key, level] of Object.entries(value as Record<string, unknown>)) {
    if (!key || !isListAccessLevel(level)) continue;
    next[key] = level;
  }
  return next;
}

export function listAccessAtLeast(
  level: ListAccessLevel | null,
  required: ListAccessLevel,
): boolean {
  if (!level) return false;
  return LIST_ACCESS_RANK[level] >= LIST_ACCESS_RANK[required];
}

export function listAccessCapabilities(
  level: ListAccessLevel | null,
  options?: { isAssignee?: boolean },
): ListAccessCapabilities {
  const canView = level !== null;
  const canComment = listAccessAtLeast(level, "comment");
  const canEditTasks = listAccessAtLeast(level, "edit");
  return {
    level,
    canView,
    canComment,
    canChangeStatus: canEditTasks || (canComment && options?.isAssignee === true),
    canEditTasks,
    canCreateTasks: listAccessAtLeast(level, "full_edit"),
    canEditList: listAccessAtLeast(level, "edit"),
    canDeleteList: listAccessAtLeast(level, "full_edit"),
  };
}

export function resolveListAccessLevel(
  list: ListAccessSource,
  currentUser: Pick<TeamMember, "id" | "userId" | "role" | "roleId">,
  roles: TeamRole[],
  isAdmin: boolean,
): ListAccessLevel | null {
  const userId = currentUser.userId || currentUser.id;
  const role = currentTeamRole(currentUser, roles);
  const isOwner = currentUser.role === OWNER_TEAM_ROLE || role?.slug === OWNER_TEAM_ROLE;
  const isCreator = Boolean(userId && list.createdBy === userId);

  if (isAdmin || isOwner || isCreator) return "full_edit";

  const memberLevel = userId ? list.viewerUserAccess[userId] : undefined;
  const roleLevel = role ? list.viewerRoleAccess[role.id] : undefined;

  if (list.isPrivate) {
    const canSee =
      Boolean(memberLevel) ||
      Boolean(roleLevel) ||
      list.viewerUserIds.includes(userId) ||
      (role ? list.viewerRoleIds.includes(role.id) : false);
    if (!canSee) return null;
  }

  return memberLevel ?? roleLevel ?? list.defaultAccessLevel;
}

export function userIsAssignee(
  assigneeIds: string[],
  currentUser: Pick<TeamMember, "id" | "userId">,
): boolean {
  if (assigneeIds.includes(currentUser.id)) return true;
  return Boolean(currentUser.userId && assigneeIds.includes(currentUser.userId));
}

export function accessIds(map: Record<string, ListAccessLevel>): string[] {
  return Object.keys(map);
}

export function listHasCustomRoleAccess(
  roles: Pick<TeamRole, "id">[],
  viewerRoleAccess: Record<string, ListAccessLevel>,
  defaultAccessLevel: ListAccessLevel,
  isPrivate: boolean,
): boolean {
  return roles.some((role) => {
    const level = viewerRoleAccess[role.id];
    if (!level) return false;
    if (isPrivate) return true;
    return level !== defaultAccessLevel;
  });
}
