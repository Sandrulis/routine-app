"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENT_TEAM_ID_STORAGE_KEY,
  DEFAULT_TEAM_ID,
  TEAM_CHANGE_EVENT,
  TEAM_STORAGE_KEY,
  TEAMS_STORAGE_KEY,
  createDefaultMembers,
  createDefaultTeams,
  createMemberId,
  createTeamId,
  getCurrentUser,
  initialsFromName,
  normalizeStoredMembers,
  normalizeStoredTeams,
  toneForIndex,
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
  currentTeam: WorkTeam;
  inviteMember: (input: InviteMemberInput) => TeamMember;
  addTeam: (input: AddTeamInput) => WorkTeam;
  updateTeam: (teamId: string, input: AddTeamInput) => void;
  deleteTeam: (teamId: string) => boolean;
  selectTeam: (teamId: string) => void;
};

const TeamContext = createContext<TeamContextValue | null>(null);

function persistMembers(members: TeamMember[]) {
  window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
  window.dispatchEvent(new Event(TEAM_CHANGE_EVENT));
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const loadedFromStorage = useRef(false);
  const [members, setMembers] = useState<TeamMember[]>(createDefaultMembers);
  const [teams, setTeams] = useState<WorkTeam[]>(createDefaultTeams);
  const [currentTeamId, setCurrentTeamId] = useState(DEFAULT_TEAM_ID);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loadedFromStorage.current) return;
    loadedFromStorage.current = true;

    try {
      const storedValue = window.localStorage.getItem(TEAM_STORAGE_KEY);
      const storedMembers = storedValue
        ? normalizeStoredMembers(JSON.parse(storedValue))
        : null;
      setMembers(storedMembers ?? createDefaultMembers());

      const storedTeamsValue = window.localStorage.getItem(TEAMS_STORAGE_KEY);
      const storedTeams = storedTeamsValue
        ? normalizeStoredTeams(JSON.parse(storedTeamsValue))
        : null;
      const nextTeams = storedTeams ?? createDefaultTeams();
      setTeams(nextTeams);

      const storedTeamId = window.localStorage.getItem(CURRENT_TEAM_ID_STORAGE_KEY);
      setCurrentTeamId(
        storedTeamId && nextTeams.some((team) => team.id === storedTeamId)
          ? storedTeamId
          : (nextTeams[0]?.id ?? DEFAULT_TEAM_ID),
      );
    } catch {
      setMembers(createDefaultMembers());
      setTeams(createDefaultTeams());
      setCurrentTeamId(DEFAULT_TEAM_ID);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    persistMembers(members);
  }, [isReady, members]);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    window.localStorage.setItem(CURRENT_TEAM_ID_STORAGE_KEY, currentTeamId);
  }, [currentTeamId, isReady, teams]);

  const inviteMember = useCallback((input: InviteMemberInput) => {
    const member: TeamMember = {
      id: createMemberId(),
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role.trim(),
      initials: initialsFromName(input.name),
      toneClassName: toneForIndex(0),
      lastOnlineAt: null,
    };

    setMembers((current) => {
      member.toneClassName = toneForIndex(current.length);
      return [...current, member];
    });
    return member;
  }, []);

  useEffect(() => {
    if (!isReady) return;

    function touchCurrentUser() {
      const seenAt = new Date().toISOString();
      setMembers((current) => {
        const user = getCurrentUser(current);
        if (!user) return current;
        return current.map((member) =>
          member.id === user.id ? { ...member, lastOnlineAt: seenAt } : member,
        );
      });
    }

    touchCurrentUser();
    const timer = window.setInterval(touchCurrentUser, 20_000);
    return () => window.clearInterval(timer);
  }, [isReady]);

  const currentUser = useMemo(() => getCurrentUser(members), [members]);

  const currentTeam = useMemo(
    () =>
      teams.find((team) => team.id === currentTeamId) ??
      teams[0] ??
      createDefaultTeams()[0],
    [currentTeamId, teams],
  );

  const addTeam = useCallback((input: AddTeamInput) => {
    const trimmed = input.name.trim();
    const team: WorkTeam = {
      id: createTeamId(),
      name: trimmed,
      initials: initialsFromName(trimmed),
      icon: input.icon ?? null,
      color: input.color ?? randomListColorId(),
      logoUrl: input.logoUrl ?? null,
    };

    setTeams((current) => [...current, team]);
    setCurrentTeamId(team.id);
    return team;
  }, []);

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
        id === teamId ? (next[0]?.id ?? DEFAULT_TEAM_ID) : id,
      );
      return next;
    });
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
