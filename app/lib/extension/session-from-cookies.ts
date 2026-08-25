import { cookies } from "next/headers";

export type ExtensionCookiePair = {
  name: string;
  value: string;
};

export type ExtensionCookieSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
};

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function fromBase64Url(value: string) {
  const padded = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64").toString("utf8");
}

function sessionFromParsed(parsed: unknown): ExtensionCookieSession | null {
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  const nested =
    record.currentSession && typeof record.currentSession === "object"
      ? (record.currentSession as Record<string, unknown>)
      : record;
  const access = nested.access_token || nested.accessToken;
  if (typeof access !== "string" || !access) return null;
  const refresh = nested.refresh_token || nested.refreshToken;
  return {
    access_token: access,
    refresh_token: typeof refresh === "string" ? refresh : "",
    expires_at:
      typeof nested.expires_at === "number" ? nested.expires_at : undefined,
    expires_in:
      typeof nested.expires_in === "number" ? nested.expires_in : undefined,
    token_type:
      typeof nested.token_type === "string" ? nested.token_type : undefined,
  };
}

/** Same decode path as extensions/gmail/background.js `parseSessionValue`. */
export function parseSessionValue(raw: string | null | undefined) {
  if (!raw) return null;
  const text = String(raw);
  const candidates = [text];
  try {
    candidates.push(decodeURIComponent(text));
  } catch {
    // ignore
  }
  const expanded: string[] = [];
  for (const candidate of unique(candidates)) {
    expanded.push(candidate);
    if (candidate.startsWith("base64-")) {
      expanded.push(candidate.slice("base64-".length));
    }
  }
  for (const candidate of expanded) {
    try {
      let parsed: unknown = JSON.parse(candidate);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      const session = sessionFromParsed(parsed);
      if (session) return session;
    } catch {
      // try next
    }
    try {
      const decoded = fromBase64Url(candidate);
      let parsed: unknown = JSON.parse(decoded);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      const session = sessionFromParsed(parsed);
      if (session) return session;
    } catch {
      // ignore
    }
  }
  return null;
}

function sessionUsable(session: ExtensionCookieSession | null) {
  if (!session?.access_token) return false;
  if (session.refresh_token) return true;
  const expiresAtMs = Number(session.expires_at)
    ? Number(session.expires_at) * 1000
    : 0;
  if (expiresAtMs && expiresAtMs < Date.now() + 60_000) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(
        session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8"),
    ) as { exp?: number };
    if (payload?.exp && payload.exp * 1000 < Date.now() + 60_000) return false;
  } catch {
    // ignore
  }
  return true;
}

/** Same grouping as extensions/gmail/background.js `sessionFromAuthCookieList`. */
export function sessionFromAuthCookieList(cookieList: ExtensionCookiePair[]) {
  const authCookies = cookieList.filter((cookie) =>
    /-auth-token(\.\d+)?$/.test(cookie.name || ""),
  );
  if (authCookies.length === 0) return null;

  const groups = new Map<string, { index: number; value: string }[]>();
  for (const cookie of authCookies) {
    const match = /^(.*-auth-token)(?:\.(\d+))?$/.exec(cookie.name);
    if (!match) continue;
    const base = match[1];
    const index = match[2] ? Number(match[2]) : 0;
    const parts = groups.get(base) ?? [];
    parts.push({ index, value: cookie.value || "" });
    groups.set(base, parts);
  }

  let fallback: ExtensionCookieSession | null = null;
  for (const parts of groups.values()) {
    parts.sort((a, b) => a.index - b.index);
    const session = parseSessionValue(parts.map((part) => part.value).join(""));
    if (sessionUsable(session)) return session;
    if (session?.access_token && !fallback) fallback = session;
  }
  return fallback;
}

export async function sessionFromRequestCookies() {
  const cookieStore = await cookies();
  return sessionFromAuthCookieList(cookieStore.getAll());
}
