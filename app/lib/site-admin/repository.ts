import { randomBytes } from "crypto";
import { cache } from "react";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient as createUserServerClient } from "@/app/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/app/lib/supabase/env";
import { DEFAULT_SYSTEM_NAME } from "@/app/lib/document-title";
import { allMessages as messages, type LanguageCode } from "@/app/lib/i18n/all-messages";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  NATIVE_LANGUAGE_NAMES,
} from "@/app/lib/i18n/language";
import {
  createMemberId,
  createOwnerMember,
  createTeamId,
  initialsFromName,
  MEMBER_TEAM_ROLE,
  OWNER_TEAM_ROLE,
} from "@/app/lib/team";
import { DEFAULT_LIST_COLOR, randomListColorId } from "@/app/lib/lists";
import { groupWouldBeEmpty, isSingletonStatusGroup } from "@/app/lib/list-statuses";
import {
  isValidFileColorInput,
  isValidFileExtensionInput,
  isValidFileIconInput,
  normalizeFileExtension,
} from "@/app/lib/file-types";
import {
  createFullTeamPermissions,
  normalizeTeamPermissionSet,
} from "@/app/lib/team-permissions";
import {
  DEFAULT_SITE_LOGO_COLOR,
  normalizeBrandImageUrl,
  normalizeSiteLogoColor,
} from "@/app/lib/site-admin/branding";
import {
  DEFAULT_SITE_DISPLAY_PREFERENCES,
  normalizeDateFormat,
  normalizeDateSeparator,
  normalizeSiteDisplayPreferences,
  normalizeTimeFormat,
  normalizeWeekStartDay,
} from "@/app/lib/site-admin/display-preferences";
import type {
  ActionResult,
  AdminTeamInput,
  AdminTeamMemberSummary,
  AdminTeamSummary,
  AdminUserInput,
  AdminUserSummary,
  SiteLanguageInput,
  SiteLanguageSummary,
  SiteSettingsInput,
  SiteSettingsSummary,
  SiteTranslationInput,
  SiteTranslationSummary,
  TaskStatusInput,
  TaskStatusSummary,
  TranslationDictionary,
  SystemDefaultRoleInput,
  SystemDefaultRoleSummary,
  FileTypeExtensionInput,
  FileTypeExtensionSummary,
} from "@/app/lib/site-admin/types";

const LANGUAGE_CODE_RE = /^[a-z]{2}(-[A-Z]{2})?$/;
const TRANSLATION_KEY_RE = /^[a-zA-Z0-9_.:-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  is_admin: boolean;
  created_at: string | null;
  language_code: string | null;
};

type TeamMemberListRow = {
  user_id: string | null;
  team_id: string;
  role: string;
  last_online_at: string | null;
};

type TeamMemberDetailRow = {
  id: string;
  user_id: string | null;
  email: string;
  name: string;
  role: string;
  avatar_url: string | null;
  last_online_at: string | null;
};

type TeamListRow = {
  id: string;
  name: string;
  logo_url: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  initials: string;
  icon: string | null;
  color: string;
  logo_url: string | null;
  created_at: string;
};

type LanguageRow = {
  code: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
};

type TranslationRow = {
  translation_key: string;
  namespace: string;
  description: string;
  values: Record<string, unknown> | null;
};

type SettingsRow = {
  system_name: string;
  legal_email: string | null;
  slogan: string;
  slogan_values: Record<string, unknown> | null;
  week_start_day: string | null;
  date_format: string | null;
  date_separator: string | null;
  time_format: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  logo_color: string | null;
  updated_at: string | null;
};

function dbNotConfigured(): ActionResult {
  return { ok: false, error: "errors.db_not_configured" };
}

async function getSessionClient() {
  return createUserServerClient();
}

function requireConfiguredDb(): ActionResult | null {
  return isSupabaseConfigured() ? null : dbNotConfigured();
}

function normalizeLanguageCode(code: string): string {
  return code.trim();
}

function normalizeTranslationKey(key: string): string {
  return key.trim();
}

function asStringRecord(value: Record<string, unknown> | null | undefined): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      typeof entry === "string" ? entry : "",
    ]),
  );
}

function mapLanguage(row: LanguageRow): SiteLanguageSummary {
  return {
    code: row.code,
    name: row.name,
    isActive: row.is_active === true,
    isDefault: row.is_default === true,
    sortOrder: row.sort_order,
  };
}

function namespaceFromKey(key: string): string {
  const dot = key.indexOf(".");
  return dot === -1 ? key : key.slice(0, dot);
}

function bundledKeys(): string[] {
  return Object.keys(messages.lv);
}

