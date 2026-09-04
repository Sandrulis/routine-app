"use client";

import { useRef, useState, type MouseEvent } from "react";
import {
  CreateItemMenu,
  createMenuAnchorFromEvent,
  type CreateMenuAnchor,
} from "@/app/components/create-item-menu";
import { DatePickerPopover } from "@/app/components/date-picker-popover";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  clampSnoozeDateIso,
  earliestSnoozeDateIso,
  snoozeUntilHourFromNow,
  snoozeUntilStartOfDate,
  snoozeUntilTomorrow,
  snoozeUntilWeekFromNow,
} from "@/app/lib/task-snooze";

export function TaskSnoozeButton({
  onSnooze,
  onOpenChange,
}: {
  onSnooze: (untilIso: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { timeZone } = useDisplayPreferences();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [anchor, setAnchor] = useState<CreateMenuAnchor | null>(null);
  const minDate = earliestSnoozeDateIso(timeZone);

  function setOpenState(nextMenu: boolean, nextDate: boolean) {
    setMenuOpen(nextMenu);
    setDateOpen(nextDate);
    onOpenChange?.(nextMenu || nextDate);
  }

  function pickUntil(untilIso: string) {
    setOpenState(false, false);
    onSnooze(untilIso);
  }

  return (
    <>
      <span ref={triggerRef} className="inline-flex">
        <IconActionButton
          label={t("dashboard.snooze", "Atlikt")}
          icon="fas fa-clock"
          variant="muted"
          pressed={menuOpen || dateOpen}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            if (menuOpen || dateOpen) {
              setOpenState(false, false);
              return;
            }
            setAnchor(createMenuAnchorFromEvent(event));
            setOpenState(true, false);
          }}
        />
      </span>
      <CreateItemMenu
        open={menuOpen}
        anchor={anchor}
        title={t("dashboard.snooze", "Atlikt")}
        items={[
          {
            id: "hour",
            icon: "fas fa-hourglass-half",
            title: t("dashboard.snooze.hour", "1 stunda"),
          },
          {
            id: "tomorrow",
            icon: "fas fa-sun",
            title: t("dashboard.snooze.until_tomorrow", "Līdz rītdienai"),
          },
          {
            id: "week",
            icon: "fas fa-calendar-week",
            title: t("dashboard.snooze.week", "1 nedēļa"),
          },
          {
            id: "date",
            icon: "fas fa-calendar-day",
            title: t("dashboard.snooze.pick_date", "Izvēlēties datumu"),
            dividerBefore: true,
          },
        ]}
        onClose={() => setOpenState(false, false)}
        onSelect={(id) => {
          if (id === "hour") {
            pickUntil(snoozeUntilHourFromNow(1));
            return;
          }
          if (id === "tomorrow") {
            pickUntil(snoozeUntilTomorrow(timeZone));
            return;
          }
          if (id === "week") {
            pickUntil(snoozeUntilWeekFromNow());
            return;
          }
          setOpenState(false, true);
        }}
      />
      <DatePickerPopover
        value={minDate}
        open={dateOpen}
        onOpenChange={(open) => setOpenState(false, open)}
        triggerRef={triggerRef}
        onChange={(next) => {
          if (!next) return;
          const iso = clampSnoozeDateIso(next, timeZone);
          if (!iso) return;
          pickUntil(snoozeUntilStartOfDate(iso, timeZone));
        }}
      />
    </>
  );
}
