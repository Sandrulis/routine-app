import type { SupabaseClient, User } from "@supabase/supabase-js";
import { mapUserDisplay, userHasPasswordLogin } from "@/app/lib/auth/map-user-display";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { decryptSecret } from "@/app/lib/security/secret-box";
import { readPersonalNameFromMetadata } from "@/app/lib/users/display-name";
import { fetchUserGmailConnection } from "@/app/lib/extension/gmail-connection";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";

export type ExtensionTeamSummary = {
  id: string;
  name: string;
  googleDriveConnected: boolean;
  oneDriveConnected: boolean;
};

export type ExtensionUserSummary = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  name: string;
  avatarUrl: string | null;
  hasPasswordLogin: boolean;
};

async function isModuleEnabled(
  supabase: SupabaseClient,
  moduleKey: string,
  fallback = true,
) {
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .select("is_enabled")
    .eq("module_key", moduleKey)
    .maybeSingle();
  if (error || !data) return fallback;
  return data.is_enabled === true;
}

export async function loadExtensionUserSummary(
  supabase: SupabaseClient,
  user: User,
): Promise<ExtensionUserSummary> {
  const display = mapUserDisplay(user);
  const { data: profile } = await supabase
    .from("users")
    .select("name, email, avatar")
    .eq("id", user.id)
    .maybeSingle();
  const name = String(profile?.name || "").trim() || display.name;
  const names = readPersonalNameFromMetadata(user.user_metadata, name);
  const avatar =
    String(profile?.avatar || "").trim() || display.avatarUrl || null;
  return {
    id: user.id,
    email: String(profile?.email || "").trim() || user.email || display.email || null,
    firstName: names.firstName,
    lastName: names.lastName,
    name,
    avatarUrl: avatar,
    hasPasswordLogin: userHasPasswordLogin(user),
  };
}

export async function listExtensionTeams(
  supabase: SupabaseClient,
  userId: string,
): Promise<ExtensionTeamSummary[]> {
  const { data: members } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);
  const teamIds = [
    ...new Set(
      (members ?? [])
        .map((row) => String(row.team_id || "").trim())
        .filter(Boolean),
    ),
  ];
  if (!teamIds.length) return [];

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", teamIds)
    .order("name", { ascending: true });

  const connected = new Set<string>();
  const oneDriveConnected = new Set<string>();
  if (isSupabaseAdminConfigured()) {
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("team_google_drive_integrations")
      .select("team_id, is_connected, refresh_token")
      .in("team_id", teamIds);
    for (const row of rows ?? []) {
      if (row.is_connected && decryptSecret(row.refresh_token)) {
        connected.add(String(row.team_id));
      }
    }
    const { data: oneDriveRows } = await admin
      .from("team_onedrive_integrations")
      .select("team_id, is_connected, refresh_token")
      .in("team_id", teamIds);
    for (const row of oneDriveRows ?? []) {
      if (row.is_connected && decryptSecret(row.refresh_token)) {
        oneDriveConnected.add(String(row.team_id));
      }
    }
  }

  return (teams ?? []).map((team) => ({
    id: String(team.id),
    name: String(team.name || "").trim() || "",
    googleDriveConnected: connected.has(String(team.id)),
    oneDriveConnected: oneDriveConnected.has(String(team.id)),
  }));
}

export async function loadExtensionSessionFlags(supabase: SupabaseClient) {
  const [fileUploadEnabled, gmailPluginEnabled, googleDriveEnabled, oneDriveEnabled] =
    await Promise.all([
      isModuleEnabled(supabase, FRONTEND_MODULE_KEYS.fileUpload, true),
      isModuleEnabled(supabase, FRONTEND_MODULE_KEYS.gmailPlugin, true),
      isModuleEnabled(supabase, FRONTEND_MODULE_KEYS.googleDrive, true),
      isModuleEnabled(supabase, FRONTEND_MODULE_KEYS.onedrive, false),
    ]);
  return {
    fileUploadEnabled,
    gmailPluginEnabled,
    googleDriveEnabled,
    oneDriveEnabled,
  };
}

export async function loadGmailConnectionSummary(userId: string) {
  const row = await fetchUserGmailConnection(userId);
  return {
    gmailConnected: Boolean(row?.connected),
    gmailEmail: row?.googleEmail || "",
  };
}
