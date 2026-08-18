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

export type ActionResult = { ok: true } | { ok: false; error: string };

export type TranslationDictionary = Record<string, string>;
