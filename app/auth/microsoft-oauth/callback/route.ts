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
  isMicrosoftOAuthEnabled,
  MICROSOFT_OAUTH_ADMIN_PAGE_PATH,
  markMicrosoftOAuthConfigured,
} from "@/app/lib/integrations/microsoft-oauth/repository";
import {
  exchangeMicrosoftOAuthCode,
  fetchMicrosoftOAuthUserInfo,
  microsoftOAuthConfigureCookieOptions,
  MICROSOFT_OAUTH_OAUTH_COOKIE,
  parseMicrosoftOAuthConfigureState,
} from "@/app/lib/integrations/microsoft-oauth/oauth";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { createClient } from "@/app/lib/supabase/server";

function redirectToIntegrationsPage(origin: string, query: Record<string, string>) {
  const url = new URL(MICROSOFT_OAUTH_ADMIN_PAGE_PATH, origin);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

function clearOAuthCookie(response: NextResponse) {
  response.cookies.set(MICROSOFT_OAUTH_OAUTH_COOKIE, "", {
    ...microsoftOAuthConfigureCookieOptions(0),
    maxAge: 0,
  });
  return response;
}

async function handleLogin(request: Request, origin: string, code: string) {
  const cookieStore = await cookies();
  const loginState = parseOAuthLoginState(
    cookieStore.get(MICROSOFT_OAUTH_OAUTH_COOKIE)?.value,
  );
  const urlState = parseOAuthLoginState(new URL(request.url).searchParams.get("state"));
  const errorPage = loginState?.errorPage ?? urlState?.errorPage ?? "login";

  if (!oauthLoginStatesMatch(loginState, urlState) || !loginState) {
    return clearOAuthCookie(oauthSignInErrorRedirect(origin, errorPage, "microsoft"));
  }

  if (!(await isMicrosoftOAuthEnabled())) {
    return clearOAuthCookie(oauthSignInErrorRedirect(origin, errorPage, "microsoft"));
  }

  const tokens = await exchangeMicrosoftOAuthCode(origin, code);
  if (!tokens?.access_token) {
    return clearOAuthCookie(oauthSignInErrorRedirect(origin, errorPage, "microsoft"));
  }

  const profile = await fetchMicrosoftOAuthUserInfo(
    tokens.access_token,
    tokens.id_token,
  );
  const response = await completeOAuthSignIn(request, {
    origin,
    next: loginState.next,
    errorPage,
    profile: {
      email: profile.email,
      name: profile.name,
      avatarUrl: "",
      provider: "microsoft",
    },
  });
  return clearOAuthCookie(response);
}

export async function GET(request: Request) {
  const limited = consumeRateLimit(
    `oauth-microsoft:${requestClientIp(request)}`,
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
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(MICROSOFT_OAUTH_OAUTH_COOKIE)?.value;
  const loginCookie = parseOAuthLoginState(cookieValue);
  const loginUrl = parseOAuthLoginState(stateParam);

  if (loginCookie || loginUrl) {
    if (searchParams.get("error") === "access_denied") {
      const errorPage = loginCookie?.errorPage ?? loginUrl?.errorPage ?? "login";
      return clearOAuthCookie(NextResponse.redirect(new URL(`/${errorPage}`, origin)));
    }
    if (!code) {
      const errorPage = loginCookie?.errorPage ?? loginUrl?.errorPage ?? "login";
      return clearOAuthCookie(oauthSignInErrorRedirect(origin, errorPage, "microsoft"));
    }
    return handleLogin(request, origin, code);
  }

  const cookieState = parseMicrosoftOAuthConfigureState(cookieValue);
  const urlState = parseMicrosoftOAuthConfigureState(stateParam);

  if (
    !code ||
    !cookieState ||
    !urlState ||
    cookieState.adminUserId !== urlState.adminUserId ||
    cookieState.nonce !== urlState.nonce
  ) {
    return clearOAuthCookie(
      redirectToIntegrationsPage(origin, { error: "microsoft_oauth" }),
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

  const tokens = await exchangeMicrosoftOAuthCode(origin, code);
  if (!tokens?.access_token) {
    return clearOAuthCookie(
      redirectToIntegrationsPage(origin, { error: "microsoft_oauth" }),
    );
  }

  const account = await fetchMicrosoftOAuthUserInfo(
    tokens.access_token,
    tokens.id_token,
  );
  const saved = await markMicrosoftOAuthConfigured({
    accountEmail: account.email,
    configuredBy: cookieState.adminUserId,
  });

  if (saved.ok) {
    revalidatePath("/admin/integrations");
    revalidatePath("/admin/modules");
    revalidatePath("/login");
    revalidatePath("/signup");
  }

  return clearOAuthCookie(
    redirectToIntegrationsPage(
      origin,
      saved.ok ? { ms_configured: "1" } : { error: "microsoft_oauth" },
    ),
  );
}
