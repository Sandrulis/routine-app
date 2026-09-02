import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import {
  defaultCloudFolderFromTeamName,
  LEGACY_CLOUD_FOLDER,
} from "@/app/lib/cloud-storage/sanitize-folder-path";

/** Resolve the default cloud folder path from the team's current name. */
export async function resolveDefaultCloudFolderPath(
  teamId: string,
): Promise<string> {
  if (!isSupabaseAdminConfigured()) return LEGACY_CLOUD_FOLDER;
  const admin = createAdminClient();
  const { data } = await admin
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .maybeSingle();
  return defaultCloudFolderFromTeamName(
    typeof data?.name === "string" ? data.name : null,
  );
}
