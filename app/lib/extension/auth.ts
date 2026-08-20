import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createClient as createServerClient } from "@/app/lib/supabase/server";
import { getSupabasePublicEnv, isSupabaseConfigured } from "@/app/lib/supabase/env";

export type ExtensionAuth = {
  user: User;
  supabase: SupabaseClient;
};

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim();
  return token || null;
}

/** Cookie session or Authorization: Bearer (Chrome extension). */
export async function getExtensionAuth(
  request: Request,
): Promise<ExtensionAuth | null> {
  if (!isSupabaseConfigured()) return null;

  const token = bearerToken(request);
  if (token) {
    const env = getSupabasePublicEnv();
    if (!env) return null;
    const supabase = createSupabaseClient(env.url, env.anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { user, supabase };
  }

  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createServerClient();
  return { user, supabase };
}
