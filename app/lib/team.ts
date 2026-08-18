import { isLegacyDemoMemberId } from "@/app/lib/clear-legacy-demo-storage";
import { MAX_STORED_FILE_BYTES } from "@/app/lib/list-files";
import { DEFAULT_LIST_COLOR } from "@/app/lib/lists";

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
  toneClassName: string;
  lastOnlineAt: string | null;
  avatarUrl?: string | null;
  userId?: string | null;
};

export const TEAM_STORAGE_KEY = "routine-app-team-members";
export const TEAM_CHANGE_EVENT = "routine-app-team-change";
export const OWNER_TEAM_ROLE = "owner";

export function teamRankLabel(
  role: string,
  t: (key: string, fallback: string) => string,
): string | null {
  const trimmed = role.trim();
  if (!trimmed) return null;
  if (trimmed === OWNER_TEAM_ROLE) {
    return t("teams.rank.owner", "Īpašnieks");
  }
  return trimmed;
}

const MEMBER_TONES = [
  "bg-sky-100 text-sky-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
];

export function createMemberId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `member-${crypto.randomUUID()}`;
  }
  return `member-${Date.now()}`;
}

export function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function toneForIndex(index: number): string {
  return MEMBER_TONES[index % MEMBER_TONES.length];
}

export function emptyTeamMember(): TeamMember {
  return {
    id: "",
    name: "",
    initials: "",
    role: "",
    email: "",
    toneClassName: toneForIndex(0),
    lastOnlineAt: null,
    avatarUrl: null,
    userId: null,
  };
}

export type WorkTeam = {
  id: string;
  name: string;
  initials: string;
  icon: string | null;
  color: string;
  logoUrl: string | null;
};

export const TEAMS_STORAGE_KEY = "routine-app-teams";
export const CURRENT_TEAM_ID_STORAGE_KEY = "routine-app-current-team-id";
export const DEFAULT_TEAM_ID = "team-routine";

export type MembersByTeam = Record<string, TeamMember[]>;

export function teamsStorageKey(userId: string | null): string {
  return userId ? `${TEAMS_STORAGE_KEY}:${userId}` : TEAMS_STORAGE_KEY;
}

export function membersStorageKey(userId: string | null): string {
  return userId ? `${TEAM_STORAGE_KEY}:${userId}` : TEAM_STORAGE_KEY;
}

export function createOwnerMember(input: {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}): TeamMember {
  const name = input.name.trim() || input.email.trim() || "User";
  return {
    id: input.id,
    name,
    initials: initialsFromName(name),
    role: OWNER_TEAM_ROLE,
    email: input.email.trim(),
    toneClassName: toneForIndex(0),
    lastOnlineAt: new Date().toISOString(),
    avatarUrl: input.avatarUrl ?? null,
    userId: input.id,
  };
}

export function currentTeamIdStorageKey(userId: string | null): string {
  return userId
    ? `${CURRENT_TEAM_ID_STORAGE_KEY}:${userId}`
    : CURRENT_TEAM_ID_STORAGE_KEY;
}

export function createTeamId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `team-${crypto.randomUUID()}`;
  }
  return `team-${Date.now()}`;
}


function isTeamLogoUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/");
}

export async function readTeamLogoUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/") || file.size <= 0 || file.size > MAX_STORED_FILE_BYTES) {
    return null;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function normalizeStoredTeams(value: unknown): WorkTeam[] | null {
  if (!Array.isArray(value)) return null;

  const teams = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("name" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const name = String(item.name).trim();
      if (!id || !name) return null;
      const initials =
        "initials" in item && typeof item.initials === "string" && item.initials
          ? item.initials
          : initialsFromName(name);
      const icon =
        "icon" in item && typeof item.icon === "string" && item.icon
          ? item.icon
          : null;
      const color =
        "color" in item && typeof item.color === "string" && item.color
          ? item.color
          : DEFAULT_LIST_COLOR;
      const logoUrl =
        "logoUrl" in item && isTeamLogoUrl(item.logoUrl) ? item.logoUrl : null;
      return { id, name, initials, icon, color, logoUrl };
    })
    .filter((item): item is WorkTeam => item !== null);

  return teams.length > 0 ? teams : null;
}

export function getTeamMember(
  members: TeamMember[],
  id: string | null,
): TeamMember | null {
  if (!id) return null;
  return (
    members.find((member) => member.id === id || member.userId === id) ?? null
  );
}

export function getCurrentUser(
  members: TeamMember[],
  userId?: string | null,
): TeamMember {
  if (!userId) return emptyTeamMember();
  return getTeamMember(members, userId) ?? emptyTeamMember();
}

export function normalizeStoredMembers(value: unknown): TeamMember[] | null {
  if (!Array.isArray(value)) return null;

  const members = value
    .map((item, index) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("name" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      if (isLegacyDemoMemberId(id)) return null;
      const name = String(item.name).trim();
      const role =
        "role" in item && typeof item.role === "string" ? item.role.trim() : "";
      const email =
        "email" in item && typeof item.email === "string" ? item.email.trim() : "";
      const initials =
        "initials" in item && typeof item.initials === "string" && item.initials
          ? item.initials
          : initialsFromName(name);
      const toneClassName =
        "toneClassName" in item && typeof item.toneClassName === "string"
          ? item.toneClassName
          : toneForIndex(index);

      const lastOnlineAt =
        "lastOnlineAt" in item && typeof item.lastOnlineAt === "string"
          ? item.lastOnlineAt
          : null;

      const avatarUrl =
        "avatarUrl" in item &&
        typeof item.avatarUrl === "string" &&
        (item.avatarUrl.startsWith("http") ||
          item.avatarUrl.startsWith("data:image/"))
          ? item.avatarUrl
          : null;

      if (!id || !name) return null;
      const member: TeamMember = {
        id,
        name,
        initials,
        role,
        email,
        toneClassName,
        lastOnlineAt,
        ...(avatarUrl ? { avatarUrl } : {}),
      };
      return member;
    })
    .filter((item): item is TeamMember => item !== null);

  return members;
}

export function normalizeStoredMembersByTeam(
  value: unknown,
): MembersByTeam | null {
  if (Array.isArray(value)) {
    const members = normalizeStoredMembers(value);
    return members && members.length > 0
      ? { [DEFAULT_TEAM_ID]: members }
      : null;
  }

  if (typeof value !== "object" || value === null) return null;

  const next: MembersByTeam = {};
  for (const [teamId, raw] of Object.entries(value)) {
    const members = normalizeStoredMembers(raw);
    if (teamId && members && members.length > 0) {
      next[teamId] = members;
    }
  }

  return Object.keys(next).length > 0 ? next : null;
}
