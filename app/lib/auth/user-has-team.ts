import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export async function userHasTeam(userId: string): Promise<boolean> {
  const id = userId.trim();
  if (!id || !isSupabaseAdminConfigured()) return false;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .select("id")
    .eq("user_id", id)
    .limit(1);

  if (error) return false;
  return Boolean(data?.length);
}
