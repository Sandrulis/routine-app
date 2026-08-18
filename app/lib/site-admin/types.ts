import type { TeamPermissionSet } from "@/app/lib/team-permissions";

export type AdminUserTeamSummary = {
  id: string;
  name: string;
  role: string;
  logoUrl: string | null;
};

export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  registeredAt: string | null;
  lastSeenAt: string | null;
  languageCode: string | null;
  teams: AdminUserTeamSummary[];
};

export type AdminUserInput = {
  name: string;
  email: string;
  isAdmin: boolean;
};

export type AdminTeamSummary = {
  id: string;
  name: string;
  initials: string;
  icon: string | null;
  color: string;
  logoUrl: string | null;
  memberCount: number;
  createdAt: string;
};

export type AdminTeamMemberSummary = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  lastOnlineAt: string | null;
};

export type AdminTeamMembersTarget = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string;
  logoUrl?: string | null;
};

export type AdminTeamInput = {
  name: string;
  icon?: string | null;
  color?: string;
  logoUrl?: string | null;
};

export type SiteLanguageSummary = {
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
};

export type SiteLanguageInput = {
  code: string;
  name: string;
  isDefault?: boolean;
};

export type SiteTranslationSummary = {
  key: string;
  namespace: string;
  description: string;
  values: Record<string, string>;
  bundled: boolean;
};

export type SiteTranslationInput = {
  key: string;
  namespace: string;
  description: string;
  values: Record<string, string>;
};

export type SiteSettingsSummary = {
  systemName: string;
  sloganValues: Record<string, string>;
  updatedAt: string | null;
};

export type SiteSettingsInput = {
  systemName: string;
  sloganValues: Record<string, string>;
};

export type TaskStatusSummary = {
  id: string;
  labels: Record<string, string>;
  label: string;
  color: string;
  sortOrder: number;
  groupKey: string;
};

export type TaskStatusInput = {
  id: string;
  labels: Record<string, string>;
  color: string;
  groupKey: string;
};

export type SystemDefaultRoleSummary = {
  id: string;
  slug: string;
  labels: Record<string, string>;
  label: string;
  sortOrder: number;
  isSystem: boolean;
  permissions: TeamPermissionSet;
};

export type SystemDefaultRoleInput = {
  labels: Record<string, string>;
  permissions: TeamPermissionSet;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export type TranslationDictionary = Record<string, string>;
