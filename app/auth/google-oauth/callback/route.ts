import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  oauthLoginStatesMatch,
  parseOAuthLoginState,
} from "@/app/lib/auth/oauth-login-state";
import {
  completeOAuthSignIn,
  oauthSignInErrorRedirect,
} from "@/app/lib/auth/oauth-session";
import {
  handleGmailPluginOAuthCallback,
  isGmailPluginOAuthCallback,
} from "@/app/lib/extension/gmail-oauth-callback";
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
    return clearOAuthCookie(oauthSignInErrorRedirect(origin, errorPage, "google"));
  }

  if (!(await isGoogleSignInEnabled())) {
    return clearOAuthCookie(oauthSignInErrorRedirect(origin, errorPage, "google"));
  }

  const tokens = await exchangeGoogleOAuthCode(origin, code);
  if (!tokens?.access_token) {
    return clearOAuthCookie(oauthSignInErrorRedirect(origin, errorPage, "google"));
  }

  const profile = await fetchGoogleOAuthUserInfo(tokens.access_token);
  const response = await completeOAuthSignIn(request, {
    origin,
    next: loginState.next,
    errorPage,
    profile: {
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      provider: "google",
    },
  });
  return clearOAuthCookie(response);
}

export async function GET(request: Request) {
  const limited = consumeRateLimit(
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
      return clearOAuthCookie(NextResponse.redirect(new URL(`/${errorPage}`, origin)));
    }
    if (!code) {
      const errorPage = loginCookie?.errorPage ?? loginUrl?.errorPage ?? "login";
      return clearOAuthCookie(oauthSignInErrorRedirect(origin, errorPage, "google"));
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