export const listAdminUsers = cache(async function listAdminUsers(): Promise<AdminUserSummary[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await getSessionClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, avatar, is_admin, created_at, language_code")
    .order("name", { ascending: true });

  if (error) {
    console.error("listAdminUsers failed:", error.message);
    return [];
  }

  const [{ data: memberships }, { data: teams }] = await Promise.all([
    supabase
      .from("team_members")
      .select("user_id, team_id, role, last_online_at"),
    supabase.from("teams").select("id, name, logo_url"),
  ]);

  const teamById = new Map(
    ((teams ?? []) as TeamListRow[]).map((team) => [team.id, team]),
  );
  const teamsByUser = new Map<string, AdminUserSummary["teams"]>();
  const lastOnlineByUser = new Map<string, string>();
  for (const row of (memberships ?? []) as TeamMemberListRow[]) {
    if (!row.user_id) continue;
    const team = teamById.get(row.team_id);
    if (team) {
      const list = teamsByUser.get(row.user_id) ?? [];
      list.push({
        id: team.id,
        name: team.name,
        role: row.role,
        logoUrl: team.logo_url,
      });
      teamsByUser.set(row.user_id, list);
    }
    if (row.last_online_at) {
      const current = lastOnlineByUser.get(row.user_id);
      if (!current || row.last_online_at > current) {
        lastOnlineByUser.set(row.user_id, row.last_online_at);
      }
    }
  }

  return ((data ?? []) as UserRow[]).map((row) => {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      isAdmin: row.is_admin === true,
      registeredAt: row.created_at,
      lastSeenAt: lastOnlineByUser.get(row.id) ?? null,
      languageCode: row.language_code,
      teams: teamsByUser.get(row.id) ?? [],
    };
  });
});

export async function createAdminUser(input: AdminUserInput): Promise<ActionResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) {
    return { ok: false, error: "errors.name_required" };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "errors.email_invalid" };
  }
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const supabase = createAdminClient();
  const password = randomBytes(24).toString("base64url");
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, full_name: name },
  });

  if (error || !data.user) {
    const message = (error?.message ?? "").toLowerCase();
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      return { ok: false, error: "errors.user_exists" };
    }
    return { ok: false, error: "errors.user_create_failed" };
  }

  const userId = data.user.id;
  const { error: insertError } = await supabase.from("users").insert({
    id: userId,
    email,
    name,
    avatar: "",
    is_admin: false,
  });

  if (insertError) {
    await supabase.auth.admin.deleteUser(userId);
    return { ok: false, error: "errors.user_profile_failed" };
  }

  if (input.isAdmin) {
    const { error: adminError } = await supabase
      .from("users")
      .update({ is_admin: true })
      .eq("id", userId);
    if (adminError) {
      return { ok: false, error: "errors.user_admin_status_failed" };
    }
  }

  return { ok: true };
}

export async function updateAdminUser(
  userId: string,
  input: AdminUserInput,
  actorUserId: string,
): Promise<ActionResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) {
    return { ok: false, error: "errors.name_required" };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "errors.email_invalid" };
  }
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const users = await listAdminUsers();
  const current = users.find((user) => user.id === userId);
  if (!current) {
    return { ok: false, error: "errors.user_not_found" };
  }

  const adminCount = users.filter((user) => user.isAdmin).length;
  if (current.isAdmin && !input.isAdmin && adminCount <= 1) {
    return { ok: false, error: "errors.last_admin" };
  }
  if (userId === actorUserId && !input.isAdmin) {
    return { ok: false, error: "errors.self_admin_remove" };
  }

  const supabase = createAdminClient();
  if (email !== current.email) {
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      email,
      user_metadata: { name, full_name: name },
    });
    if (authError) {
      return { ok: false, error: "errors.email_update_failed" };
    }
  } else {
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { name, full_name: name },
    });
  }

  const { error } = await supabase
    .from("users")
    .update({ name, email, is_admin: input.isAdmin })
    .eq("id", userId);

  if (error) {
    return { ok: false, error: "errors.user_save_failed" };
  }

  return { ok: true };
}

export async function deleteAdminUser(
  userId: string,
  actorUserId: string,
): Promise<ActionResult> {
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }
  if (userId === actorUserId) {
    return { ok: false, error: "errors.self_delete" };
  }

  const users = await listAdminUsers();
  const current = users.find((user) => user.id === userId);
  if (!current) {
    return { ok: false, error: "errors.user_not_found" };
  }
  if (current.isAdmin && users.filter((user) => user.isAdmin).length <= 1) {
    return { ok: false, error: "errors.last_admin" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return { ok: false, error: "errors.user_delete_failed" };
  }

  return { ok: true };
}

export const listAdminTeams = cache(async function listAdminTeams(): Promise<AdminTeamSummary[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await getSessionClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name, initials, icon, color, logo_url, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listAdminTeams failed:", error.message);
    return [];
  }

  const { data: members } = await supabase.from("team_members").select("team_id");
  const counts = new Map<string, number>();
  for (const row of members ?? []) {
    const teamId = (row as { team_id: string }).team_id;
    counts.set(teamId, (counts.get(teamId) ?? 0) + 1);
  }

  return ((teams ?? []) as TeamRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    initials: row.initials,
    icon: row.icon,
    color: row.color,
    logoUrl: row.logo_url,
    memberCount: counts.get(row.id) ?? 0,
    createdAt: row.created_at,
  }));
});

export const listAdminTeamMembers = cache(async function listAdminTeamMembers(
  teamId: string,
): Promise<AdminTeamMemberSummary[]> {
  if (!isSupabaseConfigured() || !teamId.trim()) {
    return [];
  }

  const supabase = await getSessionClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, user_id, email, name, role, avatar_url, last_online_at")
    .eq("team_id", teamId)
    .order("name", { ascending: true });

  if (error) {
    console.error("listAdminTeamMembers failed:", error.message);
    return [];
  }

  return ((data ?? []) as TeamMemberDetailRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url,
    lastOnlineAt: row.last_online_at,
  }));
});

