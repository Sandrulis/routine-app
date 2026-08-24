"use server";

import { cookies } from "next/headers";
import type { ActionResult } from "@/app/lib/actions/action-result";
import { resolveOAuthOrigin } from "@/app/lib/auth/oauth-origin";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import {
  ONEDRIVE_OAUTH_COOKIE,
  isOneDriveOAuthConfigured,
} from "@/app/lib/onedrive/env";
import {
  buildOneDriveAuthorizeUrl,
  createOneDriveOAuthState,
  oneDriveOAuthCookieOptions,
  serializeOneDriveOAuthState,
} from "@/app/lib/onedrive/oauth";
import {
  assertCanConfigureOneDrive,
  assertTeamMember,
  disconnectOneDrive,
  fetchOneDriveStatus,
  saveOneDriveSettings,
  sanitizeOneDriveFolderPath,
  type OneDriveStatus,
} from "@/app/lib/onedrive/repository";

async function requireOneDriveModules() {
  const [onedrive, files] = await Promise.all([
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.onedrive),
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload),
  ]);
  if (!onedrive || !files) {
    return { ok: false as const, error: "errors.onedrive_module_disabled" };
  }
  return { ok: true as const };
}

export async function getTeamOneDriveStatusAction(
  teamId: string,
): Promise<ActionResult<OneDriveStatus>> {
  const modules = await requireOneDriveModules();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  const trimmed = teamId.trim();
  if (!trimmed) return { ok: false, error: "errors.onedrive_forbidden" };
  const member = await assertTeamMember(trimmed, user.id);
  const canConfigure = (await assertCanConfigureOneDrive(trimmed, user.id)).ok;
  if (!member.ok && !canConfigure) return member;
  const status = await fetchOneDriveStatus(
    trimmed,
    user.id,
    await isOneDriveOAuthConfigured(),
  );
  return { ok: true, data: status };
}

export async function startOneDriveOAuthAction(
  teamId: string,
  origin: string,
): Promise<ActionResult<{ url: string }>> {
  const modules = await requireOneDriveModules();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  const trimmed = teamId.trim();
  const allowed = await assertCanConfigureOneDrive(trimmed, user.id);
  if (!allowed.ok) return allowed;
  if (!(await isOneDriveOAuthConfigured())) {
    return { ok: false, error: "errors.onedrive_not_configured" };
  }
  const oauthOrigin = resolveOAuthOrigin(origin);
  if (!oauthOrigin) {
    return { ok: false, error: "errors.onedrive_not_configured" };
  }
  const state = createOneDriveOAuthState(trimmed);
  const serialized = serializeOneDriveOAuthState(state);
  const url = await buildOneDriveAuthorizeUrl(oauthOrigin, serialized);
  if (!url) {
    return { ok: false, error: "errors.onedrive_not_configured" };
  }
  const cookieStore = await cookies();
  cookieStore.set(
    ONEDRIVE_OAUTH_COOKIE,
    serialized,
    oneDriveOAuthCookieOptions(600),
  );
  return { ok: true, data: { url } };
}

export async function saveOneDriveSettingsAction(input: {
  teamId: string;
  isEnabled: boolean;
  folderPath: string;
}): Promise<ActionResult<{ folderPath: string }>> {
  const modules = await requireOneDriveModules();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  const allowed = await assertCanConfigureOneDrive(input.teamId.trim(), user.id);
  if (!allowed.ok) return allowed;
  const result = await saveOneDriveSettings({
    teamId: input.teamId.trim(),
    isEnabled: input.isEnabled,
    folderPath: sanitizeOneDriveFolderPath(input.folderPath),
  });
  if (!result.ok) return result;
  return { ok: true, data: { folderPath: result.folderPath } };
}

export async function disconnectOneDriveAction(
  teamId: string,
): Promise<ActionResult> {
  const modules = await requireOneDriveModules();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  const allowed = await assertCanConfigureOneDrive(teamId.trim(), user.id);
  if (!allowed.ok) return allowed;
  return disconnectOneDrive(teamId.trim());
}
