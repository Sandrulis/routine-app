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
import { getTeamGoogleDriveStatusAction } from "@/app/lib/google-drive/actions";
import {
  isGoogleDriveReadyForUploads,
  type GoogleDriveStatus,
} from "@/app/lib/google-drive/repository";
import { useTeam } from "@/app/lib/team-store";

export const GOOGLE_DRIVE_STATUS_EVENT = "routine-app-google-drive-status";

export function notifyGoogleDriveStatusChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GOOGLE_DRIVE_STATUS_EVENT));
}

type TeamGoogleDriveContextValue = {
  loaded: boolean;
  ready: boolean;
  status: GoogleDriveStatus | null;
  refresh: () => Promise<void>;
};

const TeamGoogleDriveContext = createContext<TeamGoogleDriveContextValue | null>(
  null,
);

export function TeamGoogleDriveProvider({ children }: { children: ReactNode }) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id ?? null;
  const [status, setStatus] = useState<GoogleDriveStatus | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!teamId) {
      setStatus(null);
      setLoaded(true);
      return;
    }
    const result = await getTeamGoogleDriveStatusAction(teamId);
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
    window.addEventListener(GOOGLE_DRIVE_STATUS_EVENT, handleChange);
    return () => {
      window.removeEventListener(GOOGLE_DRIVE_STATUS_EVENT, handleChange);
    };
  }, [refresh]);

  const value = useMemo<TeamGoogleDriveContextValue>(
    () => ({
      loaded,
      ready: isGoogleDriveReadyForUploads(status),
      status,
      refresh,
    }),
    [loaded, refresh, status],
  );

  return (
    <TeamGoogleDriveContext.Provider value={value}>
      {children}
    </TeamGoogleDriveContext.Provider>
  );
}

export function useTeamGoogleDrive(): TeamGoogleDriveContextValue {
  const context = useContext(TeamGoogleDriveContext);
  if (context) return context;
  return {
    loaded: true,
    ready: false,
    status: null,
    refresh: async () => {},
  };
}
