import { NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { createClient } from "@/app/lib/supabase/server";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function resolveRedirectOrigin(
  origin: string,
  forwardedHost: string | null,
): string {
  if (process.env.NODE_ENV === "development") {
    return origin;
  }

  if (ALLOWED_ORIGIN) {
    try {
      const allowed = new URL(ALLOWED_ORIGIN);
      if (forwardedHost && forwardedHost === allowed.host) {
        return `https://${forwardedHost}`;
      }
      return allowed.origin;
    } catch {
      return origin;
    }
  }

  return origin;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));
  const loginError = new URL("/login", origin);
  loginError.searchParams.set("error", "google");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(loginError);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      await ensureCurrentUserProfile();
      const forwardedHost = request.headers.get("x-forwarded-host");
      const redirectOrigin = resolveRedirectOrigin(origin, forwardedHost);
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }

    return NextResponse.redirect(loginError);
  }

  return NextResponse.redirect(loginError);
}
