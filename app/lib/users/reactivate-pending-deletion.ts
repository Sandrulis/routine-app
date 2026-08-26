import type { SupabaseClient } from "@supabase/supabase-js";

export async function reactivatePendingAccountDeletion(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("account_status")
    .eq("id", userId)
    .maybeSingle();

  if (data?.account_status !== "pending_deletion") {
    return false;
  }

  const { error } = await supabase.rpc("cancel_account_deletion");
  return !error;
}
