"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getTeamOneDriveStatusAction } from "@/app/lib/onedrive/actions";
import {
  isOneDriveReadyForUploads,
  type OneDriveStatus,
} from "@/app/lib/onedrive/repository";
import { useTeam } from "@/app/lib/team-store";

export const ONEDRIVE_STATUS_EVENT = "routine-app-onedrive-status";

export function notifyOneDriveStatusChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ONEDRIVE_STATUS_EVENT));
}

type TeamOneDriveContextValue = {
  loaded: boolean;
  ready: boolean;
  status: OneDriveStatus | null;
  refresh: () => Promise<void>;
};

const TeamOneDriveContext = createContext<TeamOneDriveContextValue | null>(null);

export function TeamOneDriveProvider({ children }: { children: ReactNode }) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id ?? null;
  const [status, setStatus] = useState<OneDriveStatus | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!teamId) {
      setStatus(null);
      setLoaded(true);
      return;
    }
    const result = await getTeamOneDriveStatusAction(teamId);
    setStatus(result.ok ? result.data : null);
    setLoaded(true);
  }, [teamId]);

  useEffect(() => {
    setLoaded(false);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    function handleChange() {
      void refresh();
    }
    window.addEventListener(ONEDRIVE_STATUS_EVENT, handleChange);
    return () => {
      window.removeEventListener(ONEDRIVE_STATUS_EVENT, handleChange);
    };
  }, [refresh]);

  const value = useMemo<TeamOneDriveContextValue>(
    () => ({
      loaded,
      ready: isOneDriveReadyForUploads(status),
      status,
      refresh,
    }),
    [loaded, refresh, status],
  );

  return (
    <TeamOneDriveContext.Provider value={value}>
      {children}
    </TeamOneDriveContext.Provider>
  );
}

export function useTeamOneDrive(): TeamOneDriveContextValue {
  const context = useContext(TeamOneDriveContext);
  if (context) return context;
  return {
    loaded: true,
    ready: false,
    status: null,
    refresh: async () => {},
  };
}
