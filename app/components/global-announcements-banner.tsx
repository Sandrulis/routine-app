"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import {
  readAnnouncementSeen,
  writeAnnouncementSeen,
} from "@/app/lib/announcements/seen-cookie";
import type { SiteAnnouncementSummary } from "@/app/lib/announcements/types";
import { resolveLocalizedValue } from "@/app/lib/i18n/localized-values";

export function GlobalAnnouncementsBanner({
  announcements,
}: {
  announcements: SiteAnnouncementSummary[];
}) {
  const { t, languageCode } = useTranslations();
  const [visible, setVisible] = useState(announcements);

  useEffect(() => {
    setVisible(
      announcements.filter((item) => !readAnnouncementSeen(item.id)),
    );
  }, [announcements]);

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col">
      {visible.map((announcement) => {
        const title = resolveLocalizedValue(
          announcement.titleValues,
          languageCode,
        );
        const body = resolveLocalizedValue(
          announcement.bodyValues,
          languageCode,
        );
        if (!title && !body) return null;

        return (
          <section
            key={announcement.id}
            aria-label={title || t("admin.nav.announcements", "Paziņojumi")}
            className="border-b border-sky-200 bg-sky-50/80"
          >
            <div className="flex items-start justify-between gap-3 py-3 pr-4 pl-2 md:pr-6 lg:pl-[var(--app-content-inset-left)]">
              <div className="min-w-0">
                {title ? (
                  <h2 className="text-sm font-semibold text-sky-950">{title}</h2>
                ) : null}
                {body ? (
                  <p
                    className={`whitespace-pre-wrap text-sm text-sky-900/90 ${
                      title ? "mt-1" : ""
                    }`}
                  >
                    {body}
                  </p>
                ) : null}
              </div>
              <Tooltip label={t("actions.close", "Aizvērt")}>
                <button
                  type="button"
                  aria-label={t("actions.close", "Aizvērt")}
                  onClick={() => {
                    writeAnnouncementSeen(announcement.id, announcement.expiresAt);
                    setVisible((current) =>
                      current.filter((item) => item.id !== announcement.id),
                    );
                  }}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-white text-sky-800 transition hover:bg-sky-100"
                >
                  <i className="fas fa-xmark text-sm" aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </section>
        );
      })}
    </div>
  );
}
