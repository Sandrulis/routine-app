import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type AuthUserEmailLookup = {
  id: string;
  emailConfirmed: boolean;
};

/**
 * O(1) auth user lookup by email via security-definer RPC on auth.users.
 * Avoids admin.listUsers pagination.
 */
export async function findAuthUserByEmailExact(
  email: string,
): Promise<AuthUserEmailLookup | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("find_auth_user_by_email", {
    p_email: normalized,
  });

  if (error || !data) {
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object" || !("id" in row)) {
    return null;
  }

  const id = typeof row.id === "string" ? row.id : "";
  if (!id) {
    return null;
  }

  return {
    id,
    emailConfirmed: Boolean(
      "email_confirmed_at" in row ? row.email_confirmed_at : null,
    ),
  };
}
