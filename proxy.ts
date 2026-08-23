import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/app/lib/supabase/update-session";
import {
  DEFAULT_LANGUAGE,
  type LanguageCode,
} from "@/app/lib/i18n/language";
import {
  isPublicLocalizedPath,
  stripLocalePrefix,
  UI_LANGUAGE_HEADER,
  urlLanguageFromPath,
} from "@/app/lib/seo/locale-path";
import { canonicalHostRedirectUrl } from "@/app/lib/seo/site-url";

function withLanguageHeader(request: NextRequest, languageCode: LanguageCode) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(UI_LANGUAGE_HEADER, languageCode);
  return requestHeaders;
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
  const canonicalUrl = canonicalHostRedirectUrl(
    request.url,
    request.headers.get("host"),
  );
  if (canonicalUrl) {
    const redirect = NextResponse.redirect(canonicalUrl, 301);
    const origin = request.headers.get("origin") ?? "";
    if (origin.startsWith("chrome-extension://")) {
      redirect.headers.set("Access-Control-Allow-Origin", origin);
      redirect.headers.set("Access-Control-Allow-Credentials", "true");
      redirect.headers.set("Vary", "Origin");
    }
    return redirect;
  }

  const { pathname } = request.nextUrl;

  if (isPublicLocalizedPath(pathname)) {
    const urlLang = urlLanguageFromPath(pathname);
    const basePath = stripLocalePrefix(pathname);

    if (urlLang === DEFAULT_LANGUAGE) {
      const url = request.nextUrl.clone();
      url.pathname = basePath;
      return NextResponse.redirect(url, 308);
    }

    const languageCode = urlLang ?? DEFAULT_LANGUAGE;
    const requestHeaders = withLanguageHeader(request, languageCode);
    const sessionResponse = await updateSession(request, requestHeaders);

    if (sessionResponse.headers.has("location")) {
      return sessionResponse;
    }

    if (urlLang) {
      const url = request.nextUrl.clone();
      url.pathname = basePath;
      const rewrite = NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
      copySessionOnto(sessionResponse, rewrite);
      return rewrite;
    }

    return sessionResponse;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/extension/|api/webhooks/|calendar/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ics)$).*)",
  ],
};
