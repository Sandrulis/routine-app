import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createOAuthLoginState,
  serializeOAuthLoginState,
  type OAuthLoginErrorPage,
} from "@/app/lib/auth/oauth-login-state";
import { resolveOAuthOrigin } from "@/app/lib/auth/oauth-origin";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import {
  buildMicrosoftOAuthAuthorizeUrl,
  microsoftOAuthConfigureCookieOptions,
  MICROSOFT_OAUTH_OAUTH_COOKIE,
} from "@/app/lib/integrations/microsoft-oauth/oauth";
import {
  isMicrosoftOAuthCredentialsAvailable,
  isMicrosoftOAuthEnabled,
} from "@/app/lib/integrations/microsoft-oauth/repository";

function parseErrorPage(raw: string | null): OAuthLoginErrorPage {
  if (raw === "signup" || raw === "plugin") return raw;
  return "login";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const oauthOrigin = resolveOAuthOrigin(origin) || origin;
  const errorPage = parseErrorPage(searchParams.get("errorPage"));
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (!(await isMicrosoftOAuthEnabled())) {
    return NextResponse.redirect(
      new URL(`/login?error=microsoft`, oauthOrigin),
    );
  }
  if (!(await isMicrosoftOAuthCredentialsAvailable())) {
    return NextResponse.redirect(
      new URL(`/login?error=microsoft`, oauthOrigin),
    );
  }

  const state = createOAuthLoginState({ next, errorPage });
  const serialized = serializeOAuthLoginState(state);
  const url = await buildMicrosoftOAuthAuthorizeUrl(oauthOrigin, serialized, {
    prompt: "select_account",
  });
  if (!url) {
    return NextResponse.redirect(
      new URL(`/login?error=microsoft`, oauthOrigin),
    );
  }

  const response = NextResponse.redirect(url);
  const cookieStore = await cookies();
  cookieStore.set(
    MICROSOFT_OAUTH_OAUTH_COOKIE,
    serialized,
    microsoftOAuthConfigureCookieOptions(600),
  );
  response.cookies.set(
    MICROSOFT_OAUTH_OAUTH_COOKIE,
    serialized,
    microsoftOAuthConfigureCookieOptions(600),
  );
  return response;
}
