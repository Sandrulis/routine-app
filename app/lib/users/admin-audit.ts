import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { logError } from "@/app/lib/security/log-error";

export async function logAdminAudit(input: {
  actorId: string;
  action: string;
  target?: string;
}) {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_events").insert({
      actor_id: input.actorId,
      action: input.action.slice(0, 120),
      target: (input.target ?? "").slice(0, 500),
    });
  } catch (error) {
    logError("admin audit insert failed", error);
  }
}
