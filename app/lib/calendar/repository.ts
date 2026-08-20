import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import type { CalendarFeedEvent } from "@/app/lib/calendar/ics";
import {
  calendarFeedPath,
  createCalendarFeedToken,
} from "@/app/lib/calendar/token";
import type {
  CalendarIntegrationSummary,
  CalendarProvider,
} from "@/app/lib/calendar/types";

type IntegrationRow = {
  user_id: string;
  is_enabled: boolean;
  provider: CalendarProvider | null;
  feed_token: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  due_date: string;
  list_id: string;
};

const EMPTY_SUMMARY: CalendarIntegrationSummary = {
  enabled: false,
  provider: null,
  feedPath: null,
};

function mapSummary(row: IntegrationRow | null): CalendarIntegrationSummary {
  if (!row) return EMPTY_SUMMARY;
  return {
    enabled: row.is_enabled,
    provider: row.provider,
    feedPath: calendarFeedPath(row.feed_token),
  };
}

export async function getCalendarIntegration(
  userId: string,
): Promise<CalendarIntegrationSummary> {
  if (!isSupabaseConfigured()) return EMPTY_SUMMARY;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_calendar_integrations")
    .select("user_id, is_enabled, provider, feed_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getCalendarIntegration failed:", error.message);
    throw new Error("errors.calendar_load_failed");
  }

  return mapSummary((data as IntegrationRow | null) ?? null);
}

export async function upsertCalendarIntegration(
  userId: string,
  input: { enabled: boolean; provider: CalendarProvider | null },
): Promise<CalendarIntegrationSummary> {
  if (!isSupabaseConfigured()) {
    throw new Error("errors.db_not_configured");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("user_calendar_integrations")
    .select("feed_token")
    .eq("user_id", userId)
    .maybeSingle();

  const feedToken =
    (existing as { feed_token?: string } | null)?.feed_token ??
    createCalendarFeedToken();

  const { data, error } = await supabase
    .from("user_calendar_integrations")
    .upsert(
      {
        user_id: userId,
        is_enabled: input.enabled,
        provider: input.provider,
        feed_token: feedToken,
      },
      { onConflict: "user_id" },
    )
    .select("user_id, is_enabled, provider, feed_token")
    .single();

  if (error || !data) {
    console.error("upsertCalendarIntegration failed:", error?.message);
    throw new Error("errors.calendar_save_failed");
  }

  return mapSummary(data as IntegrationRow);
}

export async function regenerateCalendarFeedToken(
  userId: string,
): Promise<CalendarIntegrationSummary> {
  if (!isSupabaseConfigured()) {
    throw new Error("errors.db_not_configured");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("user_calendar_integrations")
    .select("is_enabled, provider")
    .eq("user_id", userId)
    .maybeSingle();

  const current = (existing as {
    is_enabled?: boolean;
    provider?: CalendarProvider | null;
  } | null) ?? { is_enabled: false, provider: null };

  const { data, error } = await supabase
    .from("user_calendar_integrations")
    .upsert(
      {
        user_id: userId,
        is_enabled: current.is_enabled ?? false,
        provider: current.provider ?? null,
        feed_token: createCalendarFeedToken(),
      },
      { onConflict: "user_id" },
    )
    .select("user_id, is_enabled, provider, feed_token")
    .single();

  if (error || !data) {
    console.error("regenerateCalendarFeedToken failed:", error?.message);
    throw new Error("errors.calendar_save_failed");
  }

  return mapSummary(data as IntegrationRow);
}

export async function loadCalendarFeedByToken(token: string): Promise<{
  calendarName: string;
  events: CalendarFeedEvent[];
} | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const admin = createAdminClient();
  const { data: integration, error: integrationError } = await admin
    .from("user_calendar_integrations")
    .select("user_id, is_enabled")
    .eq("feed_token", token)
    .maybeSingle();

  if (integrationError) {
    console.error("loadCalendarFeedByToken lookup failed:", integrationError.message);
    return null;
  }

  const row = integration as { user_id: string; is_enabled: boolean } | null;
  if (!row) return null;

  const { data: modules } = await admin
    .from("site_frontend_modules")
    .select("module_key, is_enabled")
    .eq("module_key", FRONTEND_MODULE_KEYS.calendar)
    .maybeSingle();

  const calendarModuleOn = Boolean(
    (modules as { is_enabled?: boolean } | null)?.is_enabled,
  );

  const { data: settings } = await admin
    .from("site_settings")
    .select("system_name")
    .limit(1)
    .maybeSingle();

  const calendarName = `${
    ((settings as { system_name?: string } | null)?.system_name || "Routine").trim()
  }`;

  if (!row.is_enabled || !calendarModuleOn) {
    return { calendarName, events: [] };
  }

  const events = await loadAssignedDatedTasks(admin, row.user_id);
  return { calendarName, events };
}

async function loadAssignedDatedTasks(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<CalendarFeedEvent[]> {
  const { data: members, error: membersError } = await admin
    .from("team_members")
    .select("id")
    .eq("user_id", userId);

  if (membersError) {
    console.error("calendar feed members failed:", membersError.message);
    return [];
  }

  const memberIds = ((members ?? []) as { id: string }[]).map((item) => item.id);
  if (memberIds.length === 0) return [];

  const { data: assignees, error: assigneesError } = await admin
    .from("task_assignees")
    .select("task_id")
    .in("member_id", memberIds);

  if (assigneesError) {
    console.error("calendar feed assignees failed:", assigneesError.message);
    return [];
  }

  const taskIds = [
    ...new Set(((assignees ?? []) as { task_id: string }[]).map((item) => item.task_id)),
  ];
  if (taskIds.length === 0) return [];

  const tasks: TaskRow[] = [];
  const chunkSize = 200;
  for (let index = 0; index < taskIds.length; index += chunkSize) {
    const chunk = taskIds.slice(index, index + chunkSize);
    const { data, error } = await admin
      .from("work_tasks")
      .select("id, title, description, start_date, due_date, list_id")
      .in("id", chunk)
      .in("kind", ["task", "subtask"])
      .is("deleted_at", null)
      .is("archived_at", null)
      .not("due_date", "is", null);

    if (error) {
      console.error("calendar feed tasks failed:", error.message);
      continue;
    }

    tasks.push(...((data ?? []) as TaskRow[]));
  }

  const origin = siteOrigin();
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    startDate: task.start_date ?? task.due_date,
    dueDate: task.due_date,
    url: `${origin}/lists/${task.list_id}/tasks/${task.id}`,
  }));
}

function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      return configured.replace(/\/$/, "");
    }
  }
  return "http://localhost:3120";
}
