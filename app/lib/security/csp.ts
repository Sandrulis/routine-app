const CONNECT_SRC = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://accounts.google.com",
  "https://oauth2.googleapis.com",
  "https://www.googleapis.com",
  "https://gmail.googleapis.com",
  "https://login.microsoftonline.com",
  "https://graph.microsoft.com",
  "https://*.sentry.io",
  "https://*.ingest.sentry.io",
  "https://*.ingest.de.sentry.io",
  "https://*.ingest.us.sentry.io",
];

function umamiHost() {
  const raw = process.env.UMAMI_SCRIPT_URL;
  if (!raw) return "https://cloud.umami.is";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

export function buildContentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  const umami = umamiHost();
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    isDev ? "'unsafe-eval'" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const connectSrc = [...CONNECT_SRC, umami, "https://*.umami.is"]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `script-src-elem ${scriptSrc} ${umami}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "media-src 'self' data: blob:",
    "frame-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function createCspNonce() {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
