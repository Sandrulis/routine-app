import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { OWNER_TEAM_ROLE } from "@/app/lib/team";
import { normalizeTeamPermissionSet } from "@/app/lib/team-permissions";
import { logError } from "@/app/lib/security/log-error";
import {
  decryptSecret,
  isEncryptedSecret,
  persistSecret,
} from "@/app/lib/security/secret-box";
import { resolveDefaultCloudFolderPath } from "@/app/lib/cloud-storage/default-folder";
import {
  LEGACY_CLOUD_FOLDER,
  sanitizeCloudFolderPath,
} from "@/app/lib/cloud-storage/sanitize-folder-path";

export type OneDriveStatus = {
  configured: boolean;
  connected: boolean;
  enabled: boolean;
  folderPath: string;
  accountEmail: string;
  canConfigure: boolean;
};

/** Team can accept file uploads when OneDrive is connected. */
export function isOneDriveReadyForUploads(
  status: Pick<OneDriveStatus, "connected"> | null | undefined,
): boolean {
  return Boolean(status?.connected);
}

export type OneDriveSecretRow = {
  teamId: string;
  isConnected: boolean;
  isEnabled: boolean;
  folderPath: string;
  accountEmail: string;
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: string | null;
};

type IntegrationRow = {
  team_id: string;
  is_connected: boolean;
  is_enabled: boolean;
  folder_path: string;
  account_email: string;
  refresh_token: string | null;
  access_token: string | null;
  access_token_expires_at: string | null;
};

function mapSecretRow(row: IntegrationRow): OneDriveSecretRow {
  return {
    teamId: row.team_id,
    isConnected: row.is_connected,
    isEnabled: row.is_enabled,
    folderPath: row.folder_path || LEGACY_CLOUD_FOLDER,
    accountEmail: row.account_email || "",
    refreshToken: decryptSecret(row.refresh_token),
    accessToken: decryptSecret(row.access_token),
    accessTokenExpiresAt: row.access_token_expires_at,
  };
}

export function sanitizeOneDriveFolderPath(value: string) {
  return sanitizeCloudFolderPath(value);
}

export async function assertTeamMember(teamId: string, userId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) {
    return { ok: false as const, error: "errors.onedrive_forbidden" };
  }
  return { ok: true as const };
}

export async function assertCanConfigureOneDrive(teamId: string, userId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (adminRow?.is_admin === true) {
    return { ok: true as const };
  }

  const { data: member, error } = await admin
    .from("team_members")
    .select("id, role, role_id, team_roles ( permissions )")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !member) {
    return { ok: false as const, error: "errors.onedrive_forbidden" };
  }
  if (member.role === OWNER_TEAM_ROLE) {
    return { ok: true as const };
  }
  const roleRow = Array.isArray(member.team_roles)
    ? member.team_roles[0]
    : member.team_roles;
  const permissions = normalizeTeamPermissionSet(
    (roleRow as { permissions?: unknown } | null)?.permissions,
  );
  if (!permissions.actions["team.integrations.onedrive"]) {
    return { ok: false as const, error: "errors.onedrive_forbidden" };
  }
  return { ok: true as const };
}

export async function fetchOneDriveSecretRow(
  teamId: string,
): Promise<OneDriveSecretRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_onedrive_integrations")
    .select(
      "team_id, is_connected, is_enabled, folder_path, account_email, refresh_token, access_token, access_token_expires_at",
    )
    .eq("team_id", teamId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as IntegrationRow;
  if (
    (row.refresh_token && !isEncryptedSecret(row.refresh_token)) ||
    (row.access_token && !isEncryptedSecret(row.access_token))
  ) {
    void admin
      .from("team_onedrive_integrations")
      .update({
        refresh_token: persistSecret(row.refresh_token),
        access_token: persistSecret(row.access_token),
      })
      .eq("team_id", teamId);
  }
  return mapSecretRow(row);
}

