import type { TeamPermissionSet } from "@/app/lib/team-permissions";
import type { SiteDisplayPreferences } from "@/app/lib/site-admin/display-preferences";

export type AdminUserTeamSummary = {
  id: string;
  name: string;
  role: string;
  logoUrl: string | null;
  isVip: boolean;
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
  paymentPlanId: string | null;
  paymentPlanUntil: string | null;
  paymentPlanPaid: boolean;
  paymentPlanIsTrial: boolean;
  paymentPlanIsEarlyBird: boolean;
  earlyBirdSeatCount: number;
  isVip: boolean;
};

export type AdminTeamPaymentPlanInput = {
  planId: string | null;
  until: string | null;
  paid: boolean;
  isTrial: boolean;
  isEarlyBird: boolean;
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
  isVip: boolean;
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
  legalEmail: string;
  legalEntityName: string;
  legalEntityRegNo: string;
  legalEntityAddress: string;
  sloganValues: Record<string, string>;
  timezone: string;
  displayPreferences: SiteDisplayPreferences;
  logoUrl: string | null;
  faviconUrl: string | null;
  logoColor: string;
  updatedAt: string | null;
};

export type SiteSettingsInput = {
  systemName: string;
  legalEmail: string;
  legalEntityName: string;
  legalEntityRegNo: string;
  legalEntityAddress: string;
  sloganValues: Record<string, string>;
  timezone: string;
  displayPreferences: SiteDisplayPreferences;
  logoUrl: string | null;
  faviconUrl: string | null;
  logoColor: string;
};

export type TaskStatusSummary = {
  id: string;
  labels: Record<string, string>;
  label: string;
  color: string;
  icon?: string | null;
  sortOrder: number;
  groupKey: string;
};

export type TaskStatusInput = {
  id: string;
  labels: Record<string, string>;
  color: string;
  icon?: string | null;
  groupKey: string;
};

export type FileTypeExtensionSummary = {
  extension: string;
  mimeType: string;
  icon: string;
  color: string;
  sortOrder: number;
};

export type FileTypeExtensionInput = {
  extension: string;
  mimeType: string;
  icon: string;
  color: string;
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

export type { ActionResult } from "@/app/lib/actions/action-result";

export type TranslationDictionary = Record<string, string>;
