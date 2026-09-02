import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { findAuthUserByEmailExact } from "@/app/lib/auth/find-auth-user-by-email";
import {
  oauthLoginStatesMatch,
  parseOAuthLoginState,
} from "@/app/lib/auth/oauth-login-state";
import {
  completeOAuthSignIn,
  oauthSignInErrorRedirect,
} from "@/app/lib/auth/oauth-session";
import { saveUserGmailConnection } from "@/app/lib/extension/gmail-connection";
import {
  handleGmailPluginOAuthCallback,
  isGmailPluginOAuthCallback,
} from "@/app/lib/extension/gmail-oauth-callback";
import { logError } from "@/app/lib/security/log-error";
import {
  GOOGLE_OAUTH_ADMIN_PAGE_PATH,
  GOOGLE_OAUTH_CALLBACK_PATH,
  isGoogleSignInEnabled,
  markGoogleOAuthConfigured,
} from "@/app/lib/integrations/google-oauth/repository";
import {
  exchangeGoogleOAuthCode,
  fetchGoogleOAuthUserInfo,
  googleOAuthConfigureCookieOptions,
  GOOGLE_OAUTH_OAUTH_COOKIE,
  parseGoogleOAuthConfigureState,
} from "@/app/lib/integrations/google-oauth/oauth";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { createClient } from "@/app/lib/supabase/server";
import {
  OAUTH_TURNSTILE_TOKEN_COOKIE,
  oauthTurnstileCookieOptions,
} from "@/app/lib/auth/oauth-turnstile";

function redirectToIntegrationsPage(origin: string, query: Record<string, string>) {
  const url = new URL(GOOGLE_OAUTH_ADMIN_PAGE_PATH, origin);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

function clearOAuthCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_OAUTH_OAUTH_COOKIE, "", {
    ...googleOAuthConfigureCookieOptions(0),
    maxAge: 0,
  });
  response.cookies.set(OAUTH_TURNSTILE_TOKEN_COOKIE, "", {
    ...oauthTurnstileCookieOptions(0),
    maxAge: 0,
  });
  return response;
}

function withPluginGmailConnectedFlag(response: NextResponse) {
  const location = response.headers.get("location");
  if (!location) return response;
  try {
    const url = new URL(location);
    if (!url.pathname.includes("/auth/gmail-plugin/done")) return response;
    url.searchParams.set("connected", "1");
    response.headers.set("location", url.toString());
  } catch {
    // Keep original redirect.
  }
  return response;
}

