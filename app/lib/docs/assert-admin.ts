import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createClient } from "@/app/lib/supabase/server";

export async function requireDocsAdminJson(): Promise<
  | { ok: true }
  | { ok: false; status: number; error: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, status: 401, error: "errors.auth_required" };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin =
    profile?.is_admin === true ||
    (await supabase.rpc("current_user_is_admin")).data === true;
  if (!isAdmin) {
    return { ok: false, status: 403, error: "errors.auth_required" };
  }
  return { ok: true };
}
