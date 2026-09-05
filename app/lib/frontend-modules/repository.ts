import { cache } from "react";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient as createUserServerClient } from "@/app/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/app/lib/supabase/env";
import { FRONTEND_MODULE_KEYS, KNOWN_FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import type {
  FrontendModuleInput,
  FrontendModuleSummary,
} from "@/app/lib/frontend-modules/types";
import { isGoogleSignInEnabled } from "@/app/lib/integrations/google-oauth/repository";
import { isGooglePluginEnabled } from "@/app/lib/integrations/google-plugin/repository";
import { isMicrosoftOAuthEnabled } from "@/app/lib/integrations/microsoft-oauth/repository";
import type { ActionResult } from "@/app/lib/actions/action-result";

export type { FrontendModuleSummary } from "@/app/lib/frontend-modules/types";

const MODULE_KEY_PATTERN = /^[a-z0-9._:-]+$/;

type FrontendModuleRow = {
  id: string;
  module_key: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapFrontendModuleRow(row: FrontendModuleRow): FrontendModuleSummary {
  return {
    id: row.id,
    moduleKey: row.module_key,
    isEnabled: row.is_enabled,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeModuleKey(value: string): string {
  return value.trim().toLowerCase();
}

function validateModuleKey(moduleKey: string): string | null {
  if (!moduleKey) {
    return "errors.frontend_module_key_required";
  }

  if (moduleKey.length > 128 || !MODULE_KEY_PATTERN.test(moduleKey)) {
    return "errors.frontend_module_key_invalid";
  }

  return null;
}

export const listFrontendModules = cache(
  async (): Promise<FrontendModuleSummary[]> => {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const supabase = await createUserServerClient();
    const { data, error } = await supabase
      .from("site_frontend_modules")
      .select("id, module_key, is_enabled, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("module_key", { ascending: true });

    if (error) {
      console.error("listFrontendModules failed:", error.message);
      return [];
    }

    return ((data ?? []) as FrontendModuleRow[]).map(mapFrontendModuleRow);
  },
);

export const getEnabledFrontendModuleKeys = cache(
  async (): Promise<Set<string>> => {
    if (!isSupabaseConfigured()) {
      return new Set(KNOWN_FRONTEND_MODULE_KEYS);
    }

    // Public landing has no session; service role bypasses deny-anon RLS.
    const supabase = isSupabaseAdminConfigured()
      ? createAdminClient()
      : await createUserServerClient();
    const { data, error } = await supabase
      .from("site_frontend_modules")
      .select("module_key, is_enabled");

    if (error) {
      console.error("getEnabledFrontendModuleKeys failed:", error.message);
      return new Set(KNOWN_FRONTEND_MODULE_KEYS);
    }

    return new Set(
      ((data ?? []) as { module_key: string; is_enabled: boolean }[])
        .filter((row) => row.is_enabled)
        .map((row) => row.module_key),
    );
  },
);

export async function isFrontendModuleEnabled(moduleKey: string): Promise<boolean> {
  const normalizedKey = normalizeModuleKey(moduleKey);
  if (!normalizedKey) return false;
  const enabledKeys = await getEnabledFrontendModuleKeys();
  return enabledKeys.has(normalizedKey);
}

export async function createFrontendModule(
  input: FrontendModuleInput,
): Promise<{ ok: true; module: FrontendModuleSummary } | { ok: false; error: string }> {
  const moduleKey = normalizeModuleKey(input.moduleKey);
  const keyError = validateModuleKey(moduleKey);
  if (keyError) {
    return { ok: false, error: keyError };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createUserServerClient();
  const { data: existing } = await supabase
    .from("site_frontend_modules")
    .select("id")
    .eq("module_key", moduleKey)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "errors.frontend_module_key_exists" };
  }

  const { data: last } = await supabase
    .from("site_frontend_modules")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder =
    ((last?.[0] as { sort_order: number } | undefined)?.sort_order ?? 0) + 10;

  const { data, error } = await supabase
    .from("site_frontend_modules")
    .insert({
      module_key: moduleKey,
      is_enabled: false,
      sort_order: nextSortOrder,
    })
    .select("id, module_key, is_enabled, sort_order, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("createFrontendModule failed:", error?.message, error?.code);
    if (error?.code === "23505") {
      return { ok: false, error: "errors.frontend_module_key_exists" };
    }
    return { ok: false, error: "errors.frontend_module_create_failed" };
  }

  return { ok: true, module: mapFrontendModuleRow(data as FrontendModuleRow) };
}

export async function updateFrontendModuleEnabled(
  moduleKey: string,
  isEnabled: boolean,
): Promise<ActionResult> {
  const normalizedKey = normalizeModuleKey(moduleKey);
  const keyError = validateModuleKey(normalizedKey);
  if (keyError) {
    return { ok: false, error: keyError };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  if (
    isEnabled &&
    normalizedKey === FRONTEND_MODULE_KEYS.googleDrive &&
    !(await isGoogleSignInEnabled())
  ) {
    return { ok: false, error: "errors.frontend_module_google_oauth_required" };
  }

  if (
    isEnabled &&
    normalizedKey === FRONTEND_MODULE_KEYS.gmailPlugin &&
    !(await isGooglePluginEnabled())
  ) {
    return { ok: false, error: "errors.frontend_module_google_plugin_required" };
  }

  if (
    isEnabled &&
    normalizedKey === FRONTEND_MODULE_KEYS.onedrive &&
    !(await isMicrosoftOAuthEnabled())
  ) {
    return { ok: false, error: "errors.frontend_module_microsoft_oauth_required" };
  }

  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .update({ is_enabled: isEnabled })
    .eq("module_key", normalizedKey)
    .select("id");

  if (error) {
    console.error("updateFrontendModuleEnabled failed:", error.message);
    return { ok: false, error: "errors.frontend_module_status_save_failed" };
  }

  if (!data || data.length === 0) {
    return { ok: false, error: "errors.frontend_module_not_found" };
  }

  if (!isEnabled && normalizedKey === FRONTEND_MODULE_KEYS.privateList) {
    await publishAllPrivateLists();
  }

  return { ok: true };
}

async function publishAllPrivateLists() {
  try {
    const supabase = await createUserServerClient();
    const { error } = await supabase.rpc("publish_all_private_work_lists");
    if (!error) return;

    console.error("publishAllPrivateLists rpc failed:", error.message);

    if (!isSupabaseAdminConfigured()) return;
    const admin = createAdminClient();
    const { error: adminError } = await admin
      .from("work_lists")
      .update({ is_private: false })
      .eq("is_private", true);
    if (adminError) {
      console.error("publishAllPrivateLists admin failed:", adminError.message);
    }
  } catch (error) {
    console.error("publishAllPrivateLists failed:", error);
  }
}

export async function deleteFrontendModule(moduleKey: string): Promise<ActionResult> {
  const normalizedKey = normalizeModuleKey(moduleKey);
  const keyError = validateModuleKey(normalizedKey);
  if (keyError) {
    return { ok: false, error: keyError };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .delete()
    .eq("module_key", normalizedKey)
    .select("id");

  if (error) {
    console.error("deleteFrontendModule failed:", error.message);
    return { ok: false, error: "errors.frontend_module_delete_failed" };
  }

  if (!data || data.length === 0) {
    return { ok: false, error: "errors.frontend_module_not_found" };
  }

  if (normalizedKey === FRONTEND_MODULE_KEYS.privateList) {
    await publishAllPrivateLists();
  }

  return { ok: true };
}