async function handleLogin(request: Request, origin: string, code: string) {
  const cookieStore = await cookies();
  const loginState = parseOAuthLoginState(
    cookieStore.get(GOOGLE_OAUTH_OAUTH_COOKIE)?.value,
  );
  const urlState = parseOAuthLoginState(new URL(request.url).searchParams.get("state"));
  const errorPage = loginState?.errorPage ?? urlState?.errorPage ?? "login";

  if (!oauthLoginStatesMatch(loginState, urlState) || !loginState) {
    return clearOAuthCookie(
      oauthSignInErrorRedirect(origin, errorPage, "google", undefined, loginState?.next ?? urlState?.next),
    );
  }

  if (!(await isGoogleSignInEnabled())) {
    return clearOAuthCookie(
      oauthSignInErrorRedirect(origin, errorPage, "google", undefined, loginState.next),
    );
  }

  const tokens = await exchangeGoogleOAuthCode(origin, code);
  if (!tokens?.access_token) {
    return clearOAuthCookie(
      oauthSignInErrorRedirect(origin, errorPage, "google", undefined, loginState.next),
    );
  }

  const profile = await fetchGoogleOAuthUserInfo(tokens.access_token);
  const response = await completeOAuthSignIn(request, {
    origin,
    next: loginState.next,
    errorPage,
    profile: {
      email: profile.email,
      name: profile.name,
      givenName: profile.givenName,
      familyName: profile.familyName,
      avatarUrl: profile.avatarUrl,
      provider: "google",
    },
    turnstileToken: cookieStore.get(OAUTH_TURNSTILE_TOKEN_COOKIE)?.value,
  });

  // Plugin login requested Gmail scopes — persist API tokens in the same step.
  if (errorPage === "plugin" && profile.email) {
    try {
      const authUser = await findAuthUserByEmailExact(profile.email);
      if (authUser?.id) {
        const saved = await saveUserGmailConnection({
          userId: authUser.id,
          googleEmail: profile.email,
          refreshToken: tokens.refresh_token || "",
          accessToken: tokens.access_token,
          expiresIn: Number(tokens.expires_in) || 3600,
          givenName: profile.givenName,
          familyName: profile.familyName,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        });
        if (saved.ok) {
          withPluginGmailConnectedFlag(response);
        }
      }
    } catch (error) {
      logError(
        "Plugin login Gmail connection save failed",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return clearOAuthCookie(response);
}

export async function GET(request: Request) {
  const limited = await consumeRateLimit(
    `oauth-google:${requestClientIp(request)}`,
    40,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfterSec) },
    });
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  if (isGmailPluginOAuthCallback(stateParam)) {
    return handleGmailPluginOAuthCallback(request, GOOGLE_OAUTH_CALLBACK_PATH);
  }
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(GOOGLE_OAUTH_OAUTH_COOKIE)?.value;
  const loginCookie = parseOAuthLoginState(cookieValue);
  const loginUrl = parseOAuthLoginState(stateParam);

  if (loginCookie || loginUrl) {
    if (searchParams.get("error") === "access_denied") {
      const errorPage = loginCookie?.errorPage ?? loginUrl?.errorPage ?? "login";
      return clearOAuthCookie(
        oauthSignInErrorRedirect(
          origin,
          errorPage,
          "google",
          undefined,
          loginCookie?.next ?? loginUrl?.next,
        ),
      );
    }
    if (!code) {
      const errorPage = loginCookie?.errorPage ?? loginUrl?.errorPage ?? "login";
      return clearOAuthCookie(
        oauthSignInErrorRedirect(
          origin,
          errorPage,
          "google",
          undefined,
          loginCookie?.next ?? loginUrl?.next,
        ),
      );
    }
    return handleLogin(request, origin, code);
  }

  const cookieState = parseGoogleOAuthConfigureState(cookieValue);
  const urlState = parseGoogleOAuthConfigureState(stateParam);

  if (
    !code ||
    !cookieState ||
    !urlState ||
    cookieState.adminUserId !== urlState.adminUserId ||
    cookieState.nonce !== urlState.nonce
  ) {
    return clearOAuthCookie(
      redirectToIntegrationsPage(origin, { error: "oauth" }),
    );
  }

  const user = await getCurrentUser();
  if (!user || user.id !== cookieState.adminUserId) {
    return clearOAuthCookie(
      redirectToIntegrationsPage(origin, { error: "forbidden" }),
    );
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin =
    profile?.is_admin === true ||
    (await supabase.rpc("current_user_is_admin")).data === true;

  if (!isAdmin) {
    return clearOAuthCookie(
      redirectToIntegrationsPage(origin, { error: "forbidden" }),
    );
  }

  const tokens = await exchangeGoogleOAuthCode(origin, code);
  if (!tokens?.access_token) {
    return clearOAuthCookie(
      redirectToIntegrationsPage(origin, { error: "oauth" }),
    );
  }

  const account = await fetchGoogleOAuthUserInfo(tokens.access_token);
  const saved = await markGoogleOAuthConfigured({
    accountEmail: account.email,
    configuredBy: cookieState.adminUserId,
  });

  if (saved.ok) {
    revalidatePath("/admin/integrations");
    revalidatePath("/login");
    revalidatePath("/signup");
  }

  return clearOAuthCookie(
    redirectToIntegrationsPage(
      origin,
      saved.ok ? { configured: "1" } : { error: "oauth" },
    ),
  );
}
