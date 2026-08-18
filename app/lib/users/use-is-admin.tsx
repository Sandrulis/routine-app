"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { createClient } from "@/app/lib/supabase/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

type AdminContextValue = {
  isAdmin: boolean;
  isReady: boolean;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, isReady: authReady } = useAuthSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    if (!user || !isSupabaseConfigured()) {
      setIsAdmin(false);
      setIsReady(true);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    void Promise.all([
      supabase.rpc("current_user_is_admin"),
      supabase.from("users").select("is_admin").eq("id", user.id).maybeSingle(),
    ]).then(([rpcResult, profileResult]) => {
      if (cancelled) return;
      const fromRpc = !rpcResult.error && rpcResult.data === true;
      const fromProfile = profileResult.data?.is_admin === true;
      setIsAdmin(fromRpc || fromProfile);
      setIsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  const value = useMemo(() => ({ isAdmin, isReady }), [isAdmin, isReady]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useIsAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useIsAdmin must be used within AdminProvider");
  }
  return context;
}
