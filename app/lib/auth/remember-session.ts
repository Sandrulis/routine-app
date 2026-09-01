import type { CookieOptions } from "@supabase/ssr";
import { readCookie, writeCookie } from "@/app/lib/cookies";

export const REMEMBER_SESSION_COOKIE = "routine-app-remember-session";

/** Remember-me session: 30 days. Proportionate under GDPR storage limitation. */
export const AUTH_SESSION_MAX_AGE_DAYS = 30;
export const AUTH_SESSION_MAX_AGE = AUTH_SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

type AuthCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export function parseRememberSession(
  raw: string | null | undefined,
): boolean {
  return raw === "1" || raw === "true";
}

export function readRememberSessionPreference(): boolean {
  return parseRememberSession(readCookie(REMEMBER_SESSION_COOKIE));
}

export function writeRememberSessionPreference(remember: boolean) {
  writeCookie(
    REMEMBER_SESSION_COOKIE,
    remember ? "1" : "0",
    AUTH_SESSION_MAX_AGE,
  );
}

export function mergeAuthCookieOptions(
  options: CookieOptions | undefined,
  remember: boolean,
): CookieOptions {
  const deleting = options?.maxAge === 0;
  const merged: CookieOptions = {
    ...options,
    path: options?.path ?? "/",
    sameSite: options?.sameSite ?? "lax",
  };

  if (deleting) {
    merged.maxAge = 0;
    merged.expires = new Date(0);
    return merged;
  }

  if (remember) {
    merged.maxAge = AUTH_SESSION_MAX_AGE;
    merged.expires = new Date(Date.now() + AUTH_SESSION_MAX_AGE * 1000);
    return merged;
  }

  delete merged.maxAge;
  delete merged.expires;
  return merged;
}

export function withAuthCookieOptions(
  cookiesToSet: AuthCookie[],
  remember: boolean,
): AuthCookie[] {
  return cookiesToSet.map((cookie) => ({
    ...cookie,
    options: mergeAuthCookieOptions(cookie.options, remember),
  }));
}

export function toResponseCookieOptions(options?: CookieOptions) {
  const next: {
    path?: string;
    domain?: string;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
    httpOnly?: boolean;
    maxAge?: number;
    expires?: Date;
  } = {
    path: options?.path ?? "/",
    domain: options?.domain,
    secure:
      options?.secure ??
      (process.env.NODE_ENV === "production" ||
        (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://")),
    // Browser Supabase client still reads auth via document.cookie for RLS
    // queries. HttpOnly is set on OAuth state cookies separately.
    httpOnly: false,
  };

  if (
    options?.sameSite === "lax" ||
    options?.sameSite === "strict" ||
    options?.sameSite === "none"
  ) {
    next.sameSite = options.sameSite;
  } else {
    next.sameSite = "lax";
  }

  if (typeof options?.maxAge === "number") {
    next.maxAge = options.maxAge;
  }

  if (options?.expires instanceof Date) {
    next.expires = options.expires;
  }

  return next;
}

function isWebsiteAuthCookieName(name: string): boolean {
  return name === REMEMBER_SESSION_COOKIE || name.includes("-auth-token");
}

/** Clear Supabase auth cookies without revoking refresh tokens on the server. */
export function clearBrowserAuthCookies() {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const names = document.cookie.split("; ").flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [];
    const raw = part.slice(0, separator);
    try {
      return [decodeURIComponent(raw)];
    } catch {
      return [raw];
    }
  });
  for (const name of names) {
    if (!isWebsiteAuthCookieName(name)) continue;
    serializeBrowserAuthCookie(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
      secure,
    });
  }
}

export function serializeBrowserAuthCookie(
  name: string,
  value: string,
  options: CookieOptions | undefined,
) {
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=${options?.path ?? "/"}`,
  ];

  if (typeof options?.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options?.expires instanceof Date) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  const sameSite = options?.sameSite ?? "lax";
  parts.push(
    `SameSite=${sameSite === "none" ? "None" : sameSite === "strict" ? "Strict" : "Lax"}`,
  );

  if (options?.secure) {
    parts.push("Secure");
  }

  document.cookie = parts.join("; ");
}
