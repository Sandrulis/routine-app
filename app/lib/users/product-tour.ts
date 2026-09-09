import { cache } from "react";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

/** True when the guided tour should not auto-start. Failures default to true. */
export const getCurrentUserProductTourCompleted = cache(
  async function getCurrentUserProductTourCompleted(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return true;
    }

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return true;
      }

      const { data, error } = await supabase
        .from("users")
        .select("product_tour_completed_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        return true;
      }

      return Boolean(data.product_tour_completed_at);
    } catch (error) {
      console.error("getCurrentUserProductTourCompleted failed:", error);
      return true;
    }
  },
);
