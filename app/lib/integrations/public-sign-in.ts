import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/app/lib/supabase/env";
import { logError } from "@/app/lib/security/log-error";

export type PublicSignInMethods = {
  email: boolean;
  google: boolean;
  microsoft: boolean;
};

export const getPublicSignInMethods = cache(
  async function getPublicSignInMethods(): Promise<PublicSignInMethods | null> {
    const env = getSupabasePublicEnv();
    if (!env) return null;

    const supabase = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.rpc("public_sign_in_methods");
    if (error) {
      logError("public_sign_in_methods failed", error.message);
      return null;
    }
    let row: Record<string, unknown> | null = null;
    if (typeof data === "string") {
      try {
        const parsed: unknown = JSON.parse(data);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          row = parsed as Record<string, unknown>;
        }
      } catch {
        return null;
      }
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
      row = data as Record<string, unknown>;
    }
    if (!row) return null;
    return {
      email: row.email === true,
      google: row.google === true,
      microsoft: row.microsoft === true,
    };
  },
);
