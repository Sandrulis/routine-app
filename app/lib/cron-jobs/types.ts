export const CRON_JOB_KEYS = [
  "subtask_start_reminder",
  "subtask_due_reminder",
  "purge_scheduled_account_deletions",
] as const;

export type CronJobKey = (typeof CRON_JOB_KEYS)[number];

export type CronJobSummary = {
  jobKey: CronJobKey;
  enabled: boolean;
  url: string | null;
  lastRunAt: string | null;
  lastRunOk: boolean | null;
  lastRunMessage: string | null;
  lastNotifiedCount: number;
};

export function isCronJobKey(value: string): value is CronJobKey {
  return (CRON_JOB_KEYS as readonly string[]).includes(value);
}
