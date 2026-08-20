"use server";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  getCalendarIntegration,
  regenerateCalendarFeedToken,
  upsertCalendarIntegration,
} from "@/app/lib/calendar/repository";
import type {
  CalendarIntegrationSummary,
  CalendarProvider,
} from "@/app/lib/calendar/types";

type ActionOk = { ok: true; data: CalendarIntegrationSummary };
type ActionResult = ActionOk | { ok: false; error: string };

function isCalendarProvider(value: string | null): value is CalendarProvider {
  return value === "apple" || value === "google";
}

export async function fetchCalendarIntegrationAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }

  try {
    const data = await getCalendarIntegration(user.id);
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "errors.calendar_load_failed";
    return { ok: false, error: message };
  }
}

export async function saveCalendarIntegrationAction(input: {
  enabled: boolean;
  provider: CalendarProvider | null;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }

  const provider = input.provider && isCalendarProvider(input.provider) ? input.provider : null;
  if (input.enabled && !provider) {
    return { ok: false, error: "errors.calendar_provider_required" };
  }

  try {
    const data = await upsertCalendarIntegration(user.id, {
      enabled: input.enabled,
      provider,
    });
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "errors.calendar_save_failed";
    return { ok: false, error: message };
  }
}

export async function regenerateCalendarFeedTokenAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }

  try {
    const data = await regenerateCalendarFeedToken(user.id);
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "errors.calendar_save_failed";
    return { ok: false, error: message };
  }
}
