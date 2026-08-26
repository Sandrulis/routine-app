import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { hasInvalidStripeCredentials } from "@/app/lib/integrations/stripe/client";
import { createClient } from "@/app/lib/supabase/server";

export async function stripeInvalidKeyNoticeForCurrentAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.is_admin !== true) return false;
  return hasInvalidStripeCredentials();
}
