"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCronJobEnabledAction } from "@/app/(app)/admin/actions";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import type { CronJobKey, CronJobSummary } from "@/app/lib/cron-jobs/types";
import { translateActionError } from "@/app/lib/i18n/action-errors";

const JOB_COPY: Record<
  CronJobKey,
  { titleKey: string; titleFallback: string; descKey: string; descFallback: string }
> = {
  subtask_start_reminder: {
    titleKey: "admin.cron_jobs.job.subtask_start_reminder.title",
    titleFallback: "Apakšuzdevuma sākuma atgādinājums",
    descKey: "admin.cron_jobs.job.subtask_start_reminder.description",
    descFallback:
      "Paziņo piesaistītajam lietotājam vai grupai, ka jāuzsāk apakšuzdevums, kura sākuma datums ir šodien vai jau pagājis un statuss vēl ir “nav sākts”.",
  },
  subtask_due_reminder: {
    titleKey: "admin.cron_jobs.job.subtask_due_reminder.title",
    titleFallback: "Apakšuzdevuma termiņa atgādinājums",
    descKey: "admin.cron_jobs.job.subtask_due_reminder.description",
    descFallback:
      "Paziņo piesaistītajam lietotājam vai grupai, ka šodien ir apakšuzdevuma termiņš un tas vēl nav slēgts.",
  },
};

export function AdminCronJobsForm({
  initialJobs,
}: {
  initialJobs: CronJobSummary[];
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { formatDateTime } = useDisplayPreferences();
  const { showFeedback } = useFeedbackToast();
  const [jobs, setJobs] = useState(initialJobs);
  const [pendingKey, setPendingKey] = useState<CronJobKey | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  function handleToggle(job: CronJobSummary, enabled: boolean) {
    startTransition(async () => {
      setPendingKey(job.jobKey);
      const result = await setCronJobEnabledAction(job.jobKey, enabled);
      setPendingKey(null);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      setJobs((current) =>
        current.map((item) => (item.jobKey === result.job.jobKey ? result.job : item)),
      );
      showFeedback({
        type: "success",
        text: enabled
          ? t("admin.cron_jobs.feedback.enabled", "Cron job ieslēgts.")
          : t("admin.cron_jobs.feedback.disabled", "Cron job izslēgts."),
      });
      router.refresh();
    });
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      showFeedback({
        type: "success",
        text: t("admin.cron_jobs.url_copied", "Saite nokopēta."),
      });
    } catch {
      showFeedback({
        type: "error",
        text: t("errors.clipboard_failed", "Neizdevās nokopēt linku."),
      });
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-600">
        {t(
          "admin.cron_jobs.page_hint",
          "Ieslēdz darbu un iekopē saiti cron-job.org. Palaiž reizi stundā. Sākuma atgādinājumi no 8:00, termiņa no 9:00 lietotāja laika joslā. Katrā palaišanā līdz 1000 lietotājiem; pārējie nākamajā stundā. Kamēr darbs izslēgts, saite neatbild.",
        )}
      </p>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <ul className="divide-y divide-zinc-100">
          {jobs.map((job) => {
            const copy = JOB_COPY[job.jobKey];
            const busy = isPending && pendingKey === job.jobKey;
            return (
              <li key={job.jobKey} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900">
                      {t(copy.titleKey, copy.titleFallback)}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-zinc-500">
                      {t(copy.descKey, copy.descFallback)}
                    </p>
                    {job.lastRunAt ? (
                      <p className="mt-2 text-xs text-zinc-400">
                        {t("admin.cron_jobs.last_run", "Pēdējā palaišana")}:{" "}
                        {formatDateTime(job.lastRunAt)}
                        {job.lastRunOk === false
                          ? ` — ${job.lastRunMessage || t("admin.cron_jobs.last_run.failed", "kļūda")}`
                          : ` — ${t("admin.cron_jobs.last_run.notified", "{count} paziņojumi", { count: job.lastNotifiedCount })}`}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-400">
                        {t("admin.cron_jobs.last_run.never", "Vēl nav palaists")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-start">
                    {job.enabled && job.url ? (
                      <IconActionButton
                        label={t(
                          "admin.cron_jobs.copy_url",
                          "Kopēt cron-job.org saiti",
                        )}
                        icon="fas fa-copy"
                        variant="muted"
                        disabled={busy}
                        onClick={() => void copyUrl(job.url!)}
                      />
                    ) : null}
                    <ToggleSwitch
                      checked={job.enabled}
                      disabled={busy}
                      label={t(copy.titleKey, copy.titleFallback)}
                      onChange={(enabled) => handleToggle(job, enabled)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
