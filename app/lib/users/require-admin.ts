import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

export async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureCurrentUserProfile();

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_admin === true) {
    return user;
  }

  const { data } = await supabase.rpc("current_user_is_admin");
  if (data === true) {
    return user;
  }

  redirect("/dashboard");
}