export async function createAdminTeam(
  input: AdminTeamInput,
  createdBy: { id: string; name: string; email: string; avatarUrl?: string | null },
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "errors.team_name_required" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const teamId = createTeamId();
  const color = input.color?.trim() || randomListColorId();
  const { error: teamError } = await supabase.from("teams").insert({
    id: teamId,
    name,
    initials: initialsFromName(name),
    icon: input.icon ?? null,
    color,
    logo_url: input.logoUrl ?? null,
    created_by: createdBy.id,
  });

  if (teamError) {
    return { ok: false, error: "errors.team_create_failed" };
  }

  const owner = createOwnerMember({
    id: createdBy.id,
    name: createdBy.name,
    email: createdBy.email,
    avatarUrl: createdBy.avatarUrl,
  });

  const { error: memberError } = await supabase.from("team_members").insert({
    id: createMemberId(),
    team_id: teamId,
    user_id: createdBy.id,
    email: owner.email,
    name: owner.name,
    role: owner.role,
    tone_class_name: owner.toneClassName,
    avatar_url: owner.avatarUrl ?? null,
    last_online_at: owner.lastOnlineAt,
  });

  if (memberError) {
    await supabase.from("teams").delete().eq("id", teamId);
    return { ok: false, error: "errors.team_owner_failed" };
  }

  return { ok: true };
}

export async function updateAdminTeam(
  teamId: string,
  input: AdminTeamInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "errors.team_name_required" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { error } = await supabase
    .from("teams")
    .update({
      name,
      initials: initialsFromName(name),
      icon: input.icon ?? null,
      color: input.color?.trim() || DEFAULT_LIST_COLOR,
      logo_url: input.logoUrl ?? null,
    })
    .eq("id", teamId);

  if (error) {
    return { ok: false, error: "errors.team_save_failed" };
  }

  return { ok: true };
}

export async function deleteAdminTeam(teamId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) {
    return { ok: false, error: "errors.team_delete_failed" };
  }

  return { ok: true };
}

const FALLBACK_LANGUAGES: SiteLanguageSummary[] = LANGUAGE_CODES.map(
  (code, index) => ({
    code,
    name: NATIVE_LANGUAGE_NAMES[code],
    isActive: true,
    isDefault: code === DEFAULT_LANGUAGE,
    sortOrder: (index + 1) * 10,
  }),
);

export const listSiteLanguages = cache(async function listSiteLanguages(): Promise<SiteLanguageSummary[]> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_LANGUAGES;
  }

  const supabase = await getSessionClient();
  const { data, error } = await supabase
    .from("site_languages")
    .select("code, name, is_active, is_default, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as LanguageRow[]).map(mapLanguage);
});

export async function createSiteLanguage(input: SiteLanguageInput): Promise<ActionResult> {
  const code = normalizeLanguageCode(input.code);
  const name = input.name.trim();

  if (!LANGUAGE_CODE_RE.test(code)) {
    return { ok: false, error: "errors.language_code_invalid" };
  }
  if (!name) {
    return { ok: false, error: "errors.language_name_required" };
  }
  const missing = requireConfiguredDb();
  if (missing) return missing;

  const supabase = await getSessionClient();
  const { data: existing } = await supabase
    .from("site_languages")
    .select("code")
    .eq("code", code)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "errors.language_exists" };
  }

  const languages = await listSiteLanguages();
  const nextSortOrder = Math.max(0, ...languages.map((language) => language.sortOrder)) + 10;

  if (input.isDefault) {
    await supabase.from("site_languages").update({ is_default: false }).eq("is_default", true);
  }

  const { error } = await supabase.from("site_languages").insert({
    code,
    name,
    is_active: true,
    is_default: input.isDefault === true,
    sort_order: nextSortOrder,
  });

  if (error) {
    return { ok: false, error: "errors.language_create_failed" };
  }

  return { ok: true };
}

export async function updateSiteLanguageName(code: string, name: string): Promise<ActionResult> {
  const normalizedCode = normalizeLanguageCode(code);
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: "errors.language_name_required" };
  }
  const missing = requireConfiguredDb();
  if (missing) return missing;

  const supabase = await getSessionClient();
  const { error } = await supabase
    .from("site_languages")
    .update({ name: trimmedName })
    .eq("code", normalizedCode);

  if (error) {
    return { ok: false, error: "errors.language_save_failed" };
  }

  return { ok: true };
}

export async function updateSiteLanguageActiveStatus(
  code: string,
  isActive: boolean,
): Promise<ActionResult> {
  const normalizedCode = normalizeLanguageCode(code);
  const missing = requireConfiguredDb();
  if (missing) return missing;

  const supabase = await getSessionClient();
  const { data: language } = await supabase
    .from("site_languages")
    .select("code, is_default")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!language) {
    return { ok: false, error: "errors.language_not_found" };
  }
  if (!isActive && language.is_default === true) {
    return { ok: false, error: "site_languages.feedback.default_cannot_deactivate" };
  }

  const { error } = await supabase
    .from("site_languages")
    .update({ is_active: isActive })
    .eq("code", normalizedCode);

  if (error) {
    return { ok: false, error: "errors.language_status_failed" };
  }

  return { ok: true };
}

