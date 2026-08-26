import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  parseRememberSession,
  REMEMBER_SESSION_COOKIE,
  toResponseCookieOptions,
  withAuthCookieOptions,
} from "@/app/lib/auth/remember-session";
import { getSupabasePublicEnv } from "@/app/lib/supabase/env";
import { stripLocalePrefix } from "@/app/lib/seo/locale-path";
import { isCrawlerUserAgent } from "@/app/lib/seo/crawler";
import {
  applyAccountDeletionReactivatedCookie,
} from "@/app/lib/users/account-deletion-cookie";
import { reactivatePendingAccountDeletion } from "@/app/lib/users/reactivate-pending-deletion";

const AUTH_PAGES = new Set(["/login", "/signup", "/forgot-password"]);

/** App shell routes that require an authenticated Supabase session. */
function isProtectedAppPath(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/lists" ||
    pathname.startsWith("/lists/") ||
    pathname === "/team" ||
    pathname.startsWith("/team/") ||
    pathname === "/templates" ||
    pathname.startsWith("/templates/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/settings/") ||
    pathname === "/update-password"
  );
}

function markReactivatedAccount(response: NextResponse) {
  applyAccountDeletionReactivatedCookie(response);
  return response;
}

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");
}

function redirectToDashboard(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/dashboard";
  url.search = "";
  const response = NextResponse.redirect(url);
  applyNoStoreHeaders(response);
  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const response = NextResponse.redirect(url);
  applyNoStoreHeaders(response);
  return response;
}

export async function updateSession(
  request: NextRequest,
  requestHeaders?: Headers,
) {
  const env = getSupabasePublicEnv();
  const nextInit = requestHeaders
    ? { request: { headers: requestHeaders } }
    : { request };

  if (!env) {
    return NextResponse.next(nextInit);
  }

  const pathname = stripLocalePrefix(request.nextUrl.pathname);
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  let supabaseResponse = NextResponse.next(nextInit);
  const remember = parseRememberSession(
    request.cookies.get(REMEMBER_SESSION_COOKIE)?.value,
  );

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        const nextCookies = withAuthCookieOptions(cookiesToSet, remember);
        nextCookies.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next(nextInit);
        nextCookies.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(
            name,
            value,
            toResponseCookieOptions(options),
          ),
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const reactivated = await reactivatePendingAccountDeletion(supabase, user.id);

    if (
      (pathname === "/" || AUTH_PAGES.has(pathname)) &&
      !(pathname === "/" && isCrawlerUserAgent(request.headers.get("user-agent")))
    ) {
      const response = redirectToDashboard(request);
      if (reactivated) {
        markReactivatedAccount(response);
      }
      return response;
    }

    if (reactivated) {
      markReactivatedAccount(supabaseResponse);
    }
  } else if (isProtectedAppPath(pathname)) {
    return redirectToLogin(request);
  }

  applyNoStoreHeaders(supabaseResponse);
  if (!isProtectedAppPath(pathname) && !AUTH_PAGES.has(pathname) && pathname !== "/update-password") {
    supabaseResponse.headers.set(
      "Cache-Control",
      "private, max-age=0, must-revalidate",
    );
  }
  return supabaseResponse;
}
