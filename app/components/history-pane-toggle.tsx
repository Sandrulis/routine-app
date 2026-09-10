"use client";

import { IconActionButton } from "@/app/components/icon-action-button";
import { useTranslations } from "@/app/components/translations-provider";

export function HistoryPaneToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslations();
  return (
    <IconActionButton
      label={
        open
          ? t("lists.windows.history.hide", "Paslēpt vēsturi")
          : t("lists.windows.history.show", "Rādīt vēsturi")
      }
      icon={open ? "fas fa-angle-double-right" : "fas fa-angle-double-left"}
      variant="muted"
      onClick={onToggle}
    />
  );
}
