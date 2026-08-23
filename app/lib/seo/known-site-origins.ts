/** Canonical production origin (no trailing slash). */
export const PRODUCTION_SITE_ORIGIN = "https://tasqin.com";

export const LOCAL_DEV_ORIGINS = [
  "http://localhost:3120",
  "http://127.0.0.1:3120",
] as const;

/** Origins the Gmail plugin and CORS already know without user input. */
export const KNOWN_SITE_ORIGINS = [
  PRODUCTION_SITE_ORIGIN,
  "https://www.tasqin.com",
  ...LOCAL_DEV_ORIGINS,
] as const;

export function isKnownSiteOrigin(origin: string) {
  return (KNOWN_SITE_ORIGINS as readonly string[]).includes(origin);
}
