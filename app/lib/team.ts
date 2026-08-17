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
};

export const CURRENT_USER_ID = "anna";
export const TEAM_STORAGE_KEY = "routine-app-team-members";
export const TEAM_CHANGE_EVENT = "routine-app-team-change";

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

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function demoLastOnlineAt(id: string, index: number): string | null {
  if (id === CURRENT_USER_ID) return new Date().toISOString();
  if (index === 1) return isoMinutesAgo(4);
  if (index === 2) return isoMinutesAgo(125);
  if (index === 3) return isoMinutesAgo(60 * 26);
  return isoMinutesAgo(18);
}

export function createDefaultMembers(): TeamMember[] {
  return [
    {
      id: "anna",
      name: "Anna Kalniņa",
      initials: "AK",
      role: "Projektu vadītāja",
      email: "anna@routine.app",
      toneClassName: toneForIndex(0),
      lastOnlineAt: demoLastOnlineAt("anna", 0),
    },
    {
      id: "janis",
      name: "Jānis Bērziņš",
      initials: "JB",
      role: "Izstrādātājs",
      email: "janis@routine.app",
      toneClassName: toneForIndex(1),
      lastOnlineAt: demoLastOnlineAt("janis", 1),
    },
    {
      id: "marta",
      name: "Marta Liepa",
      initials: "ML",
      role: "Dizainere",
      email: "marta@routine.app",
      toneClassName: toneForIndex(2),
      lastOnlineAt: demoLastOnlineAt("marta", 2),
    },
    {
      id: "kristaps",
      name: "Kristaps Ozols",
      initials: "KO",
      role: "Klienta atbalsts",
      email: "kristaps@routine.app",
      toneClassName: toneForIndex(3),
      lastOnlineAt: demoLastOnlineAt("kristaps", 3),
    },
  ];
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

export function createTeamId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `team-${crypto.randomUUID()}`;
  }
  return `team-${Date.now()}`;
}

export function createDefaultTeams(): WorkTeam[] {
  return [
    {
      id: DEFAULT_TEAM_ID,
      name: "Routine",
      initials: initialsFromName("Routine"),
      icon: null,
      color: DEFAULT_LIST_COLOR,
      logoUrl: null,
    },
  ];
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

export const TEAM_MEMBERS = createDefaultMembers();

export function getTeamMember(
  members: TeamMember[],
  id: string | null,
): TeamMember | null {
  if (!id) return null;
  return members.find((member) => member.id === id) ?? null;
}

export function getCurrentUser(members: TeamMember[]): TeamMember {
  return getTeamMember(members, CURRENT_USER_ID) ?? members[0] ?? TEAM_MEMBERS[0];
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
          : demoLastOnlineAt(id, index);

      if (!id || !name) return null;
      return { id, name, initials, role, email, toneClassName, lastOnlineAt };
    })
    .filter((item): item is TeamMember => item !== null);

  return members;
}
