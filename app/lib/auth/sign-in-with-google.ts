import { createClient } from "@/app/lib/supabase/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";

function getOAuthSiteUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export async function signInWithGoogle(returnPath?: string) {
  if (!isSupabaseConfigured()) {
    return {
      data: { provider: "google" as const, url: null },
      error: new Error("supabase_not_configured"),
    };
  }

  const supabase = createClient();
  const callbackUrl = new URL(`${getOAuthSiteUrl()}/auth/callback`);
  const safeReturnPath = getSafeRedirectPath(returnPath);

  if (safeReturnPath !== "/dashboard") {
    callbackUrl.searchParams.set("next", safeReturnPath);
  }

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });
}