export async function setDefaultSiteLanguage(code: string): Promise<ActionResult> {
  const normalizedCode = normalizeLanguageCode(code);
  const missing = requireConfiguredDb();
  if (missing) return missing;

  const supabase = await getSessionClient();
  const { data: language } = await supabase
    .from("site_languages")
    .select("code")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!language) {
    return { ok: false, error: "errors.language_not_found" };
  }

  await supabase.from("site_languages").update({ is_default: false }).eq("is_default", true);
  const { error } = await supabase
    .from("site_languages")
    .update({ is_default: true, is_active: true })
    .eq("code", normalizedCode);

  if (error) {
    return { ok: false, error: "errors.language_default_failed" };
  }

  return { ok: true };
}

async function migrateTranslationLanguageCode(
  supabase: Awaited<ReturnType<typeof getSessionClient>>,
  fromCode: string,
) {
  const { data } = await supabase
    .from("site_translations")
    .select("translation_key, values");

  for (const row of (data ?? []) as Pick<TranslationRow, "translation_key" | "values">[]) {
    const values = asStringRecord(row.values as Record<string, unknown> | null);
    if (!(fromCode in values)) {
      continue;
    }
    delete values[fromCode];
    await supabase
      .from("site_translations")
      .update({ values })
      .eq("translation_key", row.translation_key);
  }
}

export async function deleteSiteLanguage(code: string): Promise<ActionResult> {
  const normalizedCode = normalizeLanguageCode(code);
  const missing = requireConfiguredDb();
  if (missing) return missing;

  const supabase = await getSessionClient();
  const { data: language } = await supabase
    .from("site_languages")
    .select("code, is_default")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!language) {
    return { ok: false, error: "errors.language_not_found" };
  }
  if (language.is_default === true) {
    return { ok: false, error: "site_languages.delete.default_disabled" };
  }

  await migrateTranslationLanguageCode(supabase, normalizedCode);
  const { error } = await supabase.from("site_languages").delete().eq("code", normalizedCode);
  if (error) {
    return { ok: false, error: "errors.language_delete_failed" };
  }

  return { ok: true };
}

function bundledValues(key: string): Record<string, string> {
  return Object.fromEntries(
    (Object.keys(messages) as LanguageCode[]).map((code) => [
      code,
      messages[code][key] ?? "",
    ]),
  );
}

export const listSiteTranslations = cache(async function listSiteTranslations(): Promise<SiteTranslationSummary[]> {
  const languages = await listSiteLanguages();
  const languageCodes = languages.map((language) => language.code);
  const dbRows = new Map<string, TranslationRow>();

  if (isSupabaseConfigured()) {
    const supabase = await getSessionClient();
    const { data } = await supabase
      .from("site_translations")
      .select("translation_key, namespace, description, values")
      .order("translation_key", { ascending: true });

    for (const row of (data ?? []) as TranslationRow[]) {
      dbRows.set(row.translation_key, row);
    }
  }

  const keys = new Set([...bundledKeys(), ...dbRows.keys()]);
  return [...keys]
    .sort((left, right) => left.localeCompare(right))
    .map((key) => {
      const row = dbRows.get(key);
      const bundled = bundledValues(key);
      const stored = asStringRecord(row?.values ?? null);
      const values = Object.fromEntries(
        languageCodes.map((code) => [code, stored[code] ?? bundled[code] ?? ""]),
      );

      return {
        key,
        namespace: row?.namespace || namespaceFromKey(key),
        description: row?.description ?? "",
        values,
        bundled: key in messages.lv,
      };
    });
});

export async function createSiteTranslation(input: SiteTranslationInput): Promise<ActionResult> {
  const key = normalizeTranslationKey(input.key);
  if (!TRANSLATION_KEY_RE.test(key)) {
    return { ok: false, error: "errors.translation_key_invalid" };
  }
  const missing = requireConfiguredDb();
  if (missing) return missing;

  const supabase = await getSessionClient();
  const { error } = await supabase.from("site_translations").insert({
    translation_key: key,
    namespace: input.namespace.trim() || namespaceFromKey(key),
    description: input.description.trim(),
    values: input.values,
  });

  if (error) {
    const message = error.message.toLowerCase();
    return {
      ok: false,
      error:
        message.includes("duplicate") || message.includes("already")
          ? "errors.translation_exists"
          : "errors.translation_create_failed",
    };
  }

  return { ok: true };
}

export async function updateSiteTranslation(
  currentKey: string,
  input: SiteTranslationInput,
): Promise<ActionResult> {
  const oldKey = normalizeTranslationKey(currentKey);
  const nextKey = normalizeTranslationKey(input.key);
  if (!TRANSLATION_KEY_RE.test(nextKey)) {
    return { ok: false, error: "errors.translation_key_invalid" };
  }
  const missing = requireConfiguredDb();
  if (missing) return missing;

  const supabase = await getSessionClient();
  if (oldKey !== nextKey) {
    const { data: existing } = await supabase
      .from("site_translations")
      .select("translation_key")
      .eq("translation_key", nextKey)
      .maybeSingle();
    if (existing) {
      return { ok: false, error: "errors.translation_exists" };
    }
  }

  const payload = {
    translation_key: nextKey,
    namespace: input.namespace.trim() || namespaceFromKey(nextKey),
    description: input.description.trim(),
    values: input.values,
  };

  const { data: current } = await supabase
    .from("site_translations")
    .select("translation_key")
    .eq("translation_key", oldKey)
    .maybeSingle();

  const { error } = current
    ? await supabase.from("site_translations").update(payload).eq("translation_key", oldKey)
    : await supabase.from("site_translations").insert(payload);

  if (error) {
    return { ok: false, error: "errors.translation_save_failed" };
  }

  return { ok: true };
}

