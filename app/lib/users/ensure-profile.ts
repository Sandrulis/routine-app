import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { createClient } from "@/app/lib/supabase/server";

export async function ensureCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const display = mapUserDisplay(user);
  const { error } = await supabase.rpc("ensure_user_profile", {
    p_name: display.name,
    p_avatar: display.avatarUrl ?? "",
  });

  if (error) {
    console.error("ensure_user_profile failed:", error.message);
  }
}
