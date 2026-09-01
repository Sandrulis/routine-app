import type { LocalizedValues } from "@/app/lib/i18n/localized-values";

export type SiteAnnouncementSummary = {
  id: string;
  titleValues: LocalizedValues;
  bodyValues: LocalizedValues;
  expiresAt: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SiteAnnouncementInput = {
  titleValues: LocalizedValues;
  bodyValues: LocalizedValues;
  expiresAt: string;
  isEnabled: boolean;
};