export async function deleteSiteTranslation(key: string): Promise<ActionResult> {
  const normalizedKey = normalizeTranslationKey(key);
  if (!normalizedKey) {
    return { ok: false, error: "errors.translation_missing" };
  }
  const missing = requireConfiguredDb();
  if (missing) return missing;

  const supabase = await getSessionClient();
  const { error } = await supabase
    .from("site_translations")
    .delete()
    .eq("translation_key", normalizedKey);

  if (error) {
    return { ok: false, error: "errors.translation_delete_failed" };
  }

  return { ok: true };
}

export async function getSiteTranslationDictionary(
  languageCode: string,
): Promise<TranslationDictionary> {
  if (!isSupabaseConfigured()) {
    return {};
  }

  const languages = await listSiteLanguages();
  const defaultCode = languages.find((language) => language.isDefault)?.code ?? "lv";
  const supabase = await getSessionClient();
  const { data } = await supabase
    .from("site_translations")
    .select("translation_key, values");

  return Object.fromEntries(
    ((data ?? []) as TranslationRow[]).map((row) => {
      const values = asStringRecord(row.values);
      const active = values[languageCode]?.trim();
      const fallback = values[defaultCode]?.trim();
      return [row.translation_key, active || fallback || ""];
    }).filter(([, value]) => value.length > 0),
  );
}

function readDisplayPreferences(row: SettingsRow) {
  return {
    weekStartDay: normalizeWeekStartDay(row.week_start_day),
    dateFormat: normalizeDateFormat(row.date_format),
    dateSeparator: normalizeDateSeparator(row.date_separator),
    timeFormat: normalizeTimeFormat(row.time_format),
  };
}

export const getSiteSettings = cache(async function getSiteSettings(): Promise<SiteSettingsSummary> {
  const fallback: SiteSettingsSummary = {
    systemName: DEFAULT_SYSTEM_NAME,
    legalEmail: "",
    sloganValues: {
      lv: messages.lv["app.subtitle"] || "",
      en: messages.en["app.subtitle"] || "",
      ru: messages.ru["app.subtitle"] || "",
    },
    displayPreferences: DEFAULT_SITE_DISPLAY_PREFERENCES,
    logoUrl: null,
    faviconUrl: null,
    logoColor: DEFAULT_SITE_LOGO_COLOR,
    updatedAt: null,
  };

  if (!isSupabaseConfigured()) {
    return fallback;
  }

  const supabase = await getSessionClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "system_name, legal_email, slogan, slogan_values, week_start_day, date_format, date_separator, time_format, logo_url, favicon_url, logo_color, updated_at",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return fallback;
  }

  const row = data as SettingsRow;
  const stored = asStringRecord(row.slogan_values);
  return {
    systemName: row.system_name,
    legalEmail: row.legal_email?.trim() ?? "",
    sloganValues: {
      lv: stored.lv || row.slogan,
      en: stored.en || "",
      ru: stored.ru || "",
      ...stored,
    },
    displayPreferences: readDisplayPreferences(row),
    logoUrl: normalizeBrandImageUrl(row.logo_url),
    faviconUrl: normalizeBrandImageUrl(row.favicon_url),
    logoColor: normalizeSiteLogoColor(row.logo_color),
    updatedAt: row.updated_at,
  };
});

export async function saveSiteSettings(input: SiteSettingsInput): Promise<ActionResult> {
  const systemName = input.systemName.trim();
  const legalEmail = input.legalEmail.trim();
  if (!systemName) {
    return { ok: false, error: "errors.system_name_required" };
  }
  if (legalEmail && !EMAIL_RE.test(legalEmail)) {
    return { ok: false, error: "errors.email_invalid" };
  }
  if (!Object.values(input.sloganValues).some((value) => value.trim())) {
    return { ok: false, error: "errors.slogan_required" };
  }
  const displayPreferences = normalizeSiteDisplayPreferences(input.displayPreferences);
  const missing = requireConfiguredDb();
  if (missing) return missing;

  const slogan =
    input.sloganValues.lv?.trim() ||
    Object.values(input.sloganValues).find((value) => value.trim())?.trim() ||
    "";

  const supabase = await getSessionClient();
  const { error } = await supabase.from("site_settings").upsert({
    id: 1,
    system_name: systemName,
    legal_email: legalEmail,
    slogan,
    slogan_values: input.sloganValues,
    week_start_day: displayPreferences.weekStartDay,
    date_format: displayPreferences.dateFormat,
    date_separator: displayPreferences.dateSeparator,
    time_format: displayPreferences.timeFormat,
    logo_url: normalizeBrandImageUrl(input.logoUrl),
    favicon_url: normalizeBrandImageUrl(input.faviconUrl),
    logo_color: normalizeSiteLogoColor(input.logoColor),
  });

  if (error) {
    return { ok: false, error: "errors.settings_save_failed" };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Task Statuses
// ---------------------------------------------------------------------------

type TaskStatusRow = {
  id: string;
  label: string;
  labels: Record<string, string> | null;
  color: string;
  sort_order: number;
  group_key: string;
};

function parseStatusLabels(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const labels: Record<string, string> = {};
  for (const [code, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === "string" && text.trim()) {
      labels[code] = text.trim();
    }
  }
  return labels;
}

function normalizeStatusLabels(input: Record<string, string>): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [code, text] of Object.entries(input)) {
    const trimmed = text.trim();
    if (trimmed) labels[code] = trimmed;
  }
  return labels;
}

