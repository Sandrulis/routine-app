"use client";

import { useEffect, useRef } from "react";
import { useTeamBillingAccess } from "@/app/lib/billing/use-team-billing-access";
import { useTeam } from "@/app/lib/team-store";

const POLL_MS = 4_000;

/**
 * Polls team-store while billing block or scheduled cancellation is active,
 * so banners/paywall disappear after payment without a full page reload.
 */
export function useTeamBillingLiveSync() {
  const { refreshTeams, currentTeam, membersByTeam } = useTeam();
  const access = useTeamBillingAccess();
  const inFlightRef = useRef(false);

  const members = currentTeam ? (membersByTeam[currentTeam.id] ?? []) : [];
  const hasPendingSeats = members.some(
    (member) => member.seatStatus === "pending_payment",
  );

  useEffect(() => {
    const needsPoll =
      access.subscriptionRequired ||
      access.memberBlocked ||
      (currentTeam?.subscriptionCancelAtPeriodEnd === true &&
        access.canManageBilling) ||
      (hasPendingSeats && access.canManageBilling);

    if (!needsPoll || !currentTeam?.id) return;

    let cancelled = false;

    async function tick() {
      if (cancelled || inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await refreshTeams();
      } finally {
        inFlightRef.current = false;
      }
    }

    void tick();
    const interval = setInterval(() => void tick(), POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void tick();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [
    access.canManageBilling,
    access.memberBlocked,
    access.subscriptionRequired,
    currentTeam?.id,
    currentTeam?.subscriptionCancelAtPeriodEnd,
    hasPendingSeats,
    refreshTeams,
  ]);
}
