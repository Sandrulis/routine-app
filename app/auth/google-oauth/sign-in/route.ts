import { NextResponse } from "next/server";
import {
  createOAuthLoginState,
  serializeOAuthLoginState,
  type OAuthLoginErrorPage,
} from "@/app/lib/auth/oauth-login-state";
import { resolveOAuthOrigin } from "@/app/lib/auth/oauth-origin";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import {
  buildGoogleOAuthAuthorizeUrl,
  googleOAuthConfigureCookieOptions,
  GOOGLE_OAUTH_OAUTH_COOKIE,
} from "@/app/lib/integrations/google-oauth/oauth";
import {
  isGoogleOAuthCredentialsAvailable,
  isGoogleSignInEnabled,
} from "@/app/lib/integrations/google-oauth/repository";

function parseErrorPage(raw: string | null): OAuthLoginErrorPage {
  if (raw === "signup" || raw === "plugin") return raw;
  return "login";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const oauthOrigin = resolveOAuthOrigin(origin) || origin;
  const errorPage = parseErrorPage(searchParams.get("errorPage"));
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (!(await isGoogleSignInEnabled())) {
    return NextResponse.redirect(
      new URL(`/login?error=google`, oauthOrigin),
    );
  }
  if (!(await isGoogleOAuthCredentialsAvailable())) {
    return NextResponse.redirect(
      new URL(`/login?error=google`, oauthOrigin),
    );
  }

  const state = createOAuthLoginState({ next, errorPage });
  const serialized = serializeOAuthLoginState(state);
  const url = await buildGoogleOAuthAuthorizeUrl(oauthOrigin, serialized, {
    prompt: "select_account",
    accessType: "online",
  });
  if (!url) {
    return NextResponse.redirect(
      new URL(`/login?error=google`, oauthOrigin),
    );
  }

  const response = NextResponse.redirect(url);
  response.cookies.set(
    GOOGLE_OAUTH_OAUTH_COOKIE,
    serialized,
    googleOAuthConfigureCookieOptions(600),
  );
  return response;
}

export const runtime = "nodejs";
