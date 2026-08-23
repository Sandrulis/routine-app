import { createClient } from "@supabase/supabase-js";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
  isSupabaseAdminConfigured,
} from "@/app/lib/supabase/env";

export function createAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "Supabase admin env is missing. Set SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const env = getSupabasePublicEnv();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!env || !serviceKey) {
    throw new Error(
      "Supabase admin env is missing. Set SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(
    env.url,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
