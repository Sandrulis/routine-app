import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { logError } from "@/app/lib/security/log-error";
import {
  decryptSecret,
  isEncryptedSecret,
  persistSecret,
} from "@/app/lib/security/secret-box";
import { joinDisplayName } from "@/app/lib/users/display-name";
import { refreshGmailPluginAccessToken } from "@/app/lib/extension/gmail-oauth";

export type UserGmailConnection = {
  userId: string;
  googleEmail: string;
  connected: boolean;
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: string | null;
};

type ConnectionRow = {
  user_id: string;
  google_email: string;
  refresh_token: string | null;
  access_token: string | null;
  access_token_expires_at: string | null;
};

function mapRow(row: ConnectionRow): UserGmailConnection {
  const refreshToken = decryptSecret(row.refresh_token);
  return {
    userId: row.user_id,
    googleEmail: row.google_email || "",
    connected: Boolean(refreshToken),
    refreshToken,
    accessToken: decryptSecret(row.access_token),
    accessTokenExpiresAt: row.access_token_expires_at,
  };
}

export async function fetchUserGmailConnection(
  userId: string,
): Promise<UserGmailConnection | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_gmail_connections")
    .select(
      "user_id, google_email, refresh_token, access_token, access_token_expires_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as ConnectionRow;
  if (
    (row.refresh_token && !isEncryptedSecret(row.refresh_token)) ||
    (row.access_token && !isEncryptedSecret(row.access_token))
  ) {
    void admin
      .from("user_gmail_connections")
      .update({
        refresh_token: persistSecret(row.refresh_token),
        access_token: persistSecret(row.access_token),
      })
      .eq("user_id", userId);
  }
  return mapRow(row);
}

export async function saveUserGmailConnection(input: {
  userId: string;
  googleEmail: string;
  refreshToken: string;
  accessToken: string;
  expiresIn: number;
  givenName?: string;
  familyName?: string;
  name?: string;
  avatarUrl?: string;
}) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const existing = await fetchUserGmailConnection(input.userId);
  const refreshToken = input.refreshToken || existing?.refreshToken || "";
  if (!refreshToken) {
    return { ok: false as const, error: "errors.extension_gmail_auth" };
  }

  const admin = createAdminClient();
  const expiresAt = new Date(
    Date.now() + Math.max(30, input.expiresIn) * 1000,
  ).toISOString();
  const { error } = await admin.from("user_gmail_connections").upsert({
    user_id: input.userId,
    google_email: input.googleEmail.trim(),
    refresh_token: persistSecret(refreshToken),
    access_token: persistSecret(input.accessToken),
    access_token_expires_at: expiresAt,
    connected_at: new Date().toISOString(),
  });
  if (error) {
    logError("saveUserGmailConnection failed", error.message);
    return { ok: false as const, error: "errors.extension_gmail_auth" };
  }

  await syncUserProfileFromGoogle(input);
  return { ok: true as const };
}

async function syncUserProfileFromGoogle(input: {
  userId: string;
  googleEmail: string;
  givenName?: string;
  familyName?: string;
  name?: string;
  avatarUrl?: string;
}) {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();
  const displayName =
    joinDisplayName(input.givenName ?? "", input.familyName ?? "") ||
    input.name?.trim() ||
    "";
  const avatarUrl = input.avatarUrl?.trim() || "";

  const { data: profile } = await admin
    .from("users")
    .select("name, avatar, email")
    .eq("id", input.userId)
    .maybeSingle();

  const currentName = String(profile?.name || "").trim();
  const emailLocal = String(profile?.email || "")
    .split("@")[0]
    ?.trim();
  const nameLooksPlaceholder =
    !currentName || (emailLocal && currentName === emailLocal);

  const patch: Record<string, string> = {};
  if (avatarUrl) patch.avatar = avatarUrl;
  if (displayName && nameLooksPlaceholder) patch.name = displayName;
  if (Object.keys(patch).length) {
    const { error } = await admin
      .from("users")
      .update(patch)
      .eq("id", input.userId);
    if (error) {
      logError("syncUserProfileFromGoogle users failed", error.message);
    }
  }

  const { data: authUser, error: getError } =
    await admin.auth.admin.getUserById(input.userId);
  if (getError || !authUser.user) {
    logError("syncUserProfileFromGoogle getUser failed", getError?.message);
    return;
  }
  const metadata = {
    ...(authUser.user.user_metadata ?? {}),
    ...(displayName ? { name: displayName, full_name: displayName } : {}),
    ...(input.givenName ? { given_name: input.givenName } : {}),
    ...(input.familyName ? { family_name: input.familyName } : {}),
    ...(avatarUrl ? { avatar_url: avatarUrl, picture: avatarUrl } : {}),
    gmail_email: input.googleEmail.trim(),
    gmail_connected: true,
  };
  const { error: updateError } = await admin.auth.admin.updateUserById(
    input.userId,
    { user_metadata: metadata },
  );
  if (updateError) {
    logError("syncUserProfileFromGoogle metadata failed", updateError.message);
  }
}

export async function getValidGmailAccessToken(userId: string): Promise<
  | { ok: true; accessToken: string; expiresIn: number; googleEmail: string }
  | { ok: false; error: string }
> {
  const row = await fetchUserGmailConnection(userId);
  if (!row?.connected) {
    return { ok: false, error: "errors.extension_gmail_not_connected" };
  }

  const expiresAt = row.accessTokenExpiresAt
    ? Date.parse(row.accessTokenExpiresAt)
    : 0;
  if (row.accessToken && expiresAt > Date.now() + 60_000) {
    return {
      ok: true,
      accessToken: row.accessToken,
      expiresIn: Math.max(60, Math.round((expiresAt - Date.now()) / 1000)),
      googleEmail: row.googleEmail,
    };
  }

  const refreshed = await refreshGmailPluginAccessToken(row.refreshToken);
  if (!refreshed?.access_token) {
    return { ok: false, error: "errors.extension_gmail_auth" };
  }
  const expiresIn = Math.max(60, Number(refreshed.expires_in) || 3600);
  if (isSupabaseAdminConfigured()) {
    const admin = createAdminClient();
    await admin
      .from("user_gmail_connections")
      .update({
        access_token: persistSecret(refreshed.access_token),
        access_token_expires_at: new Date(
          Date.now() + expiresIn * 1000,
        ).toISOString(),
        ...(refreshed.refresh_token
          ? { refresh_token: persistSecret(refreshed.refresh_token) }
          : {}),
      })
      .eq("user_id", userId);
  }
  return {
    ok: true,
    accessToken: refreshed.access_token,
    expiresIn,
    googleEmail: row.googleEmail,
  };
}
