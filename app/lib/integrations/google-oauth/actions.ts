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
  fetchGoogleOAuthIntegrationStatus,
  isGoogleOAuthCredentialsAvailable,
  isGoogleSignInEnabled,
  resetGoogleOAuthConfiguration,
  saveGoogleOAuthCredentials,
  setGoogleOAuthEnabled,
} from "@/app/lib/integrations/google-oauth/repository";
import type {
  GoogleOAuthCredentialsInput,
  GoogleOAuthIntegrationStatus,
} from "@/app/lib/integrations/types";
import {
  buildGoogleOAuthAuthorizeUrl,
  createGoogleOAuthConfigureState,
  googleOAuthConfigureCookieOptions,
  GOOGLE_OAUTH_OAUTH_COOKIE,
  serializeGoogleOAuthConfigureState,
} from "@/app/lib/integrations/google-oauth/oauth";
import { requireAdmin } from "@/app/lib/users/require-admin";

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

function refreshIntegrations() {
  revalidatePath("/admin/integrations");
  revalidatePath("/admin", "layout");
  revalidatePath("/login");
  revalidatePath("/signup");
}

export async function getGoogleOAuthIntegrationStatusAction(
  origin: string,
): Promise<ActionResult<GoogleOAuthIntegrationStatus>> {
  await requireAdmin();
  const status = await fetchGoogleOAuthIntegrationStatus(origin);
  return { ok: true, data: status };
}

export async function saveGoogleOAuthCredentialsAction(
  input: GoogleOAuthCredentialsInput,
): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.google.save" });
  const result = await saveGoogleOAuthCredentials(input);
  if (result.ok) refreshIntegrations();
  return result;
}

export async function setGoogleOAuthEnabledAction(
  enabled: boolean,
): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.google.toggle" });
  const result = await setGoogleOAuthEnabled(enabled);
  if (result.ok) refreshIntegrations();
  return result;
}

export async function resetGoogleOAuthConfigurationAction(): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.google.reset" });
  const result = await resetGoogleOAuthConfiguration();
  if (result.ok) refreshIntegrations();
  return result;
}

export async function startGoogleOAuthConfigureAction(
  origin: string,
): Promise<ActionResult<{ url: string }>> {
  const admin = await requireAdmin({ action: "integrations.google.configure" });
  if (!(await isGoogleOAuthCredentialsAvailable())) {
    return { ok: false, error: "errors.integrations_credentials_missing" };
  }

  const oauthOrigin = resolveOAuthOrigin(origin);
  if (!oauthOrigin) {
    return { ok: false, error: "errors.integrations_configure_failed" };
  }

  const state = createGoogleOAuthConfigureState(admin.id);
  const serialized = serializeGoogleOAuthConfigureState(state);
  const url = await buildGoogleOAuthAuthorizeUrl(oauthOrigin, serialized);
  if (!url) {
    return { ok: false, error: "errors.integrations_credentials_missing" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    GOOGLE_OAUTH_OAUTH_COOKIE,
    serialized,
    googleOAuthConfigureCookieOptions(600),
  );

  return { ok: true, data: { url } };
}

export async function startGoogleSignInAction(input: {
  origin: string;
  returnPath?: string;
  errorPage?: OAuthLoginErrorPage;
}): Promise<ActionResult<{ url: string }>> {
  if (!(await isGoogleSignInEnabled())) {
    return { ok: false, error: "errors.auth_google_disabled" };
  }
  if (!(await isGoogleOAuthCredentialsAvailable())) {
    return { ok: false, error: "errors.integrations_credentials_missing" };
  }

  const oauthOrigin = resolveOAuthOrigin(input.origin);
  if (!oauthOrigin) {
    return { ok: false, error: "errors.auth_google_failed" };
  }

  const state = createOAuthLoginState({
    next: input.returnPath,
    errorPage: input.errorPage ?? "login",
  });
  const serialized = serializeOAuthLoginState(state);
  const url = await buildGoogleOAuthAuthorizeUrl(oauthOrigin, serialized, {
    prompt: "select_account",
    accessType: "online",
  });
  if (!url) {
    return { ok: false, error: "errors.integrations_credentials_missing" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    GOOGLE_OAUTH_OAUTH_COOKIE,
    serialized,
    googleOAuthConfigureCookieOptions(600),
  );

  return { ok: true, data: { url } };
}

