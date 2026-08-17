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
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import {
  CURRENT_USER_ID,
  DEFAULT_TEAM_ID,
  TEAM_CHANGE_EVENT,
  createDefaultMembers,
  createDefaultTeams,
  createMemberId,
  createOwnerMember,
  createTeamId,
  currentTeamIdStorageKey,
  getCurrentUser,
  initialsFromName,
  membersStorageKey,
  normalizeStoredMembersByTeam,
  normalizeStoredTeams,
  OWNER_TEAM_ROLE,
  teamsStorageKey,
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

function withOwnerOnTeams(
  teams: WorkTeam[],
  membersByTeam: MembersByTeam,
  owner: TeamMember,
): MembersByTeam {
  const next = { ...membersByTeam };
  for (const team of teams) {
    if (!next[team.id] || next[team.id].length === 0) {
      next[team.id] = [{ ...owner }];
    }
  }
  return next;
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

    const userId = authUser?.id ?? null;
    setIsReady(false);
    const nextTeamsKey = teamsStorageKey(userId);
    const nextTeamIdKey = currentTeamIdStorageKey(userId);
    const nextMembersKey = membersStorageKey(userId);

    try {
      const storedTeamsValue = window.localStorage.getItem(nextTeamsKey);
      const storedTeams = storedTeamsValue
        ? normalizeStoredTeams(JSON.parse(storedTeamsValue))
        : null;
      const nextTeams = storedTeams ?? (userId ? [] : createDefaultTeams());
      setTeams(nextTeams);

      const storedTeamId = window.localStorage.getItem(nextTeamIdKey);
      setCurrentTeamId(
        storedTeamId && nextTeams.some((team) => team.id === storedTeamId)
          ? storedTeamId
          : (nextTeams[0]?.id ?? ""),
      );

      const storedMembersValue = window.localStorage.getItem(nextMembersKey);
      const storedMembers = storedMembersValue
        ? normalizeStoredMembersByTeam(JSON.parse(storedMembersValue))
        : null;

      if (userId && authUser) {
        setMembersByTeam(
          withOwnerOnTeams(
            nextTeams,
            storedMembers ?? {},
            ownerFromAuth(authUser),
          ),
        );
      } else {
        setMembersByTeam(
          storedMembers ?? { [DEFAULT_TEAM_ID]: createDefaultMembers() },
        );
      }
    } catch {
      setTeams(userId ? [] : createDefaultTeams());
      setCurrentTeamId(userId ? "" : DEFAULT_TEAM_ID);
      setMembersByTeam(
        userId && authUser
          ? {}
          : { [DEFAULT_TEAM_ID]: createDefaultMembers() },
      );
    } finally {
      setLoadedScope(userId);
      setIsReady(true);
    }
  }, [authReady, authUser]);

  useEffect(() => {
    if (!isReady) return;
    const userId = authUser?.id ?? null;
    if (loadedScope !== userId) return;
    window.localStorage.setItem(
      membersStorageKey(userId),
      JSON.stringify(membersByTeam),
    );
    window.dispatchEvent(new Event(TEAM_CHANGE_EVENT));
  }, [authUser?.id, isReady, loadedScope, membersByTeam]);

  useEffect(() => {
    if (!isReady) return;
    const userId = authUser?.id ?? null;
    if (loadedScope !== userId) return;
    window.localStorage.setItem(teamsStorageKey(userId), JSON.stringify(teams));
    window.localStorage.setItem(currentTeamIdStorageKey(userId), currentTeamId);
  }, [authUser?.id, currentTeamId, isReady, loadedScope, teams]);

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
      return member;
    },
    [currentTeamId],
  );

  useEffect(() => {
    if (!isReady || !currentTeamId) return;
    const userId = authUser?.id ?? CURRENT_USER_ID;

    function touchCurrentUser() {
      const seenAt = new Date().toISOString();
      setMembersByTeam((current) => {
        const list = current[currentTeamId] ?? [];
        const user = getCurrentUser(list, userId);
        if (!list.some((member) => member.id === user.id)) return current;
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
    const next = list.map((member) =>
      member.id === overlayId
        ? {
            ...member,
            name: display.name || member.name,
            email: display.email || member.email,
            initials: initialsFromName(display.name || member.name),
            avatarUrl: display.avatarUrl ?? member.avatarUrl,
            role: member.role || OWNER_TEAM_ROLE,
          }
        : member,
    );

    const selfIndex = next.findIndex((member) => member.id === overlayId);
    if (selfIndex > 0) {
      const [self] = next.splice(selfIndex, 1);
      next.unshift(self);
    }
    return next;
  }, [authUser, currentTeam, membersByTeam]);

  const currentUser = useMemo(() => {
    if (authUser) {
      const display = mapUserDisplay(authUser);
      const fromTeam = members.find((member) => member.id === authUser.id);
      const name = display.name || fromTeam?.name || "";
      return {
        id: authUser.id,
        name,
        email: display.email || fromTeam?.email || "",
        initials: initialsFromName(name),
        role: currentTeam ? fromTeam?.role || OWNER_TEAM_ROLE : "",
        toneClassName: fromTeam?.toneClassName ?? toneForIndex(0),
        lastOnlineAt: fromTeam?.lastOnlineAt ?? null,
        avatarUrl: display.avatarUrl,
      };
    }

    const base = getCurrentUser(members);
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
            ...getCurrentUser(members),
            role: OWNER_TEAM_ROLE,
          };

      setTeams((current) => [...current, team]);
      setCurrentTeamId(team.id);
      setMembersByTeam((current) => ({
        ...current,
        [team.id]: [{ ...owner, lastOnlineAt: new Date().toISOString() }],
      }));
      return team;
    },
    [authUser, members],
  );

  const updateTeam = useCallback((teamId: string, input: AddTeamInput) => {
    const trimmed = input.name.trim();
    setTeams((current) =>
      current.map((team) =>
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
      ),
    );
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
