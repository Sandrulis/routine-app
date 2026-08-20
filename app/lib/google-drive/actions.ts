"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import {
  GOOGLE_DRIVE_OAUTH_COOKIE,
  isGoogleDriveOAuthConfigured,
} from "@/app/lib/google-drive/env";
import {
  buildGoogleDriveAuthorizeUrl,
  createGoogleDriveOAuthState,
  googleDriveOAuthCookieOptions,
  serializeGoogleDriveOAuthState,
} from "@/app/lib/google-drive/oauth";
import {
  assertCanConfigureGoogleDrive,
  assertTeamMember,
  disconnectGoogleDrive,
  fetchGoogleDriveStatus,
  saveGoogleDriveSettings,
  sanitizeDriveFolderPath,
  type GoogleDriveStatus,
} from "@/app/lib/google-drive/repository";

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

async function requireGoogleDriveModules() {
  const [drive, files] = await Promise.all([
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.googleDrive),
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload),
  ]);
  if (!drive || !files) {
    return { ok: false as const, error: "errors.google_drive_module_disabled" };
  }
  return { ok: true as const };
}

function resolveOAuthOrigin(clientOrigin: string) {
  const allowed = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const trimmed = clientOrigin.trim().replace(/\/$/, "");
  if (process.env.NODE_ENV === "development" && trimmed.startsWith("http")) {
    return trimmed;
  }
  if (allowed) {
    try {
      return new URL(allowed).origin;
    } catch {
      return "";
    }
  }
  return trimmed.startsWith("http") ? trimmed : "";
}

export async function getTeamGoogleDriveStatusAction(
  teamId: string,
): Promise<ActionResult<GoogleDriveStatus>> {
  const modules = await requireGoogleDriveModules();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  const trimmed = teamId.trim();
  if (!trimmed) return { ok: false, error: "errors.google_drive_forbidden" };
  const member = await assertTeamMember(trimmed, user.id);
  const canConfigure = (await assertCanConfigureGoogleDrive(trimmed, user.id)).ok;
  if (!member.ok && !canConfigure) return member;
  const status = await fetchGoogleDriveStatus(
    trimmed,
    user.id,
    isGoogleDriveOAuthConfigured(),
  );
  return { ok: true, data: status };
}

export async function startGoogleDriveOAuthAction(
  teamId: string,
  origin: string,
): Promise<ActionResult<{ url: string }>> {
  const modules = await requireGoogleDriveModules();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  const trimmed = teamId.trim();
  const allowed = await assertCanConfigureGoogleDrive(trimmed, user.id);
  if (!allowed.ok) return allowed;
  if (!isGoogleDriveOAuthConfigured()) {
    return { ok: false, error: "errors.google_drive_not_configured" };
  }
  const oauthOrigin = resolveOAuthOrigin(origin);
  if (!oauthOrigin) {
    return { ok: false, error: "errors.google_drive_not_configured" };
  }
  const state = createGoogleDriveOAuthState(trimmed);
  const serialized = serializeGoogleDriveOAuthState(state);
  const url = buildGoogleDriveAuthorizeUrl(oauthOrigin, serialized);
  if (!url) {
    return { ok: false, error: "errors.google_drive_not_configured" };
  }
  const cookieStore = await cookies();
  cookieStore.set(
    GOOGLE_DRIVE_OAUTH_COOKIE,
    serialized,
    googleDriveOAuthCookieOptions(600),
  );
  return { ok: true, data: { url } };
}

export async function saveGoogleDriveSettingsAction(input: {
  teamId: string;
  isEnabled: boolean;
  folderPath: string;
}): Promise<ActionResult<{ folderPath: string }>> {
  const modules = await requireGoogleDriveModules();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  const allowed = await assertCanConfigureGoogleDrive(input.teamId.trim(), user.id);
  if (!allowed.ok) return allowed;
  const result = await saveGoogleDriveSettings({
    teamId: input.teamId.trim(),
    isEnabled: input.isEnabled,
    folderPath: sanitizeDriveFolderPath(input.folderPath),
  });
  if (!result.ok) return result;
  return { ok: true, data: { folderPath: result.folderPath } };
}

export async function disconnectGoogleDriveAction(
  teamId: string,
): Promise<ActionResult> {
  const modules = await requireGoogleDriveModules();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  const allowed = await assertCanConfigureGoogleDrive(teamId.trim(), user.id);
  if (!allowed.ok) return allowed;
  return disconnectGoogleDrive(teamId.trim());
}
