"use client";

import { memo } from "react";
import { OptionalTooltip } from "@/app/components/tooltip";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import {
  assignedDutiesOf,
  assignedMembersOf,
  assignedRolesOf,
  assigneeDisplayNames,
} from "@/app/lib/assignees";
import { teamRankLabel } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";

export const AssigneeFaces = memo(function AssigneeFaces({
  assigneeIds,
  className = "",
}: {
  assigneeIds: string[];
  className?: string;
}) {
  const { t } = useTranslations();
  const { members, roles, duties } = useTeam();
  const assignedMembers = assignedMembersOf(assigneeIds, members);
  const assignedRoles = assignedRolesOf(assigneeIds, roles);
  const assignedDuties = assignedDutiesOf(assigneeIds, duties);
  if (
    assignedMembers.length === 0 &&
    assignedRoles.length === 0 &&
    assignedDuties.length === 0
  ) {
    return null;
  }

  const label = assigneeDisplayNames(assigneeIds, members, roles, t, duties);

  return (
    <OptionalTooltip label={label} align="end">
      <span
        className={`inline-flex shrink-0 items-center gap-1 ${className}`.trim()}
      >
        {assignedMembers.length > 0 ? (
          <span className="flex items-center -space-x-1.5">
            {assignedMembers.map((member) => (
              <UserAvatar key={member.id} member={member} size="xs" />
            ))}
          </span>
        ) : null}
        {assignedRoles.map((role) => (
          <span
            key={role.id}
            className="inline-flex max-w-[5.5rem] items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600"
          >
            <i className="fas fa-user-group text-[8px]" aria-hidden="true" />
            <span className="truncate">
              {teamRankLabel(role.slug, t, roles) ?? role.name}
            </span>
          </span>
        ))}
        {assignedDuties.map((duty) => (
          <span
            key={duty.id}
            className="inline-flex max-w-[5.5rem] items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600"
          >
            <i className="fas fa-briefcase text-[8px]" aria-hidden="true" />
            <span className="truncate">{duty.name}</span>
          </span>
        ))}
      </span>
    </OptionalTooltip>
  );
});
