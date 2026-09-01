import { cache } from "react";
import { createClient as createUserServerClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { todayIsoDate } from "@/app/lib/format-display-date";
import {
  normalizeLocalizedValues,
  parseLocalizedValues,
} from "@/app/lib/i18n/localized-values";
import type { ActionResult } from "@/app/lib/actions/action-result";
import type {
  SiteAnnouncementInput,
  SiteAnnouncementSummary,
} from "@/app/lib/announcements/types";

export type {
  SiteAnnouncementInput,
  SiteAnnouncementSummary,
} from "@/app/lib/announcements/types";

type SiteAnnouncementRow = {
  id: string;
  title_values: unknown;
  body_values: unknown;
  expires_at: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

const ANNOUNCEMENT_SELECT =
  "id, title_values, body_values, expires_at, is_enabled, created_at, updated_at";

const TITLE_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 4000;

function mapAnnouncementRow(row: SiteAnnouncementRow): SiteAnnouncementSummary {
  return {
    id: row.id,
    titleValues: parseLocalizedValues(row.title_values),
    bodyValues: parseLocalizedValues(row.body_values),
    expiresAt: row.expires_at.slice(0, 10),
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function clampLocalizedValues(
  values: ReturnType<typeof normalizeLocalizedValues>,
  maxLength: number,
) {
  return Object.fromEntries(
    Object.entries(values).map(([code, text]) => [code, text.slice(0, maxLength)]),
  );
}

function validateAnnouncementInput(
  input: SiteAnnouncementInput,
):
  | {
      ok: true;
      titleValues: SiteAnnouncementInput["titleValues"];
      bodyValues: SiteAnnouncementInput["bodyValues"];
      expiresAt: string;
    }
  | { ok: false; error: string } {
  const titleValues = clampLocalizedValues(
    normalizeLocalizedValues(input.titleValues),
    TITLE_MAX_LENGTH,
  );
  const bodyValues = clampLocalizedValues(
    normalizeLocalizedValues(input.bodyValues),
    BODY_MAX_LENGTH,
  );
  const expiresAt = input.expiresAt.trim();

  if (!Object.values(titleValues).some((value) => value.trim())) {
    return { ok: false, error: "errors.announcement_title_required" };
  }
  if (!expiresAt) {
    return { ok: false, error: "errors.announcement_expires_required" };
  }
  if (!isIsoDate(expiresAt)) {
    return { ok: false, error: "errors.announcement_expires_invalid" };
  }

  return { ok: true, titleValues, bodyValues, expiresAt };
}

export const listSiteAnnouncements = cache(
  async (): Promise<SiteAnnouncementSummary[]> => {
    if (!isSupabaseConfigured()) return [];

    const supabase = await createUserServerClient();
    const { data, error } = await supabase
      .from("site_announcements")
      .select(ANNOUNCEMENT_SELECT)
      .order("created_at", { ascending: false });

    if (error || !data) {
      if (error) console.error("listSiteAnnouncements failed:", error.message);
      return [];
    }

    return (data as SiteAnnouncementRow[]).map(mapAnnouncementRow);
  },
);

export const listActiveSiteAnnouncements = cache(
  async (): Promise<SiteAnnouncementSummary[]> => {
    if (!isSupabaseConfigured()) return [];

    const supabase = await createUserServerClient();
    const { data, error } = await supabase
      .from("site_announcements")
      .select(ANNOUNCEMENT_SELECT)
      .eq("is_enabled", true)
      .gte("expires_at", todayIsoDate())
      .order("created_at", { ascending: false });

    if (error || !data) {
      if (error) console.error("listActiveSiteAnnouncements failed:", error.message);
      return [];
    }

    return (data as SiteAnnouncementRow[]).map(mapAnnouncementRow);
  },
);

export async function createSiteAnnouncement(
  input: SiteAnnouncementInput,
): Promise<ActionResult<SiteAnnouncementSummary>> {
  const validated = validateAnnouncementInput(input);
  if (!validated.ok) return validated;

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .insert({
      title_values: validated.titleValues,
      body_values: validated.bodyValues,
      expires_at: validated.expiresAt,
      is_enabled: input.isEnabled,
    })
    .select(ANNOUNCEMENT_SELECT)
    .single();

  if (error || !data) {
    console.error("createSiteAnnouncement failed:", error?.message);
    return { ok: false, error: "errors.announcement_create_failed" };
  }

  return {
    ok: true,
    data: mapAnnouncementRow(data as SiteAnnouncementRow),
  };
}

export async function updateSiteAnnouncement(
  id: string,
  input: SiteAnnouncementInput,
): Promise<ActionResult<SiteAnnouncementSummary>> {
  const trimmedId = id.trim();
  if (!trimmedId) return { ok: false, error: "errors.announcement_not_found" };

  const validated = validateAnnouncementInput(input);
  if (!validated.ok) return validated;

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .update({
      title_values: validated.titleValues,
      body_values: validated.bodyValues,
      expires_at: validated.expiresAt,
      is_enabled: input.isEnabled,
    })
    .eq("id", trimmedId)
    .select(ANNOUNCEMENT_SELECT)
    .maybeSingle();

  if (error) {
    console.error("updateSiteAnnouncement failed:", error.message);
    return { ok: false, error: "errors.announcement_save_failed" };
  }
  if (!data) return { ok: false, error: "errors.announcement_not_found" };

  return {
    ok: true,
    data: mapAnnouncementRow(data as SiteAnnouncementRow),
  };
}

export async function updateSiteAnnouncementEnabled(
  id: string,
  isEnabled: boolean,
): Promise<ActionResult<SiteAnnouncementSummary>> {
  const trimmedId = id.trim();
  if (!trimmedId) return { ok: false, error: "errors.announcement_not_found" };

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .update({ is_enabled: isEnabled })
    .eq("id", trimmedId)
    .select(ANNOUNCEMENT_SELECT)
    .maybeSingle();

  if (error) {
    console.error("updateSiteAnnouncementEnabled failed:", error.message);
    return { ok: false, error: "errors.announcement_status_save_failed" };
  }
  if (!data) return { ok: false, error: "errors.announcement_not_found" };

  return {
    ok: true,
    data: mapAnnouncementRow(data as SiteAnnouncementRow),
  };
}

export async function deleteSiteAnnouncement(id: string): Promise<ActionResult> {
  const trimmedId = id.trim();
  if (!trimmedId) return { ok: false, error: "errors.announcement_not_found" };

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .delete()
    .eq("id", trimmedId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("deleteSiteAnnouncement failed:", error.message);
    return { ok: false, error: "errors.announcement_delete_failed" };
  }
  if (!data) return { ok: false, error: "errors.announcement_not_found" };

  return { ok: true };
}
