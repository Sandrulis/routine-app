import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export async function assertListAccess(
  listId: string,
  minLevel: "view" | "comment" | "edit" | "full_edit",
) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const trimmed = listId.trim();
  if (!trimmed) {
    return { ok: false as const, error: "errors.google_drive_forbidden" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("work_list_has_access", {
    p_list_id: trimmed,
    p_min: minLevel,
  });
  if (error || data !== true) {
    return { ok: false as const, error: "errors.google_drive_forbidden" };
  }
  return { ok: true as const };
}
