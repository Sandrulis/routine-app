export const SITE_INTEGRATION_KEYS = {
  googleOAuth: "google_oauth",
  microsoftOAuth: "microsoft_oauth",
  resend: "resend",
  umami: "umami",
  sentry: "sentry",
} as const;

export type SiteIntegrationKey =
  (typeof SITE_INTEGRATION_KEYS)[keyof typeof SITE_INTEGRATION_KEYS];

export const SIMPLE_SITE_INTEGRATION_KEYS = [
  SITE_INTEGRATION_KEYS.resend,
  SITE_INTEGRATION_KEYS.umami,
  SITE_INTEGRATION_KEYS.sentry,
] as const;

export type SimpleSiteIntegrationKey =
  (typeof SIMPLE_SITE_INTEGRATION_KEYS)[number];

export function isSimpleSiteIntegrationKey(
  value: string,
): value is SimpleSiteIntegrationKey {
  return (SIMPLE_SITE_INTEGRATION_KEYS as readonly string[]).includes(value);
}
