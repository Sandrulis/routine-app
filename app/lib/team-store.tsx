"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { hasCompletedLocalImport, importLocalWorkIfNeeded, readStoredCurrentTeamId } from "@/app/lib/db/import-local-work";
import {
  deleteTeamRow,
  deleteTeamRoleRow,
  fetchUserTeams,
  insertTeam,
  insertTeamRole,
  reorderTeamRoleRows,
  isUnauthenticatedDbError,
  touchMemberOnline,
  updateMemberRoleRow,
  updateTeamRoleRow,
  updateTeamRow,
} from "@/app/lib/db/work-data";
import { inviteTeamMemberAction } from "@/app/lib/team/actions";
import { clearLegacyDemoStorage } from "@/app/lib/clear-legacy-demo-storage";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import {
  TEAM_CHANGE_EVENT,
  createOwnerMember,
  createRoleId,
  createTeamId,
  currentTeamIdStorageKey,
  defaultTeamRoleId,
  defaultTeamRoles,
  emptyTeamMember,
  initialsFromName,
  MEMBER_TEAM_ROLE,
  OWNER_TEAM_ROLE,
  slugFromRoleName,
  toneForIndex,
  type MembersByTeam,
  type RolesByTeam,
  type TeamMember,
  type TeamRole,
  type WorkTeam,
} from "@/app/lib/team";
import {
  createMemberTeamPermissions,
  type TeamPermissionSet,
} from "@/app/lib/team-permissions";
import { randomListColorId } from "@/app/lib/lists";

type InviteMemberInput = {
  email: string;
  role: string;
};

type AddTeamInput = {
  name: string;
  icon?: string | null;
  color?: string;
  logoUrl?: string | null;
};

type TeamContextValue = {
  isReady: boolean;
  members: TeamMember[];
  currentUser: TeamMember;
  teams: WorkTeam[];
  currentTeam: WorkTeam | null;
  roles: TeamRole[];
  inviteMember: (input: InviteMemberInput) => Promise<TeamMember>;
  refreshTeams: () => Promise<{
    teams: WorkTeam[];
    membersByTeam: MembersByTeam;
    rolesByTeam: RolesByTeam;
  }>;
  addTeam: (input: AddTeamInput) => WorkTeam;
  updateTeam: (teamId: string, input: AddTeamInput) => void;
  deleteTeam: (teamId: string) => boolean;
  selectTeam: (teamId: string) => void;
  addTeamRole: (name: string) => Promise<TeamRole | null>;
  reorderTeamRoles: (orderedIds: string[]) => Promise<boolean>;
  renameTeamRole: (roleId: string, name: string) => void;
  deleteTeamRole: (roleId: string) => boolean;
  assignMemberRole: (memberId: string, roleId: string) => void;
  updateRolePermissions: (roleId: string, permissions: TeamPermissionSet) => void;
};

const TeamContext = createContext<TeamContextValue | null>(null);

function isTransientOnlineTouchError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    isUnauthenticatedDbError(error)
  );
}

