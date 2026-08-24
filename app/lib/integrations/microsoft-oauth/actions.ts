"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  createOAuthLoginState,
  serializeOAuthLoginState,
  type OAuthLoginErrorPage,
} from "@/app/lib/auth/oauth-login-state";
import { resolveOAuthOrigin } from "@/app/lib/auth/oauth-origin";
import {
  fetchMicrosoftOAuthIntegrationStatus,
  isMicrosoftOAuthCredentialsAvailable,
  isMicrosoftOAuthEnabled,
  resetMicrosoftOAuthConfiguration,
  saveMicrosoftOAuthCredentials,
  setMicrosoftOAuthEnabled,
} from "@/app/lib/integrations/microsoft-oauth/repository";
import type {
  MicrosoftOAuthCredentialsInput,
  MicrosoftOAuthIntegrationStatus,
} from "@/app/lib/integrations/types";
import {
  buildMicrosoftOAuthAuthorizeUrl,
  createMicrosoftOAuthConfigureState,
  microsoftOAuthConfigureCookieOptions,
  MICROSOFT_OAUTH_OAUTH_COOKIE,
  serializeMicrosoftOAuthConfigureState,
} from "@/app/lib/integrations/microsoft-oauth/oauth";
import { requireAdmin } from "@/app/lib/users/require-admin";
import type { ActionResult } from "@/app/lib/actions/action-result";

function refreshIntegrations() {
  revalidatePath("/admin/integrations");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/modules");
  revalidatePath("/login");
  revalidatePath("/signup");
}

export async function getMicrosoftOAuthIntegrationStatusAction(
  origin: string,
): Promise<ActionResult<MicrosoftOAuthIntegrationStatus>> {
  await requireAdmin();
  const status = await fetchMicrosoftOAuthIntegrationStatus(origin);
  return { ok: true, data: status };
}

export async function saveMicrosoftOAuthCredentialsAction(
  input: MicrosoftOAuthCredentialsInput,
): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.microsoft.save" });
  const result = await saveMicrosoftOAuthCredentials(input);
  if (result.ok) refreshIntegrations();
  return result;
}

export async function setMicrosoftOAuthEnabledAction(
  enabled: boolean,
): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.microsoft.toggle" });
  const result = await setMicrosoftOAuthEnabled(enabled);
  if (result.ok) refreshIntegrations();
  return result;
}

export async function resetMicrosoftOAuthConfigurationAction(): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.microsoft.reset" });
  const result = await resetMicrosoftOAuthConfiguration();
  if (result.ok) refreshIntegrations();
  return result;
}

export async function startMicrosoftOAuthConfigureAction(
  origin: string,
): Promise<ActionResult<{ url: string }>> {
  const admin = await requireAdmin({ action: "integrations.microsoft.configure" });
  if (!(await isMicrosoftOAuthCredentialsAvailable())) {
    return { ok: false, error: "errors.integrations_microsoft_credentials_missing" };
  }

  const oauthOrigin = resolveOAuthOrigin(origin);
  if (!oauthOrigin) {
    return { ok: false, error: "errors.integrations_microsoft_configure_failed" };
  }

  const state = createMicrosoftOAuthConfigureState(admin.id);
  const serialized = serializeMicrosoftOAuthConfigureState(state);
  const url = await buildMicrosoftOAuthAuthorizeUrl(oauthOrigin, serialized);
  if (!url) {
    return { ok: false, error: "errors.integrations_microsoft_credentials_missing" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    MICROSOFT_OAUTH_OAUTH_COOKIE,
    serialized,
    microsoftOAuthConfigureCookieOptions(600),
  );

  return { ok: true, data: { url } };
}

export async function startMicrosoftSignInAction(input: {
  origin: string;
  returnPath?: string;
  errorPage?: OAuthLoginErrorPage;
}): Promise<ActionResult<{ url: string }>> {
  if (!(await isMicrosoftOAuthEnabled())) {
    return { ok: false, error: "errors.auth_microsoft_disabled" };
  }
  if (!(await isMicrosoftOAuthCredentialsAvailable())) {
    return { ok: false, error: "errors.integrations_microsoft_credentials_missing" };
  }

  const oauthOrigin = resolveOAuthOrigin(input.origin);
  if (!oauthOrigin) {
    return { ok: false, error: "errors.auth_microsoft_failed" };
  }

  const state = createOAuthLoginState({
    next: input.returnPath,
    errorPage: input.errorPage ?? "login",
  });
  const serialized = serializeOAuthLoginState(state);
  const url = await buildMicrosoftOAuthAuthorizeUrl(oauthOrigin, serialized, {
    prompt: "select_account",
  });
  if (!url) {
    return { ok: false, error: "errors.integrations_microsoft_credentials_missing" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    MICROSOFT_OAUTH_OAUTH_COOKIE,
    serialized,
    microsoftOAuthConfigureCookieOptions(600),
  );

  return { ok: true, data: { url } };
}
