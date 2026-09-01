import { createClient } from "@supabase/supabase-js";
import { userHasVerifiedTotp } from "@/app/lib/auth/mfa";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  getSupabasePublicEnv,
  isSupabaseAdminConfigured,
} from "@/app/lib/supabase/env";
import { logError } from "@/app/lib/security/log-error";

export type PluginAuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
};

function toPluginSession(session: {
  access_token: string;
  refresh_token?: string | null;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
}): PluginAuthSession | null {
  if (!session.access_token || !session.refresh_token) return null;
  const expiresIn = Number(session.expires_in) || 3600;
  const expiresAt =
    Number(session.expires_at) || Math.floor(Date.now() / 1000) + expiresIn;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: expiresAt,
    expires_in: expiresIn,
    token_type: session.token_type || "bearer",
  };
}

/**
 * New GoTrue session for the Gmail plugin, independent of the website
 * refresh-token family. Admin generateLink does not send email.
 */
export async function mintIndependentPluginSession(
  userId: string,
): Promise<PluginAuthSession | null> {
  if (!userId || !isSupabaseAdminConfigured()) return null;
  const env = getSupabasePublicEnv();
  if (!env) return null;

  try {
    const admin = createAdminClient();
    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(userId);
    const email = userData.user?.email?.trim() ?? "";
    if (userError || !email) {
      logError("mint plugin session: user", userError?.message);
      return null;
    }
    if (userHasVerifiedTotp(userData.user?.factors)) {
      // Magic-link mint is AAL1 and would skip TOTP. Caller must use the
      // post-MFA refresh token instead.
      return null;
    }

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
    const hashedToken = linkData?.properties?.hashed_token?.trim() ?? "";
    if (linkError || !hashedToken) {
      logError("mint plugin session: generateLink", linkError?.message);
      return null;
    }

    const supabase = createClient(env.url, env.anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: hashedToken,
    });
    if (error || !data.session) {
      logError("mint plugin session: verifyOtp", error?.message);
      return null;
    }
    return toPluginSession(data.session);
  } catch (error) {
    logError(
      "mint plugin session",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