function primaryStatusLabel(
  labels: Record<string, string>,
  fallbackLabel = "",
): string {
  return labels.lv?.trim() || Object.values(labels)[0]?.trim() || fallbackLabel.trim();
}

function mapTaskStatusRow(row: TaskStatusRow): TaskStatusSummary {
  const labels = parseStatusLabels(row.labels);
  const legacyLabel = row.label?.trim() ?? "";
  if (!labels.lv && legacyLabel) {
    labels.lv = legacyLabel;
  }

  return {
    id: row.id,
    labels,
    label: primaryStatusLabel(labels, legacyLabel),
    color: row.color,
    sortOrder: row.sort_order,
    groupKey: row.group_key,
  };
}

export const listTaskStatuses = cache(async function listTaskStatuses(): Promise<TaskStatusSummary[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await getSessionClient();
  const { data, error } = await supabase
    .from("task_statuses")
    .select("id, label, labels, color, sort_order, group_key")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listTaskStatuses failed:", error.message);
    return [];
  }

  return ((data ?? []) as TaskStatusRow[]).map(mapTaskStatusRow);
});

const STATUS_ID_RE = /^[a-z][a-z0-9_]*$/;
const VALID_GROUPS = ["not_started", "active", "closed"];

function slugifyStatusId(value: string): string {
  const translit: Record<string, string> = {
    ā: "a",
    č: "c",
    ē: "e",
    ģ: "g",
    ī: "i",
    ķ: "k",
    ļ: "l",
    ņ: "n",
    š: "s",
    ū: "u",
    ž: "z",
  };
  let slug = value
    .trim()
    .toLowerCase()
    .replace(/[āčēģīķļņšūž]/g, (ch) => translit[ch] ?? ch)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!slug) return "";
  if (!/^[a-z]/.test(slug)) slug = `s_${slug}`;
  return slug.slice(0, 48);
}

async function displaceSingletonOccupants(
  supabase: Awaited<ReturnType<typeof getSessionClient>>,
  groupKey: string,
  keepId: string,
) {
  if (!isSingletonStatusGroup(groupKey) || !keepId) return;
  const { error } = await supabase
    .from("task_statuses")
    .update({ group_key: "active" })
    .eq("group_key", groupKey)
    .neq("id", keepId);
  if (error) {
    console.error("displaceSingletonOccupants failed:", error.message, error.code);
  }
}

