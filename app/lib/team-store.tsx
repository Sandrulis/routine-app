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
import { importLocalWorkIfNeeded, readStoredCurrentTeamId } from "@/app/lib/db/import-local-work";
import {
  deleteTeamRow,
  fetchUserTeams,
  insertMember,
  insertTeam,
  touchMemberOnline,
  updateTeamRow,
} from "@/app/lib/db/work-data";
import { clearLegacyDemoStorage } from "@/app/lib/clear-legacy-demo-storage";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import {
  TEAM_CHANGE_EVENT,
  createMemberId,
  createOwnerMember,
  createTeamId,
  currentTeamIdStorageKey,
  emptyTeamMember,
  getCurrentUser,
  initialsFromName,
  OWNER_TEAM_ROLE,
  toneForIndex,
  type MembersByTeam,
  type TeamMember,
  type WorkTeam,
} from "@/app/lib/team";
import { randomListColorId } from "@/app/lib/lists";

type InviteMemberInput = {
  name: string;
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
  inviteMember: (input: InviteMemberInput) => TeamMember;
  addTeam: (input: AddTeamInput) => WorkTeam;
  updateTeam: (teamId: string, input: AddTeamInput) => void;
  deleteTeam: (teamId: string) => boolean;
  selectTeam: (teamId: string) => void;
};

const TeamContext = createContext<TeamContextValue | null>(null);

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
      setLoadedScope(userId);
      setIsReady(true);
      return;
    }

    const owner = ownerFromAuth(authUser);
    let cancelled = false;

    void (async () => {
      try {
        await importLocalWorkIfNeeded(userId, owner);
        const { teams: nextTeams, membersByTeam: nextMembers } = await fetchUserTeams();
        if (cancelled) return;
        setTeams(nextTeams);
        setMembersByTeam(nextMembers);
        setCurrentTeamId(readStoredCurrentTeamId(userId, nextTeams.map((team) => team.id)));
      } catch (error) {
        console.error("Failed to load teams", error);
        if (!cancelled) {
          setTeams([]);
          setCurrentTeamId("");
          setMembersByTeam({});
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

  const inviteMember = useCallback(
    (input: InviteMemberInput) => {
      const member: TeamMember = {
        id: createMemberId(),
        name: input.name.trim(),
        email: input.email.trim(),
        role: input.role.trim(),
        initials: initialsFromName(input.name),
        toneClassName: toneForIndex(0),
        lastOnlineAt: null,
      };

      setMembersByTeam((current) => {
        if (!currentTeamId) return current;
        const list = current[currentTeamId] ?? [];
        member.toneClassName = toneForIndex(list.length);
        return {
          ...current,
          [currentTeamId]: [...list, member],
        };
      });
      void insertMember(currentTeamId, member).catch((error) => {
        console.error("Failed to invite member", error);
      });
      return member;
    },
    [currentTeamId],
  );

  useEffect(() => {
    if (!isReady || !currentTeamId) return;
    const userId = authUser?.id;
    if (!userId) return;

    function touchCurrentUser() {
      const seenAt = new Date().toISOString();
      setMembersByTeam((current) => {
        const list = current[currentTeamId] ?? [];
        const user = getCurrentUser(list, userId);
        if (!list.some((member) => member.id === user.id)) return current;
        void touchMemberOnline(user.id, seenAt).catch((error) => {
          console.error("Failed to update last online", error);
        });
        return {
          ...current,
          [currentTeamId]: list.map((member) =>
            member.id === user.id ? { ...member, lastOnlineAt: seenAt } : member,
          ),
        };
      });
    }

    touchCurrentUser();
    const timer = window.setInterval(touchCurrentUser, 20_000);
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
        toneClassName: fromTeam?.toneClassName ?? toneForIndex(0),
        lastOnlineAt: fromTeam?.lastOnlineAt ?? null,
        avatarUrl: display.avatarUrl,
      };
    }

    const base = emptyTeamMember();
    return currentTeam ? base : { ...base, role: "" };
  }, [authUser, currentTeam, members]);

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
      const ownerWithOnline = { ...owner, lastOnlineAt: new Date().toISOString() };

      if (authUser) {
        void insertTeam(team, ownerWithOnline, authUser.id)
          .then(() => {
            setTeams((current) => [...current, team]);
            setCurrentTeamId(team.id);
            setMembersByTeam((current) => ({
              ...current,
              [team.id]: [ownerWithOnline],
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
      void deleteTeamRow(teamId).catch((error) => {
        console.error("Failed to delete team", error);
      });
    }
    return removed;
  }, []);

  const selectTeam = useCallback((teamId: string) => {
    setCurrentTeamId(teamId);
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      members,
      currentUser,
      teams,
      currentTeam,
      inviteMember,
      addTeam,
      updateTeam,
      deleteTeam,
      selectTeam,
    }),
    [
      addTeam,
      currentTeam,
      currentUser,
      deleteTeam,
      inviteMember,
      isReady,
      members,
      selectTeam,
      teams,
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
