import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CRON_JOB_KEYS } from "@/app/lib/cron-jobs/types";
import { EMAIL_TEMPLATE_KINDS } from "@/app/lib/email/templates";
import { messages } from "@/app/lib/i18n/messages";
import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import { createClient as createUserServerClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import type { AdminNavCountKey, AdminNavCounts } from "@/app/lib/site-admin/types";

async function countTable(
  supabase: SupabaseClient,
  table: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.error(`admin nav count ${table} failed:`, error.message);
    return 0;
  }
  return count ?? 0;
}

export const listAdminNavCounts = cache(async function listAdminNavCounts(): Promise<AdminNavCounts> {
  if (!isSupabaseConfigured()) {
    return {};
  }

  const supabase = await createUserServerClient();
  const [
    users,
    teams,
    roles,
    statuses,
    fileTypes,
    languages,
    docs,
    announcements,
    modules,
    paymentPlans,
  ] = await Promise.all([
    countTable(supabase, "users"),
    countTable(supabase, "teams"),
    countTable(supabase, "system_default_roles"),
    countTable(supabase, "task_statuses"),
    countTable(supabase, "file_type_extensions"),
    countTable(supabase, "site_languages"),
    countTable(supabase, "site_docs_categories"),
    countTable(supabase, "site_announcements"),
    countTable(supabase, "site_frontend_modules"),
    countTable(supabase, "site_payment_plans"),
  ]);

  const counts: Record<AdminNavCountKey, number> = {
    users,
    teams,
    roles,
    statuses,
    fileTypes,
    languages,
    translations: Object.keys(messages.lv).length,
    docs,
    announcements,
    modules,
    paymentPlans,
    integrations: Object.keys(SITE_INTEGRATION_KEYS).length,
    emailTemplates: EMAIL_TEMPLATE_KINDS.length,
    cronJobs: CRON_JOB_KEYS.length,
  };
  return counts;
});
