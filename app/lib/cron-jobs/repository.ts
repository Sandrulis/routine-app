import { timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { sha256Hex } from "@/app/lib/security/hash-token";
import { decryptSecret } from "@/app/lib/security/secret-box";
import { getPublicSiteUrl } from "@/app/lib/seo/site-url";
import {
  CRON_JOB_KEYS,
  isCronJobKey,
  type CronJobKey,
  type CronJobSummary,
} from "@/app/lib/cron-jobs/types";

type CronJobRow = {
  job_key: string;
  is_enabled: boolean;
  secret_token: string;
  secret_token_hash?: string | null;
  last_run_at: string | null;
  last_run_ok: boolean | null;
  last_run_message: string | null;
  last_notified_count: number | null;
};

function cronJobUrl(jobKey: CronJobKey, token: string, enabled: boolean): string | null {
  if (!enabled || !token) return null;
  return `${getPublicSiteUrl()}/api/cron/${jobKey}?token=${encodeURIComponent(token)}`;
}

function plaintextCronToken(stored: string) {
  return decryptSecret(stored) || stored;
}

function mapCronJobRow(row: CronJobRow): CronJobSummary | null {
  if (!isCronJobKey(row.job_key)) return null;
  const token = plaintextCronToken(row.secret_token);
  return {
    jobKey: row.job_key,
    enabled: row.is_enabled === true,
    url: cronJobUrl(row.job_key, token, row.is_enabled === true),
    lastRunAt: row.last_run_at,
    lastRunOk: row.last_run_ok,
    lastRunMessage: row.last_run_message,
    lastNotifiedCount: Number(row.last_notified_count) || 0,
  };
}

export async function listCronJobs(): Promise<CronJobSummary[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_cron_jobs")
    .select(
      "job_key, is_enabled, secret_token, secret_token_hash, last_run_at, last_run_ok, last_run_message, last_notified_count",
    )
    .in("job_key", [...CRON_JOB_KEYS]);
  if (error) throw error;

  const byKey = new Map<string, CronJobSummary>();
  for (const row of (data ?? []) as CronJobRow[]) {
    const mapped = mapCronJobRow(row);
    if (mapped) byKey.set(mapped.jobKey, mapped);
  }
  return CRON_JOB_KEYS.map(
    (jobKey) =>
      byKey.get(jobKey) ?? {
        jobKey,
        enabled: false,
        url: null,
        lastRunAt: null,
        lastRunOk: null,
        lastRunMessage: null,
        lastNotifiedCount: 0,
      },
  );
}

export async function setCronJobEnabled(
  jobKey: CronJobKey,
  enabled: boolean,
): Promise<CronJobSummary> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_cron_jobs")
    .update({ is_enabled: enabled })
    .eq("job_key", jobKey)
    .select(
      "job_key, is_enabled, secret_token, secret_token_hash, last_run_at, last_run_ok, last_run_message, last_notified_count",
    )
    .maybeSingle();
  if (error) throw error;
  const mapped = data ? mapCronJobRow(data as CronJobRow) : null;
  if (!mapped) {
    throw new Error("cron_job_not_found");
  }
  return mapped;
}

export async function findEnabledCronJobByToken(
  jobKey: CronJobKey,
  token: string,
): Promise<{ enabled: boolean; matched: boolean } | null> {
  if (!token.trim()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_cron_jobs")
    .select("is_enabled, secret_token, secret_token_hash")
    .eq("job_key", jobKey)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as {
    is_enabled?: boolean;
    secret_token?: string;
    secret_token_hash?: string | null;
  };
  const providedHash = sha256Hex(token);
  const storedHash = String(row.secret_token_hash ?? "");
  const storedPlain = plaintextCronToken(String(row.secret_token ?? ""));
  const matched = storedHash
    ? tokensEqual(storedHash, providedHash)
    : tokensEqual(storedPlain, token);
  if (!matched) {
    return { enabled: false, matched: false };
  }
  return {
    enabled: (data as { is_enabled?: boolean }).is_enabled === true,
    matched: true,
  };
}

export async function recordCronJobRun(
  supabase: SupabaseClient,
  jobKey: CronJobKey,
  result: { ok: boolean; message: string; notifiedCount: number },
) {
  const { error } = await supabase
    .from("site_cron_jobs")
    .update({
      last_run_at: new Date().toISOString(),
      last_run_ok: result.ok,
      last_run_message: result.message.slice(0, 500),
      last_notified_count: result.notifiedCount,
    })
    .eq("job_key", jobKey);
  if (error) throw error;
}

function tokensEqual(stored: string, provided: string): boolean {
  const left = Buffer.from(stored);
  const right = Buffer.from(provided);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}
