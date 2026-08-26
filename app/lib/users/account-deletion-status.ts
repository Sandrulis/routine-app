import { cache } from "react";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export type AccountDeletionStatus = {
  accountStatus: "active" | "pending_deletion";
  deletionRequestedAt: string | null;
  deletionScheduledAt: string | null;
};

const EMPTY_STATUS: AccountDeletionStatus = {
  accountStatus: "active",
  deletionRequestedAt: null,
  deletionScheduledAt: null,
};

export const getCurrentUserAccountDeletionStatus = cache(
  async function getCurrentUserAccountDeletionStatus(): Promise<AccountDeletionStatus> {
    if (!isSupabaseConfigured()) {
      return EMPTY_STATUS;
    }

    const user = await getCurrentUser();
    if (!user) {
      return EMPTY_STATUS;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("account_status, deletion_requested_at, deletion_scheduled_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      return EMPTY_STATUS;
    }

    const accountStatus =
      data.account_status === "pending_deletion" ? "pending_deletion" : "active";

    return {
      accountStatus,
      deletionRequestedAt: data.deletion_requested_at,
      deletionScheduledAt: data.deletion_scheduled_at,
    };
  },
);
