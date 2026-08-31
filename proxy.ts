import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/app/lib/supabase/update-session";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CHOSEN_COOKIE,
  LANGUAGE_COOKIE,
  isLanguageNegotiationBot,
  resolveGuestLanguage,
  type LanguageCode,
} from "@/app/lib/i18n/language";
import {
  isPublicLocalizedPath,
  localePath,
  stripLocalePrefix,
  UI_LANGUAGE_HEADER,
  urlLanguageFromPath,
} from "@/app/lib/seo/locale-path";
import { canonicalHostRedirectUrl } from "@/app/lib/seo/site-url";
import {
  applyExtensionCors,
  extensionOptionsResponse,
  isExtensionApiPath,
} from "@/app/lib/extension/cors";
import {
  buildContentSecurityPolicy,
  createCspNonce,
} from "@/app/lib/security/csp";

function withLanguageHeader(request: NextRequest, languageCode: LanguageCode) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(UI_LANGUAGE_HEADER, languageCode);
  return requestHeaders;
}

function attachCspToRequest(requestHeaders: Headers, nonce: string, csp: string) {
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads the nonce from the request CSP header and stamps it on scripts.
  requestHeaders.set("Content-Security-Policy", csp);
}

function applyCsp(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

function copySessionOnto(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  from.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie" || lower.startsWith("x-middleware-")) return;
    to.headers.set(key, value);
  });
  return to;
}

export async function proxy(request: NextRequest) {
  const nonce = createCspNonce();
  const csp = buildContentSecurityPolicy(nonce);
  const { pathname } = request.nextUrl;

  if (isExtensionApiPath(pathname)) {
    if (request.method === "OPTIONS") {
      return extensionOptionsResponse(request);
    }
    return applyExtensionCors(request, NextResponse.next());
  }

  const canonicalUrl = canonicalHostRedirectUrl(
    request.url,
    request.headers.get("host"),
  );
  if (canonicalUrl) {
    const redirect = NextResponse.redirect(canonicalUrl, 301);
    const origin = request.headers.get("origin") ?? "";
    if (origin.startsWith("chrome-extension://")) {
      applyExtensionCors(request, redirect);
    }
    return applyCsp(redirect, csp);
  }

  if (isPublicLocalizedPath(pathname)) {
    const urlLang = urlLanguageFromPath(pathname);
    const basePath = stripLocalePrefix(pathname);

    if (urlLang === DEFAULT_LANGUAGE) {
      const url = request.nextUrl.clone();
      url.pathname = basePath;
      return applyCsp(NextResponse.redirect(url, 308), csp);
    }

    if (
      !urlLang &&
      (request.method === "GET" || request.method === "HEAD") &&
      !isLanguageNegotiationBot(request.headers.get("user-agent"))
    ) {
      const detected = resolveGuestLanguage({
        acceptLanguage: request.headers.get("accept-language"),
        cookieLanguage: request.cookies.get(LANGUAGE_COOKIE)?.value,
        chosenCookie: request.cookies.get(LANGUAGE_CHOSEN_COOKIE)?.value,
      });
      if (detected && detected !== DEFAULT_LANGUAGE) {
        const url = request.nextUrl.clone();
        url.pathname = localePath(basePath, detected);
        return applyCsp(NextResponse.redirect(url, 307), csp);
      }
    }

    const languageCode = urlLang ?? DEFAULT_LANGUAGE;
    const requestHeaders = withLanguageHeader(request, languageCode);
    attachCspToRequest(requestHeaders, nonce, csp);
    const sessionResponse = await updateSession(request, requestHeaders);

    if (sessionResponse.headers.has("location")) {
      return applyCsp(sessionResponse, csp);
    }

    if (urlLang) {
      const url = request.nextUrl.clone();
      url.pathname = basePath;
      const rewrite = NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
      copySessionOnto(sessionResponse, rewrite);
      return applyCsp(rewrite, csp);
    }

    return applyCsp(sessionResponse, csp);
  }

  const requestHeaders = new Headers(request.headers);
  attachCspToRequest(requestHeaders, nonce, csp);
  return applyCsp(await updateSession(request, requestHeaders), csp);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/webhooks/|api/cron/|calendar/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ics)$).*)",
  ],
};