function ownerFromAuth(user: User): TeamMember {
  const display = mapUserDisplay(user);
  return createOwnerMember({
    id: user.id,
    name: display.name,
    email: display.email,
    avatarUrl: display.avatarUrl,
  });
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isReady: authReady } = useAuthSession();
  const [membersByTeam, setMembersByTeam] = useState<MembersByTeam>({});
  const [rolesByTeam, setRolesByTeam] = useState<RolesByTeam>({});
  const [teams, setTeams] = useState<WorkTeam[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState("");
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    clearLegacyDemoStorage();

    const userId = authUser?.id ?? null;
    setIsReady(false);

    if (!userId || !authUser) {
      setTeams([]);
      setCurrentTeamId("");
      setMembersByTeam({});
      setRolesByTeam({});
      setLoadedScope(userId);
      setIsReady(true);
      return;
    }

    const owner = ownerFromAuth(authUser);
    let cancelled = false;

    void (async () => {
      try {
        if (!hasCompletedLocalImport(userId)) {
          await importLocalWorkIfNeeded(userId, owner);
        }
        const { teams: nextTeams, membersByTeam: nextMembers, rolesByTeam: nextRoles } =
          await fetchUserTeams();
        if (cancelled) return;
        setTeams(nextTeams);
        setMembersByTeam(nextMembers);
        setRolesByTeam(nextRoles);
        setCurrentTeamId(readStoredCurrentTeamId(userId, nextTeams.map((team) => team.id)));
      } catch (error) {
        console.error("Failed to load teams", error);
        if (!cancelled) {
          setTeams([]);
          setCurrentTeamId("");
          setMembersByTeam({});
          setRolesByTeam({});
        }
      } finally {
        if (!cancelled) {
          setLoadedScope(userId);
          setIsReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, authUser]);

  useEffect(() => {
    if (!isReady) return;
    const userId = authUser?.id ?? null;
    if (loadedScope !== userId) return;
    window.localStorage.setItem(currentTeamIdStorageKey(userId), currentTeamId);
    window.dispatchEvent(new Event(TEAM_CHANGE_EVENT));
  }, [authUser?.id, currentTeamId, isReady, loadedScope]);

  const refreshTeams = useCallback(async () => {
    const { teams: nextTeams, membersByTeam: nextMembers, rolesByTeam: nextRoles } =
      await fetchUserTeams();
    setTeams(nextTeams);
    setMembersByTeam(nextMembers);
    setRolesByTeam(nextRoles);
    if (nextTeams.length > 0 && authUser?.id) {
      setCurrentTeamId((current) => {
        if (current && nextTeams.some((team) => team.id === current)) {
          return current;
        }
        return readStoredCurrentTeamId(
          authUser.id,
          nextTeams.map((team) => team.id),
        );
      });
    }
    window.dispatchEvent(new Event(TEAM_CHANGE_EVENT));
    return { teams: nextTeams, membersByTeam: nextMembers, rolesByTeam: nextRoles };
  }, [authUser]);

  const inviteMember = useCallback(
    async (input: InviteMemberInput) => {
      if (!currentTeamId) {
        throw new Error("errors.auth_required");
      }

      const teamRoles = rolesByTeam[currentTeamId] ?? [];
      const requested = input.role.trim();
      const matched =
        teamRoles.find((role) => role.id === requested || role.slug === requested) ??
        teamRoles.find((role) => role.slug === MEMBER_TEAM_ROLE) ??
        null;

      const result = await inviteTeamMemberAction({
        teamId: currentTeamId,
        email: input.email.trim(),
        roleId: matched?.id ?? requested,
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      const refreshed = await refreshTeams();
      const refreshedMember = refreshed.membersByTeam[currentTeamId]?.find(
        (member) => member.id === result.data.memberId,
      );

      if (!refreshedMember) {
        throw new Error("errors.team_invite_failed");
      }

      return refreshedMember;
    },
    [currentTeamId, refreshTeams, rolesByTeam],
  );

  useEffect(() => {
    if (!isReady || !currentTeamId || !authUser?.id) return;
    const teamId = currentTeamId;
    const userId = authUser.id;

    function touchCurrentUser() {
      void touchMemberOnline(teamId, userId, new Date().toISOString()).catch((error) => {
        if (
          !navigator.onLine ||
          document.visibilityState !== "visible" ||
          isTransientOnlineTouchError(error)
        ) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "message" in error
              ? String((error as { message: unknown }).message)
              : String(error);
        console.error("Failed to update last online", message);
      });
    }

    touchCurrentUser();
    const timer = window.setInterval(touchCurrentUser, 90_000);
    return () => window.clearInterval(timer);
  }, [authUser?.id, currentTeamId, isReady]);

  const currentTeam = useMemo(
    () => teams.find((team) => team.id === currentTeamId) ?? teams[0] ?? null,
    [currentTeamId, teams],
  );

  const members = useMemo(() => {
    const list = currentTeam ? (membersByTeam[currentTeam.id] ?? []) : [];
    if (!authUser) return list;

    const display = mapUserDisplay(authUser);
    const overlayId = authUser.id;
    const isSelf = (member: TeamMember) =>
      member.id === overlayId || member.userId === overlayId;
    const next = list.map((member) =>
      isSelf(member)
        ? {
            ...member,
            name: display.name || member.name,
            email: display.email || member.email,
            initials: initialsFromName(display.name || member.name),
            avatarUrl: display.avatarUrl ?? member.avatarUrl,
            role: member.role || OWNER_TEAM_ROLE,
            roleId: member.roleId,
            userId: overlayId,
          }
        : member,
    );

    const selfIndex = next.findIndex(isSelf);
    if (selfIndex > 0) {
      const [self] = next.splice(selfIndex, 1);
      next.unshift(self);
    }
    return next;
  }, [authUser, currentTeam, membersByTeam]);

  const currentUser = useMemo(() => {
    if (authUser) {
      const display = mapUserDisplay(authUser);
      const fromTeam = members.find(
        (member) => member.id === authUser.id || member.userId === authUser.id,
      );
      const name = display.name || fromTeam?.name || "";
      return {
        id: fromTeam?.id ?? authUser.id,
        userId: authUser.id,
        name,
        email: display.email || fromTeam?.email || "",
        initials: initialsFromName(name),
        role: currentTeam ? fromTeam?.role || OWNER_TEAM_ROLE : "",
        roleId: fromTeam?.roleId ?? null,
        toneClassName: fromTeam?.toneClassName ?? toneForIndex(0),
        lastOnlineAt: fromTeam?.lastOnlineAt ?? null,
        avatarUrl: display.avatarUrl,
      };
    }

    const base = emptyTeamMember();
    return currentTeam ? base : { ...base, role: "" };
  }, [authUser, currentTeam, members]);

  const roles = useMemo(() => {
    const list = currentTeam
      ? (rolesByTeam[currentTeam.id] ?? defaultTeamRoles(currentTeam.id))
      : [];
    return [...list].sort((left, right) => left.sortOrder - right.sortOrder);
  }, [currentTeam, rolesByTeam]);

  const addTeam = useCallback(
    (input: AddTeamInput) => {
      const trimmed = input.name.trim();
      const team: WorkTeam = {
        id: createTeamId(),
        name: trimmed,
        initials: initialsFromName(trimmed),
        icon: input.icon ?? null,
        color: input.color ?? randomListColorId(),
        logoUrl: input.logoUrl ?? null,
      };

      const owner = authUser
        ? ownerFromAuth(authUser)
        : {
            ...emptyTeamMember(),
            role: OWNER_TEAM_ROLE,
          };
      const ownerWithOnline = {
        ...owner,
        lastOnlineAt: new Date().toISOString(),
        roleId: defaultTeamRoleId(team.id, "owner"),
      };
      const seededRoles = defaultTeamRoles(team.id);

      if (authUser) {
        void insertTeam(team, ownerWithOnline, authUser.id)
          .then(() => {
            setTeams((current) => [...current, team]);
            setCurrentTeamId(team.id);
            setMembersByTeam((current) => ({
              ...current,
              [team.id]: [ownerWithOnline],
            }));
            setRolesByTeam((current) => ({
              ...current,
              [team.id]: seededRoles,
            }));
          })
          .catch((error) => {
            console.error("Failed to create team", error);
          });
      } else {
        setTeams((current) => [...current, team]);
        setCurrentTeamId(team.id);
        setMembersByTeam((current) => ({
          ...current,
          [team.id]: [ownerWithOnline],
        }));
        setRolesByTeam((current) => ({
          ...current,
          [team.id]: seededRoles,
        }));
      }
      return team;
    },
    [authUser],
  );

  const updateTeam = useCallback((teamId: string, input: AddTeamInput) => {
    const trimmed = input.name.trim();
    setTeams((current) => {
      const next = current.map((team) =>
        team.id === teamId
          ? {
              ...team,
              name: trimmed,
              initials: initialsFromName(trimmed),
              icon: input.icon ?? null,
              color: input.color ?? team.color,
              logoUrl: input.logoUrl ?? null,
            }
          : team,
      );
      const updated = next.find((team) => team.id === teamId);
      if (updated) {
        void updateTeamRow(updated).catch((error) => {
          console.error("Failed to update team", error);
        });
      }
      return next;
    });
  }, []);

  const deleteTeam = useCallback((teamId: string) => {
    let removed = false;
    setTeams((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((team) => team.id !== teamId);
      if (next.length === current.length) return current;
      removed = true;
      setCurrentTeamId((id) =>
        id === teamId ? (next[0]?.id ?? "") : id,
      );
      return next;
    });
    if (removed) {
      setMembersByTeam((current) => {
        const next = { ...current };
        delete next[teamId];
        return next;
      });
      setRolesByTeam((current) => {
        const next = { ...current };
        delete next[teamId];
        return next;
      });
      void deleteTeamRow(teamId).catch((error) => {
        console.error("Failed to delete team", error);
      });
    }
    return removed;
  }, []);

  const selectTeam = useCallback((teamId: string) => {
    setCurrentTeamId(teamId);
  }, []);

  const addTeamRole = useCallback(
    async (name: string) => {
      if (!currentTeam) return null;
      const trimmed = name.trim();
      if (!trimmed) return null;
      const existing = rolesByTeam[currentTeam.id] ?? [];
      let slug = slugFromRoleName(trimmed);
      if (
        slug === OWNER_TEAM_ROLE ||
        slug === MEMBER_TEAM_ROLE ||
        existing.some((role) => role.slug === slug)
      ) {
        slug = `${slug}_${Date.now().toString(36)}`;
      }
      const role: TeamRole = {
        id: createRoleId(),
        teamId: currentTeam.id,
        slug,
        name: trimmed,
        sortOrder:
          existing.reduce((max, role) => Math.max(max, role.sortOrder), -1) + 1,
        isSystem: false,
        permissions: createMemberTeamPermissions(),
      };
      try {
        await insertTeamRole(role);
        setRolesByTeam((current) => ({
          ...current,
          [currentTeam.id]: [...(current[currentTeam.id] ?? []), role],
        }));
        return role;
      } catch (error) {
        console.error("Failed to create team role", error);
        return null;
      }
    },
    [currentTeam, rolesByTeam],
  );

  const reorderTeamRoles = useCallback(
    async (orderedIds: string[]) => {
      if (!currentTeam) return false;
      const previous = rolesByTeam[currentTeam.id] ?? [];
      const byId = new Map(previous.map((role) => [role.id, role]));
      const next = orderedIds.flatMap((id, index) => {
        const role = byId.get(id);
        return role ? [{ ...role, sortOrder: index }] : [];
      });
      if (next.length === 0) return false;

      setRolesByTeam((current) => ({
        ...current,
        [currentTeam.id]: next,
      }));
      try {
        await reorderTeamRoleRows(next.map((role) => role.id));
        return true;
      } catch (error) {
        console.error("Failed to reorder team roles", error);
        setRolesByTeam((current) => ({
          ...current,
          [currentTeam.id]: previous,
        }));
        return false;
      }
    },
    [currentTeam, rolesByTeam],
  );

  const renameTeamRole = useCallback(
    (roleId: string, name: string) => {
      if (!currentTeam) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      setRolesByTeam((current) => ({
        ...current,
        [currentTeam.id]: (current[currentTeam.id] ?? []).map((role) =>
          role.id === roleId && !role.isSystem ? { ...role, name: trimmed } : role,
        ),
      }));
      void updateTeamRoleRow(roleId, { name: trimmed }).catch((error) => {
        console.error("Failed to rename team role", error);
      });
    },
    [currentTeam],
  );

  const deleteTeamRole = useCallback(
    (roleId: string) => {
      if (!currentTeam) return false;
      const teamRoles = rolesByTeam[currentTeam.id] ?? [];
      const target = teamRoles.find((role) => role.id === roleId);
      if (!target || target.isSystem) return false;
      const fallback =
        teamRoles.find((role) => role.slug === MEMBER_TEAM_ROLE) ?? teamRoles[0];
      if (!fallback) return false;

      setRolesByTeam((current) => ({
        ...current,
        [currentTeam.id]: (current[currentTeam.id] ?? []).filter(
          (role) => role.id !== roleId,
        ),
      }));
      setMembersByTeam((current) => ({
        ...current,
        [currentTeam.id]: (current[currentTeam.id] ?? []).map((member) =>
          member.roleId === roleId
            ? { ...member, roleId: fallback.id, role: fallback.slug }
            : member,
        ),
      }));
      void deleteTeamRoleRow(roleId).catch((error) => {
        console.error("Failed to delete team role", error);
      });
      return true;
    },
    [currentTeam, rolesByTeam],
  );

  const assignMemberRole = useCallback(
    (memberId: string, roleId: string) => {
      if (!currentTeam) return;
      const teamRoles = rolesByTeam[currentTeam.id] ?? [];
      const role = teamRoles.find((item) => item.id === roleId);
      if (!role) return;

      setMembersByTeam((current) => ({
        ...current,
        [currentTeam.id]: (current[currentTeam.id] ?? []).map((member) =>
          member.id === memberId
            ? { ...member, roleId: role.id, role: role.slug }
            : member,
        ),
      }));
      void updateMemberRoleRow(memberId, roleId).catch((error) => {
        console.error("Failed to assign member role", error);
      });
    },
    [currentTeam, rolesByTeam],
  );

  const updateRolePermissions = useCallback(
    (roleId: string, permissions: TeamPermissionSet) => {
      if (!currentTeam) return;
      setRolesByTeam((current) => ({
        ...current,
        [currentTeam.id]: (current[currentTeam.id] ?? []).map((role) =>
          role.id === roleId ? { ...role, permissions } : role,
        ),
      }));
      void updateTeamRoleRow(roleId, { permissions }).catch((error) => {
        console.error("Failed to update role permissions", error);
      });
    },
    [currentTeam],
  );

  const value = useMemo(
    () => ({
      isReady,
      members,
      currentUser,
      teams,
      currentTeam,
      roles,
      inviteMember,
      refreshTeams,
      addTeam,
      updateTeam,
      deleteTeam,
      selectTeam,
      addTeamRole,
      reorderTeamRoles,
      renameTeamRole,
      deleteTeamRole,
      assignMemberRole,
      updateRolePermissions,
    }),
    [
      addTeam,
      addTeamRole,
      assignMemberRole,
      currentTeam,
      currentUser,
      deleteTeam,
      deleteTeamRole,
      inviteMember,
      refreshTeams,
      isReady,
      members,
      renameTeamRole,
      reorderTeamRoles,
      roles,
      selectTeam,
      teams,
      updateRolePermissions,
      updateTeam,
    ],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within TeamProvider");
  }
  return context;
}
