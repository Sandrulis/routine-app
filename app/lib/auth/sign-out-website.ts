import {
  clearBrowserAuthCookies,
} from "@/app/lib/auth/remember-session";
import {
  createClient,
  discardBrowserClient,
} from "@/app/lib/supabase/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

/**
 * Sign out of the website only. Do not call GoTrue `/logout`:
 * `signOut({ scope: "local" })` still revokes that session server-side,
 * which would also drop the Gmail plugin if it shares the refresh token.
 */
export async function signOutWebsiteLocally() {
  if (!isSupabaseConfigured()) return;
  try {
    createClient().auth.stopAutoRefresh();
  } catch {
    // Client may not be initialised.
  }
  clearBrowserAuthCookies();
  discardBrowserClient();
}
