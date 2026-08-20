import { redirect } from "next/navigation";
import { getMfaGate } from "@/app/lib/auth/mfa";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";
import { logAdminAudit } from "@/app/lib/users/admin-audit";

async function requireAdminUser() {
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

  const isAdmin =
    profile?.is_admin === true ||
    (await supabase.rpc("current_user_is_admin")).data === true;

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return { user, supabase };
}

export async function requireAdminLayout() {
  const { supabase } = await requireAdminUser();
  const gate = await getMfaGate(supabase);
  if (gate === "enroll") {
    redirect("/settings/profile?mfa=required");
  }
  return { needsMfaVerify: gate === "verify" };
}

export async function requireAdmin(audit?: { action: string; target?: string }) {
  const { user, supabase } = await requireAdminUser();
  const gate = await getMfaGate(supabase);
  if (gate === "enroll") {
    redirect("/settings/profile?mfa=required");
  }
  if (gate === "verify") {
    redirect("/admin");
  }
  if (audit) {
    await logAdminAudit({
      actorId: user.id,
      action: audit.action,
      target: audit.target,
    });
  }
  return user;
}