export async function createTaskStatus(input: TaskStatusInput): Promise<ActionResult> {
  const labels = normalizeStatusLabels(input.labels);
  const label = primaryStatusLabel(labels);
  const id = slugifyStatusId(input.id) || slugifyStatusId(label);
  const color = input.color.trim() || "#71717a";
  const groupKey = input.groupKey.trim();

  if (!id || !STATUS_ID_RE.test(id)) {
    return { ok: false, error: "errors.status_id_invalid" };
  }
  if (!label) {
    return { ok: false, error: "errors.name_required" };
  }
  if (!VALID_GROUPS.includes(groupKey)) {
    return { ok: false, error: "errors.status_group_invalid" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();

  const { data: existing } = await supabase
    .from("task_statuses")
    .select("id, sort_order")
    .order("sort_order", { ascending: false });
  const usedIds = new Set(((existing ?? []) as { id: string }[]).map((row) => row.id));
  let uniqueId = id;
  let suffix = 2;
  while (usedIds.has(uniqueId)) {
    uniqueId = `${id}_${suffix}`.slice(0, 48);
    suffix += 1;
  }
  const nextOrder =
    ((existing?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("task_statuses").insert({
    id: uniqueId,
    label,
    labels,
    color,
    sort_order: nextOrder,
    group_key: groupKey,
  });

  if (error) {
    console.error("createTaskStatus failed:", error.message, error.code);
    if (error.code === "23505") {
      return { ok: false, error: "errors.status_exists" };
    }
    return { ok: false, error: "errors.status_create_failed" };
  }

  await displaceSingletonOccupants(supabase, groupKey, uniqueId);
  return { ok: true };
}

export async function updateTaskStatus(
  statusId: string,
  input: Omit<TaskStatusInput, "id">,
): Promise<ActionResult> {
  const labels = normalizeStatusLabels(input.labels);
  const label = primaryStatusLabel(labels);
  const color = input.color.trim() || "#71717a";
  const groupKey = input.groupKey.trim();

  if (!label) {
    return { ok: false, error: "errors.name_required" };
  }
  if (!VALID_GROUPS.includes(groupKey)) {
    return { ok: false, error: "errors.status_group_invalid" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { data: currentRow } = await supabase
    .from("task_statuses")
    .select("id, group_key")
    .eq("id", statusId)
    .maybeSingle();
  const currentGroup =
    currentRow && typeof currentRow.group_key === "string"
      ? currentRow.group_key
      : null;

  if (currentGroup && currentGroup !== groupKey) {
    const { data: allRows } = await supabase
      .from("task_statuses")
      .select("id, group_key");
    const items = ((allRows ?? []) as { id: string; group_key: string }[]).map(
      (row) => ({ id: row.id, groupKey: row.group_key }),
    );
    if (groupWouldBeEmpty(items, [], statusId)) {
      return { ok: false, error: "errors.status_group_min_one" };
    }
  }

  const { error } = await supabase
    .from("task_statuses")
    .update({ label, labels, color, group_key: groupKey })
    .eq("id", statusId);

  if (error) {
    return { ok: false, error: "errors.status_update_failed" };
  }

  await displaceSingletonOccupants(supabase, groupKey, statusId);
  return { ok: true };
}

export async function deleteTaskStatus(statusId: string): Promise<ActionResult> {
  if (!statusId.trim()) {
    return { ok: false, error: "errors.status_id_invalid" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { data: allRows } = await supabase
    .from("task_statuses")
    .select("id, group_key");
  const items = ((allRows ?? []) as { id: string; group_key: string }[]).map(
    (row) => ({ id: row.id, groupKey: row.group_key }),
  );
  if (groupWouldBeEmpty(items, [], statusId)) {
    return { ok: false, error: "errors.status_group_min_one" };
  }

  const { error } = await supabase
    .from("task_statuses")
    .delete()
    .eq("id", statusId);

  if (error) {
    return { ok: false, error: "errors.status_delete_failed" };
  }

  return { ok: true };
}

export async function reorderTaskStatuses(orderedIds: string[]): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("task_statuses")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);
    if (error) {
      return { ok: false, error: "errors.status_reorder_failed" };
    }
  }

  return { ok: true };
}

type DefaultRoleRow = {
  id: string;
  slug: string;
  name: string;
  labels: Record<string, string> | null;
  sort_order: number;
  is_system: boolean;
  permissions: unknown;
};

function slugifyDefaultRole(value: string): string {
  const translit: Record<string, string> = {
    ā: "a",
    č: "c",
    ē: "e",
    ģ: "g",
    ī: "i",
    ķ: "k",
    ļ: "l",
    ņ: "n",
    š: "s",
    ū: "u",
    ž: "z",
  };
  let slug = value
    .trim()
    .toLowerCase()
    .replace(/[āčēģīķļņšūž]/g, (ch) => translit[ch] ?? ch)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!slug) return "";
  if (!/^[a-z]/.test(slug)) slug = `r_${slug}`;
  return slug.slice(0, 48);
}

function mapDefaultRoleRow(row: DefaultRoleRow): SystemDefaultRoleSummary {
  const labels = parseStatusLabels(row.labels);
  const fallback = row.name?.trim() ?? "";
  if (!labels.lv && fallback) labels.lv = fallback;
  return {
    id: row.id,
    slug: row.slug,
    labels,
    label: primaryStatusLabel(labels, fallback),
    sortOrder: row.sort_order,
    isSystem: row.is_system === true,
    permissions: normalizeTeamPermissionSet(row.permissions),
  };
}

export const listSystemDefaultRoles = cache(async function listSystemDefaultRoles(): Promise<
  SystemDefaultRoleSummary[]
> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await getSessionClient();
  const { data, error } = await supabase
    .from("system_default_roles")
    .select("id, slug, name, labels, sort_order, is_system, permissions")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listSystemDefaultRoles failed:", error.message);
    return [];
  }

  return ((data ?? []) as DefaultRoleRow[]).map(mapDefaultRoleRow);
});

export async function createSystemDefaultRole(
  input: SystemDefaultRoleInput,
): Promise<ActionResult> {
  const labels = normalizeStatusLabels(input.labels);
  const name = primaryStatusLabel(labels);
  let slug = slugifyDefaultRole(name);
  const permissions = normalizeTeamPermissionSet(input.permissions);

  if (!name || !slug) {
    return { ok: false, error: "errors.name_required" };
  }
  if (slug === OWNER_TEAM_ROLE || slug === MEMBER_TEAM_ROLE) {
    slug = `${slug}_custom`;
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { data: existing } = await supabase
    .from("system_default_roles")
    .select("id, slug, sort_order")
    .order("sort_order", { ascending: false });
  const used = new Set(
    ((existing ?? []) as { id: string; slug: string }[]).flatMap((row) => [
      row.id,
      row.slug,
    ]),
  );
  let unique = slug;
  let suffix = 2;
  while (used.has(unique)) {
    unique = `${slug}_${suffix}`.slice(0, 48);
    suffix += 1;
  }
  const nextOrder =
    ((existing?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("system_default_roles").insert({
    id: unique,
    slug: unique,
    name,
    labels,
    sort_order: nextOrder,
    is_system: false,
    permissions,
  });

  if (error) {
    console.error("createSystemDefaultRole failed:", error.message, error.code);
    if (error.code === "23505") {
      return { ok: false, error: "errors.role_exists" };
    }
    return { ok: false, error: "errors.role_create_failed" };
  }

  return { ok: true };
}

export async function updateSystemDefaultRole(
  roleId: string,
  input: SystemDefaultRoleInput,
): Promise<ActionResult> {
  const labels = normalizeStatusLabels(input.labels);
  const name = primaryStatusLabel(labels);
  if (!name) {
    return { ok: false, error: "errors.name_required" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { data: current, error: currentError } = await supabase
    .from("system_default_roles")
    .select("id, slug")
    .eq("id", roleId)
    .maybeSingle();
  if (currentError || !current) {
    return { ok: false, error: "errors.role_update_failed" };
  }

  const slug = (current as { slug: string }).slug;
  const permissions =
    slug === OWNER_TEAM_ROLE
      ? createFullTeamPermissions(true)
      : normalizeTeamPermissionSet(input.permissions);

  const { error } = await supabase
    .from("system_default_roles")
    .update({ name, labels, permissions })
    .eq("id", roleId);

  if (error) {
    return { ok: false, error: "errors.role_update_failed" };
  }

  return { ok: true };
}

export async function deleteSystemDefaultRole(roleId: string): Promise<ActionResult> {
  if (!roleId.trim()) {
    return { ok: false, error: "errors.role_delete_failed" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { data: current } = await supabase
    .from("system_default_roles")
    .select("slug, is_system")
    .eq("id", roleId)
    .maybeSingle();
  const row = current as { slug?: string; is_system?: boolean } | null;
  if (!row) {
    return { ok: false, error: "errors.role_delete_failed" };
  }
  if (
    row.is_system === true ||
    row.slug === OWNER_TEAM_ROLE ||
    row.slug === MEMBER_TEAM_ROLE
  ) {
    return { ok: false, error: "errors.role_system_delete" };
  }

  const { error } = await supabase.from("system_default_roles").delete().eq("id", roleId);
  if (error) {
    return { ok: false, error: "errors.role_delete_failed" };
  }

  return { ok: true };
}

export async function reorderSystemDefaultRoles(
  orderedIds: string[],
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("system_default_roles")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);
    if (error) {
      return { ok: false, error: "errors.role_reorder_failed" };
    }
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// File type extensions
// ---------------------------------------------------------------------------

type FileTypeExtensionRow = {
  extension: string;
  mime_type: string;
  icon: string;
  color: string;
  sort_order: number;
};

function mapFileTypeExtensionRow(row: FileTypeExtensionRow): FileTypeExtensionSummary {
  return {
    extension: row.extension,
    mimeType: row.mime_type,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
  };
}

export const listFileTypeExtensions = cache(async function listFileTypeExtensions(): Promise<
  FileTypeExtensionSummary[]
> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await getSessionClient();
  const { data, error } = await supabase
    .from("file_type_extensions")
    .select("extension, mime_type, icon, color, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listFileTypeExtensions failed:", error.message);
    return [];
  }

  return ((data ?? []) as FileTypeExtensionRow[]).map(mapFileTypeExtensionRow);
});

export async function createFileTypeExtension(
  input: FileTypeExtensionInput,
): Promise<ActionResult> {
  const extension = normalizeFileExtension(input.extension);
  const mimeType = input.mimeType.trim();
  const icon = input.icon.trim();
  const color = input.color.trim() || "#71717a";

  if (!isValidFileExtensionInput(extension)) {
    return { ok: false, error: "errors.file_extension_invalid" };
  }
  if (!mimeType) {
    return { ok: false, error: "errors.file_mime_required" };
  }
  if (!isValidFileIconInput(icon)) {
    return { ok: false, error: "errors.file_icon_invalid" };
  }
  if (!isValidFileColorInput(color)) {
    return { ok: false, error: "errors.file_color_invalid" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { data: existing } = await supabase
    .from("file_type_extensions")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder =
    ((existing?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("file_type_extensions").insert({
    extension,
    mime_type: mimeType,
    icon,
    color,
    sort_order: nextOrder,
  });

  if (error) {
    console.error("createFileTypeExtension failed:", error.message, error.code);
    if (error.code === "23505") {
      return { ok: false, error: "errors.file_extension_exists" };
    }
    return { ok: false, error: "errors.file_extension_create_failed" };
  }

  return { ok: true };
}

export async function updateFileTypeExtension(
  extension: string,
  input: Omit<FileTypeExtensionInput, "extension">,
): Promise<ActionResult> {
  const currentExtension = normalizeFileExtension(extension);
  const mimeType = input.mimeType.trim();
  const icon = input.icon.trim();
  const color = input.color.trim() || "#71717a";

  if (!isValidFileExtensionInput(currentExtension)) {
    return { ok: false, error: "errors.file_extension_invalid" };
  }
  if (!mimeType) {
    return { ok: false, error: "errors.file_mime_required" };
  }
  if (!isValidFileIconInput(icon)) {
    return { ok: false, error: "errors.file_icon_invalid" };
  }
  if (!isValidFileColorInput(color)) {
    return { ok: false, error: "errors.file_color_invalid" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { error } = await supabase
    .from("file_type_extensions")
    .update({
      mime_type: mimeType,
      icon,
      color,
    })
    .eq("extension", currentExtension);

  if (error) {
    console.error("updateFileTypeExtension failed:", error.message, error.code);
    return { ok: false, error: "errors.file_extension_update_failed" };
  }

  return { ok: true };
}

export async function deleteFileTypeExtension(extension: string): Promise<ActionResult> {
  const normalized = normalizeFileExtension(extension);
  if (!isValidFileExtensionInput(normalized)) {
    return { ok: false, error: "errors.file_extension_invalid" };
  }
  if (!isSupabaseConfigured()) {
    return dbNotConfigured();
  }

  const supabase = await getSessionClient();
  const { error } = await supabase
    .from("file_type_extensions")
    .delete()
    .eq("extension", normalized);

  if (error) {
    console.error("deleteFileTypeExtension failed:", error.message, error.code);
    return { ok: false, error: "errors.file_extension_delete_failed" };
  }

  return { ok: true };
}