export async function fetchOneDriveStatus(
  teamId: string,
  userId: string,
  configured: boolean,
): Promise<OneDriveStatus> {
  const canConfigure = (await assertCanConfigureOneDrive(teamId, userId)).ok;
  const row = await fetchOneDriveSecretRow(teamId);
  return {
    configured,
    connected: Boolean(row?.isConnected && row.refreshToken),
    enabled: Boolean(row?.isEnabled),
    folderPath: row?.folderPath ?? (await resolveDefaultCloudFolderPath(teamId)),
    accountEmail: row?.accountEmail ?? "",
    canConfigure,
  };
}

export async function saveOneDriveTokens(input: {
  teamId: string;
  refreshToken: string;
  accessToken: string;
  expiresIn: number;
  accountEmail: string;
  connectedBy: string;
}) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const existing = await fetchOneDriveSecretRow(input.teamId);
  const refreshToken = input.refreshToken || existing?.refreshToken || "";
  if (!refreshToken) {
    return { ok: false as const, error: "errors.onedrive_connect_failed" };
  }
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + Math.max(30, input.expiresIn) * 1000).toISOString();
  const folderPath =
    existing?.folderPath ?? (await resolveDefaultCloudFolderPath(input.teamId));
  const { error } = await admin.from("team_onedrive_integrations").upsert({
    team_id: input.teamId,
    is_connected: true,
    is_enabled: true,
    folder_path: folderPath,
    account_email: input.accountEmail,
    refresh_token: persistSecret(refreshToken),
    access_token: persistSecret(input.accessToken),
    access_token_expires_at: expiresAt,
    connected_by: input.connectedBy,
    connected_at: new Date().toISOString(),
  });
  if (error) {
    logError("saveOneDriveTokens failed", error.message);
    return { ok: false as const, error: "errors.onedrive_connect_failed" };
  }
  return { ok: true as const };
}

export async function updateOneDriveAccessToken(
  teamId: string,
  accessToken: string,
  expiresIn: number,
  refreshToken?: string,
) {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();
  const patch: Record<string, unknown> = {
    access_token: persistSecret(accessToken),
    access_token_expires_at: new Date(
      Date.now() + Math.max(30, expiresIn) * 1000,
    ).toISOString(),
  };
  if (refreshToken?.trim()) {
    patch.refresh_token = persistSecret(refreshToken.trim());
  }
  await admin.from("team_onedrive_integrations").update(patch).eq("team_id", teamId);
}

export async function saveOneDriveSettings(input: {
  teamId: string;
  folderPath: string;
}) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const admin = createAdminClient();
  const existing = await fetchOneDriveSecretRow(input.teamId);
  const folderPath = sanitizeOneDriveFolderPath(input.folderPath);
  const payload = {
    is_enabled: true,
    folder_path: folderPath,
  };
  const { error } = existing
    ? await admin
        .from("team_onedrive_integrations")
        .update(payload)
        .eq("team_id", input.teamId)
    : await admin.from("team_onedrive_integrations").insert({
        team_id: input.teamId,
        is_connected: false,
        ...payload,
      });
  if (error) {
    logError("saveOneDriveSettings failed", error.message);
    return { ok: false as const, error: "errors.onedrive_save_failed" };
  }
  return { ok: true as const, folderPath };
}

export async function disconnectOneDrive(teamId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const admin = createAdminClient();
  const existing = await fetchOneDriveSecretRow(teamId);
  const folderPath =
    existing?.folderPath ?? (await resolveDefaultCloudFolderPath(teamId));
  const { error } = await admin.from("team_onedrive_integrations").upsert({
    team_id: teamId,
    is_connected: false,
    is_enabled: false,
    folder_path: folderPath,
    account_email: "",
    refresh_token: null,
    access_token: null,
    access_token_expires_at: null,
    connected_by: null,
    connected_at: null,
  });
  if (error) {
    logError("disconnectOneDrive failed", error.message);
    return { ok: false as const, error: "errors.onedrive_disconnect_failed" };
  }
  return { ok: true as const };
}
