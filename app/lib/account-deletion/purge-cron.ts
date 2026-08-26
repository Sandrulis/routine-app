import { prepareUserForAccountDeletion } from "@/app/lib/account-deletion/prepare-user-deletion";
import { recordCronJobRun } from "@/app/lib/cron-jobs/repository";
import type { CronJobRunResult } from "@/app/lib/cron-jobs/run";
import { createAdminClient } from "@/app/lib/supabase/admin";

const PURGE_BATCH_LIMIT = 20;

export async function executeAccountDeletionPurgeCron(): Promise<CronJobRunResult> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id")
      .eq("account_status", "pending_deletion")
      .lte("deletion_scheduled_at", now)
      .order("deletion_scheduled_at", { ascending: true })
      .limit(PURGE_BATCH_LIMIT);

    if (error) {
      throw error;
    }

    const candidates = users ?? [];
    if (candidates.length === 0) {
      const result = {
        ok: true,
        message: "No accounts scheduled for deletion.",
        notifiedCount: 0,
        scannedCount: 0,
      };
      await recordCronJobRun(supabase, "purge_scheduled_account_deletions", {
        ok: result.ok,
        message: result.message,
        notifiedCount: result.notifiedCount,
      });
      return result;
    }

    let purgedCount = 0;
    const failures: string[] = [];

    for (const user of candidates) {
      try {
        await prepareUserForAccountDeletion(supabase, user.id);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          throw deleteError;
        }
        purgedCount += 1;
      } catch (purgeError) {
        const message =
          purgeError instanceof Error ? purgeError.message : "Account purge failed.";
        failures.push(`${user.id}: ${message}`);
      }
    }

    const result = {
      ok: failures.length === 0,
      message:
        failures.length === 0
          ? `Purged ${purgedCount} account(s).`
          : `Purged ${purgedCount} account(s); ${failures.length} failed.`,
      notifiedCount: purgedCount,
      scannedCount: candidates.length,
    };

    await recordCronJobRun(supabase, "purge_scheduled_account_deletions", {
      ok: result.ok,
      message: failures.length > 0 ? failures.join(" | ") : result.message,
      notifiedCount: result.notifiedCount,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account purge cron failed.";
    const failed = {
      ok: false,
      message,
      notifiedCount: 0,
      scannedCount: 0,
    };
    try {
      await recordCronJobRun(supabase, "purge_scheduled_account_deletions", failed);
    } catch {
      // Keep the original error.
    }
    return failed;
  }
}
