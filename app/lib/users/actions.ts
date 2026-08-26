"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import type { UserDisplayPreferences } from "@/app/lib/site-admin/display-preferences";
import { isValidTimeZone } from "@/app/lib/cron-jobs/timezone";
import { joinDisplayName } from "@/app/lib/users/display-name";

export type SaveUserPersonalInfoInput = {
  firstName: string;
  lastName: string;
};

export async function saveUserPersonalInfoAction(
  input: SaveUserPersonalInfoInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName) {
    return { ok: false, error: "errors.first_name_required" };
  }
  if (!lastName) {
    return { ok: false, error: "errors.last_name_required" };
  }

  const fullName = joinDisplayName(firstName, lastName);
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_current_user_name", {
    p_name: fullName,
  });

  if (error) {
    return { ok: false, error: "errors.user_profile_failed" };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings/profile");
  return { ok: true };
}

export async function saveUserDisplayPreferencesAction(
  input: UserDisplayPreferences,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_current_user_display_preferences", {
    p_week_start_day: input.weekStartDay,
    p_date_format: input.dateFormat,
    p_date_separator: input.dateSeparator,
    p_time_format: input.timeFormat,
  });

  if (error) {
    return { ok: false, error: "errors.user_profile_failed" };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings/profile");
  return { ok: true };
}

export async function fetchNotificationPreferencesAction(): Promise<
  { ok: true; data: Record<string, boolean> } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const { mergeNotificationPreferences } = await import(
    "@/app/lib/notification-preferences"
  );
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("kind, enabled")
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: "errors.user_profile_failed" };
  }

  const partial: Partial<Record<string, boolean>> = {};
  for (const row of data ?? []) {
    partial[row.kind] = row.enabled;
  }

  return { ok: true, data: mergeNotificationPreferences(partial) };
}

export async function saveNotificationPreferencesAction(
  input: Record<string, boolean>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const { NOTIFICATION_PREFERENCE_KINDS, mergeNotificationPreferences } =
    await import("@/app/lib/notification-preferences");
  const preferences = mergeNotificationPreferences(input);
  const rows = NOTIFICATION_PREFERENCE_KINDS.map((kind) => ({
    user_id: user.id,
    kind,
    enabled: preferences[kind],
    updated_at: new Date().toISOString(),
  }));

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_notification_preferences")
    .upsert(rows, { onConflict: "user_id,kind" });

  if (error) {
    return { ok: false, error: "errors.user_profile_failed" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveCurrentUserTimezoneAction(
  timeZone: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }
  if (!isValidTimeZone(timeZone)) {
    return { ok: false, error: "errors.invalid_timezone" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_current_user_timezone", {
    p_timezone: timeZone,
  });
  if (error) {
    return { ok: false, error: "errors.user_profile_failed" };
  }
  return { ok: true };
}

function mapAccountDeletionRpcError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("last_admin")) {
    return "errors.last_admin";
  }
  if (normalized.includes("account_deletion_already_pending")) {
    return "errors.account_deletion_already_pending";
  }
  if (normalized.includes("account_deletion_not_pending")) {
    return "errors.account_deletion_not_pending";
  }
  return "errors.account_deletion_failed";
}

export async function requestAccountDeletionAction(): Promise<
  { ok: true; scheduledAt: string } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_account_deletion");
  if (error) {
    return { ok: false, error: mapAccountDeletionRpcError(error.message) };
  }

  const scheduledAt = typeof data === "string" ? data : String(data ?? "");
  await supabase.auth.signOut({ scope: "global" });

  revalidatePath("/", "layout");
  return { ok: true, scheduledAt };
}

export async function cancelAccountDeletionAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_account_deletion");
  if (error) {
    return { ok: false, error: mapAccountDeletionRpcError(error.message) };
  }

  revalidatePath("/", "layout");
  revalidatePath("/account/pending-deletion");
  revalidatePath("/settings/profile");
  return { ok: true };
}
