import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getClientCountryCode, getClientIp } from "@/app/lib/security/client-ip";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export async function recordCurrentUserLastIp(): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const ip = await getClientIp();
  if (!ip || ip === "unknown") return;

  const user = await getCurrentUser();
  if (!user) return;

  const countryCode = await getClientCountryCode();

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc("record_user_last_ip", {
      p_user_id: user.id,
      p_ip: ip,
      p_country_code: countryCode,
    });
    if (error) {
      console.error("record_user_last_ip failed:", error.message);
    }
  } catch (error) {
    console.error(
      "record_user_last_ip failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
