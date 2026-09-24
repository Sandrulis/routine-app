"use client";

import { useEffect, useState } from "react";
import { listFactoryPresenceAction } from "@/app/lib/factory/actions";
import type { FactoryPresence } from "@/app/lib/factory/repository";
import { ONLINE_PRESENCE_POLL_MS } from "@/app/lib/last-online";

export function useFactoryPresence(teamId: string | null, enabled: boolean) {
  const [users, setUsers] = useState<FactoryPresence[]>([]);

  useEffect(() => {
    if (!enabled || !teamId) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    async function pull() {
      const result = await listFactoryPresenceAction(teamId as string);
      if (cancelled || !result.ok) return;
      setUsers(result.data);
    }
    void pull();
    const timer = window.setInterval(() => void pull(), ONLINE_PRESENCE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, teamId]);

  return users;
}
