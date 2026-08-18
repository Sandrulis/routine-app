import { teamRankLabel, type TeamMember, type TeamRole } from "@/app/lib/team";

export function assignedMembersOf(
  assigneeIds: string[],
  members: TeamMember[],
): TeamMember[] {
  return members.filter(
    (member) =>
      assigneeIds.includes(member.id) ||
      Boolean(member.userId && assigneeIds.includes(member.userId)),
  );
}

export function assignedRolesOf(
  assigneeIds: string[],
  roles: TeamRole[],
): TeamRole[] {
  return roles.filter((role) => assigneeIds.includes(role.id));
}

export function assigneeDisplayNames(
  assigneeIds: string[],
  members: TeamMember[],
  roles: TeamRole[],
  t: (key: string, fallback: string) => string,
): string {
  return [
    ...assignedMembersOf(assigneeIds, members).map((member) => member.name),
    ...assignedRolesOf(assigneeIds, roles).map(
      (role) => teamRankLabel(role.slug, t, roles) ?? role.name,
    ),
  ]
    .filter(Boolean)
    .join(", ");
}

export function memberIdsNotifiedForAssignees(
  addedIds: string[],
  members: TeamMember[],
): string[] {
  const fromRoles = members
    .filter((member) => member.roleId && addedIds.includes(member.roleId))
    .map((member) => member.id);
  return [...new Set([...addedIds, ...fromRoles])];
}
