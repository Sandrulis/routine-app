import { randomBytes } from "crypto";
import { cache } from "react";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient as createUserServerClient } from "@/app/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/app/lib/supabase/env";
import { messages, type LanguageCode } from "@/app/lib/i18n/messages";
import {
  createOwnerMember,
  createTeamId,
  initialsFromName,
} from "@/app/lib/team";
import { DEFAULT_LIST_COLOR, randomListColorId } from "@/app/lib/lists";
import type {
  ActionResult,
  AdminTeamInput,
  AdminTeamSummary,
  AdminUserInput,
  AdminUserSummary,
  SiteLanguageInput,
  SiteLanguageSummary,
  SiteSettingsInput,
  SiteSettingsSummary,
  SiteTranslationInput,
  SiteTranslationSummary,
  TranslationDictionary,
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
};

type TeamMemberListRow = {
  user_id: string | null;
  team_id: string;
  role: string;
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
  slogan: string;
  slogan_values: Record<string, unknown> | null;
  updated_at: string | null;
};

function dbNotConfigured(): ActionResult {
  return { ok: false, error: "errors.db_not_configured" };
}

async function getSessionClient() {
  return createUserServerClient();
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
    .select("id, name, email, avatar, is_admin, created_at")
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
    id: owner.id,
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

export const listSiteLanguages = cache(async function listSiteLanguages(): Promise<SiteLanguageSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [
      { code: "lv", name: "Latviešu", isActive: true, isDefault: true, sortOrder: 10 },
      { code: "en", name: "English", isActive: true, isDefault: false, sortOrder: 20 },
      { code: "ru", name: "Русский", isActive: true, isDefault: false, sortOrder: 30 },
    ];
  }

  const supabase = createAdminClient();
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
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const supabase = createAdminClient();
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
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const supabase = createAdminClient();
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
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const supabase = createAdminClient();
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
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const supabase = createAdminClient();
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
  supabase: ReturnType<typeof createAdminClient>,
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
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const supabase = createAdminClient();
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

  if (isSupabaseAdminConfigured()) {
    const supabase = createAdminClient();
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
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const supabase = createAdminClient();
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
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const supabase = createAdminClient();
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
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const supabase = createAdminClient();
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
  if (!isSupabaseAdminConfigured()) {
    return {};
  }

  const languages = await listSiteLanguages();
  const defaultCode = languages.find((language) => language.isDefault)?.code ?? "lv";
  const supabase = createAdminClient();
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

export const getSiteSettings = cache(async function getSiteSettings(): Promise<SiteSettingsSummary> {
  const fallback: SiteSettingsSummary = {
    systemName: messages.lv["app.name"] || "Routine",
    sloganValues: {
      lv: messages.lv["app.subtitle"] || "",
      en: messages.en["app.subtitle"] || "",
      ru: messages.ru["app.subtitle"] || "",
    },
    updatedAt: null,
  };

  if (!isSupabaseAdminConfigured()) {
    return fallback;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("system_name, slogan, slogan_values, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return fallback;
  }

  const row = data as SettingsRow;
  const stored = asStringRecord(row.slogan_values);
  return {
    systemName: row.system_name,
    sloganValues: {
      lv: stored.lv || row.slogan,
      en: stored.en || "",
      ru: stored.ru || "",
      ...stored,
    },
    updatedAt: row.updated_at,
  };
});

export async function saveSiteSettings(input: SiteSettingsInput): Promise<ActionResult> {
  const systemName = input.systemName.trim();
  if (!systemName) {
    return { ok: false, error: "errors.system_name_required" };
  }
  if (!Object.values(input.sloganValues).some((value) => value.trim())) {
    return { ok: false, error: "errors.slogan_required" };
  }
  if (!isSupabaseAdminConfigured()) {
    return dbNotConfigured();
  }

  const slogan =
    input.sloganValues.lv?.trim() ||
    Object.values(input.sloganValues).find((value) => value.trim())?.trim() ||
    "";

  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert({
    id: 1,
    system_name: systemName,
    slogan,
    slogan_values: input.sloganValues,
  });

  if (error) {
    return { ok: false, error: "errors.settings_save_failed" };
  }

  return { ok: true };
}
