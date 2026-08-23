export type CalendarProvider = "apple" | "google";

export type CalendarIntegrationSummary = {
  enabled: boolean;
  provider: CalendarProvider | null;
  feedPath: string | null;
  hasFeed: boolean;
};
