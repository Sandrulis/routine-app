"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(!isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setIsReady(true);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user ?? null);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isReady };
}
