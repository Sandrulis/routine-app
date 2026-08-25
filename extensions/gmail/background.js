const DEFAULT_APP_BASE = "https://www.tasqin.com";
const APP_ORIGIN_CANDIDATES = [
  "https://www.tasqin.com",
  "https://tasqin.com",
  "http://localhost:3120",
  "http://127.0.0.1:3120",
];
const STORED_SESSION_KEY = "extensionAuth";
const PLUGIN_SIGNED_OUT_KEY = "pluginSignedOut";
const COOKIE_CHUNK = 3180;
const AUTH_MAX_AGE_SEC = 30 * 24 * 60 * 60;
const EXTENSION_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

async function ensureOriginPermission(origin) {
  const origins = [`${origin}/*`];
  try {
    const already = await chrome.permissions.contains({ origins });
    if (already) return true;
    return await chrome.permissions.request({ origins });
  } catch {
    return false;
  }
}

function parseOrigin(raw) {
  try {
    return new URL(String(raw || "").trim()).origin;
  } catch {
    return "";
  }
}

/** Vercel 308s apex → www without CORS; never call https://tasqin.com from the plugin. */
function preferLiveOrigin(origin) {
  const parsed = parseOrigin(origin);
  if (!parsed) return parsed;
  try {
    const url = new URL(parsed);
    if (url.hostname === "tasqin.com") {
      url.hostname = "www.tasqin.com";
      return url.origin;
    }
  } catch {
    // ignore
  }
  return parsed;
}

function originsEquivalent(a, b) {
  const left = preferLiveOrigin(a);
  const right = preferLiveOrigin(b);
  return Boolean(left && right && left === right);
}

/** Prefer www over apex so we don't hit a CORS-blocked 301 to the canonical host. */
function originsWithWwwFirst(origin) {
  const parsed = parseOrigin(origin);
  if (!parsed) return [];
  try {
    const url = new URL(parsed);
    const host = url.hostname;
    if (host === "localhost" || host === "127.0.0.1") return [parsed];
    const port = url.port ? `:${url.port}` : "";
    if (host.startsWith("www.")) {
      return unique([parsed, `${url.protocol}//${host.slice(4)}${port}`]);
    }
    return unique([`${url.protocol}//www.${host}${port}`, parsed]);
  } catch {
    return [parsed];
  }
}

function expandOrigins(origins) {
  return unique(origins.flatMap(originsWithWwwFirst).map(preferLiveOrigin));
}

async function originsFromAuthCookies() {
  let cookies = [];
  try {
    cookies = await chrome.cookies.getAll({});
  } catch {
    cookies = [];
  }
  const origins = [];
  for (const cookie of cookies) {
    if (!/-auth-token/.test(cookie.name || "")) continue;
    const host = String(cookie.domain || "").replace(/^\./, "");
    if (!host) continue;
    const protocol = cookie.secure ? "https" : "http";
    if (host === "localhost" || host === "127.0.0.1") {
      origins.push(`${protocol}://${host}:3120`);
    } else {
      origins.push(`${protocol}://${host}`);
    }
  }
  return unique(origins);
}

async function probeConfig(origin) {
  try {
    await ensureOriginPermission(origin);
    const response = await fetch(`${origin}/api/extension/config`, {
      credentials: "omit",
      redirect: "manual",
    });
    if (response.status >= 300 && response.status < 400) return null;
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.ok) return null;
    return data;
  } catch {
    return null;
  }
}

async function readStoredSession() {
  const data = await chrome.storage.local.get([STORED_SESSION_KEY]);
  const stored = data[STORED_SESSION_KEY];
  const appBase = parseOrigin(stored?.appBase);
  const session = stored?.session;
  if (!appBase || !session?.access_token) return null;
  return { appBase, session };
}

/** Keep refresh_token when a cookie/session update only has a short-lived access_token. */
function mergeSessionPreserveRefresh(primary, secondary) {
  if (!primary) return secondary || null;
  if (!secondary) return primary;
  return {
    ...secondary,
    ...primary,
    refresh_token: primary.refresh_token || secondary.refresh_token,
  };
}

function sessionUsable(session) {
  if (!session?.access_token) return false;
  return Boolean(session.refresh_token) || !sessionExpired(session);
}

/** Plugin storage is the session. Website cookies only bootstrap an empty store. */
function pickBestSession(cookieSession, storedSession) {
  if (sessionUsable(storedSession)) {
    return mergeSessionPreserveRefresh(storedSession, cookieSession);
  }
  if (sessionUsable(cookieSession)) {
    return mergeSessionPreserveRefresh(cookieSession, storedSession);
  }
  return storedSession || cookieSession || null;
}

async function writeStoredSession(appBase, session) {
  const origin = parseOrigin(appBase);
  if (!origin || !session?.access_token) return;
  const existing = await readStoredSession();
  const previous =
    existing && parseOrigin(existing.appBase) === origin
      ? existing.session
      : null;
  const merged = mergeSessionPreserveRefresh(session, previous);
  await chrome.storage.local.set({
    [STORED_SESSION_KEY]: {
      appBase: origin,
      session: {
        access_token: merged.access_token,
        refresh_token: merged.refresh_token,
        expires_at: merged.expires_at,
        expires_in: merged.expires_in,
        token_type: merged.token_type,
      },
    },
  });
}

async function clearStoredSession() {
  await chrome.storage.local.remove([STORED_SESSION_KEY]);
}

async function pluginCookieImportAllowed() {
  const data = await chrome.storage.local.get([PLUGIN_SIGNED_OUT_KEY]);
  return data[PLUGIN_SIGNED_OUT_KEY] !== true;
}

async function markPluginSignedIn() {
  await chrome.storage.local.set({ [PLUGIN_SIGNED_OUT_KEY]: false });
}

async function markPluginSignedOut() {
  await chrome.storage.local.set({ [PLUGIN_SIGNED_OUT_KEY]: true });
  await clearStoredSession();
}

async function rememberSession(appBase, session) {
  const origin = preferLiveOrigin(parseOrigin(appBase));
  await writeStoredSession(origin, session);
  if (origin) await chrome.storage.sync.set({ appBaseUrl: origin });
}

function isLocalOrigin(origin) {
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

async function getAppBase() {
  const stored = await chrome.storage.sync.get(["appBaseUrl"]);
  const storedOrigin = parseOrigin(stored.appBaseUrl);
  const storedSession = await readStoredSession();
  const cookieOrigins = await originsFromAuthCookies();
  // Production first for discovery; local cookies/session still checked for an
  // existing login, but must not win as a blind fallback when CORS blocks www.
  const candidates = expandOrigins([
    ...APP_ORIGIN_CANDIDATES.filter((origin) => !isLocalOrigin(origin)),
    storedSession?.appBase,
    storedOrigin,
    ...cookieOrigins,
    ...APP_ORIGIN_CANDIDATES.filter((origin) => isLocalOrigin(origin)),
  ]);

  async function adopt(origin, config) {
    origin = preferLiveOrigin(origin) || origin;
    const canonical = preferLiveOrigin(parseOrigin(config.appOrigin)) || origin;
    await chrome.storage.sync.set({
      appBaseUrl: origin,
      authCookieName: config.authCookieName || "",
      loginPath: config.loginPath || "/login",
      canonicalOrigin: canonical,
    });
    return origin;
  }

  let productionFallback = null;
  let localFallback = null;
  for (const origin of candidates) {
    const config = await probeConfig(origin);
    if (!config) continue;
    if (isLocalOrigin(origin)) {
      if (!localFallback) localFallback = { origin, config };
    } else if (!productionFallback) {
      productionFallback = { origin, config };
    }
    const token = await getAccessToken(origin);
    if (token) return adopt(origin, config);
  }
  // No session: prefer production so Login never opens localhost just because
  // `npm run dev` is up while www CORS/probe fails.
  if (productionFallback) {
    return adopt(productionFallback.origin, productionFallback.config);
  }
  if (localFallback) return adopt(localFallback.origin, localFallback.config);

  try {
    await chrome.permissions.request({
      origins: ["https://*/*", "http://*/*"],
    });
  } catch {
    // user dismissed
  }
  const extraOrigins = expandOrigins([
    ...(await originsFromAuthCookies()),
    ...APP_ORIGIN_CANDIDATES,
  ]).filter((origin) => !candidates.includes(origin));
  let extraProduction = null;
  let extraLocal = null;
  for (const origin of extraOrigins) {
    const config = await probeConfig(origin);
    if (!config) continue;
    if (isLocalOrigin(origin)) {
      if (!extraLocal) extraLocal = { origin, config };
    } else if (!extraProduction) {
      extraProduction = { origin, config };
    }
  }
  if (extraProduction) {
    return adopt(extraProduction.origin, extraProduction.config);
  }
  if (extraLocal) return adopt(extraLocal.origin, extraLocal.config);

  // Never stick to a stale localhost sync value when production is the default.
  if (storedOrigin && !isLocalOrigin(storedOrigin)) {
    return preferLiveOrigin(storedOrigin);
  }
  return DEFAULT_APP_BASE;
}

function fromBase64Url(value) {
  const padded = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

function sessionFromParsed(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const nested =
    parsed.currentSession && typeof parsed.currentSession === "object"
      ? parsed.currentSession
      : parsed;
  const access = nested.access_token || nested.accessToken;
  if (typeof access !== "string" || !access) return null;
  return {
    access_token: access,
    refresh_token: nested.refresh_token || nested.refreshToken || "",
    expires_at: nested.expires_at,
    expires_in: nested.expires_in,
    token_type: nested.token_type,
  };
}

function parseSessionValue(raw) {
  if (!raw) return null;
  const text = String(raw);
  const candidates = [text];
  try {
    candidates.push(decodeURIComponent(text));
  } catch {
    // ignore
  }
  const expanded = [];
  for (const candidate of unique(candidates)) {
    expanded.push(candidate);
    if (candidate.startsWith("base64-")) {
      expanded.push(candidate.slice("base64-".length));
    }
  }
  for (const candidate of expanded) {
    try {
      let parsed = JSON.parse(candidate);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      const session = sessionFromParsed(parsed);
      if (session) return session;
    } catch {
      // try next
    }
    try {
      const decoded = fromBase64Url(candidate);
      let parsed = JSON.parse(decoded);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      const session = sessionFromParsed(parsed);
      if (session) return session;
    } catch {
      // ignore
    }
  }
  return null;
}

function cookiesFromHeader(header) {
  return String(header || "")
    .split(";")
    .map((part) => {
      const trimmed = part.trim();
      const separator = trimmed.indexOf("=");
      if (separator < 0) return null;
      let name = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      try {
        name = decodeURIComponent(name);
      } catch {
        // keep raw
      }
      try {
        value = decodeURIComponent(value);
      } catch {
        // keep raw
      }
      return name ? { name, value } : null;
    })
    .filter(Boolean);
}

function sessionFromAuthCookieList(cookies) {
  const authCookies = cookies.filter((cookie) =>
    /-auth-token(\.\d+)?$/.test(cookie.name || ""),
  );
  if (authCookies.length === 0) {
    return { session: null, cookieName: "" };
  }

  const groups = new Map();
  for (const cookie of authCookies) {
    const match = /^(.*-auth-token)(?:\.(\d+))?$/.exec(cookie.name);
    if (!match) continue;
    const base = match[1];
    const index = match[2] ? Number(match[2]) : 0;
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push({ index, value: cookie.value || "" });
  }

  let fallback = { session: null, cookieName: "" };
  for (const [cookieName, parts] of groups.entries()) {
    parts.sort((a, b) => a.index - b.index);
    const session = parseSessionValue(parts.map((part) => part.value).join(""));
    if (sessionUsable(session)) return { session, cookieName };
    if (session?.access_token && !fallback.session) {
      fallback = { session, cookieName };
    }
  }
  return fallback;
}

function sessionExpired(session) {
  if (!session?.access_token) return true;
  const expiresAtMs = Number(session.expires_at)
    ? Number(session.expires_at) * 1000
    : 0;
  if (expiresAtMs && expiresAtMs < Date.now() + 60_000) return true;
  try {
    const payload = JSON.parse(
      atob(session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (payload?.exp && payload.exp * 1000 < Date.now() + 60_000) return true;
  } catch {
    // ignore
  }
  return false;
}

async function listCookiesForOrigin(appBase) {
  const origin = parseOrigin(appBase);
  const collected = [];
  const seen = new Set();
  function add(cookie) {
    if (!cookie?.name) return;
    const key = `${cookie.domain || ""}|${cookie.name}|${cookie.partitionKey?.topLevelSite || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    collected.push(cookie);
  }
  if (origin) {
    try {
      (await chrome.cookies.getAll({ url: origin })).forEach(add);
    } catch {
      // ignore
    }
  }
  try {
    const host = origin ? new URL(origin).hostname.replace(/^www\./, "") : "";
    const all = await chrome.cookies.getAll({});
    for (const cookie of all) {
      if (!/-auth-token(\.\d+)?$/.test(cookie.name || "")) continue;
      if (host && !String(cookie.domain || "").includes(host)) continue;
      add(cookie);
    }
  } catch {
    // ignore
  }
  return collected;
}

async function readSessionFromCookies(appBase) {
  return sessionFromAuthCookieList(await listCookiesForOrigin(appBase));
}

async function clearAuthCookies(appBase, cookieName) {
  const cookies = await chrome.cookies.getAll({ url: appBase });
  for (const cookie of cookies) {
    const name = cookie.name || "";
    if (
      name === cookieName ||
      name.startsWith(`${cookieName}.`) ||
      /-auth-token(\.\d+)?$/.test(name) ||
      name === "routine-app-remember-session"
    ) {
      try {
        await chrome.cookies.remove({ url: appBase, name });
      } catch {
        // ignore
      }
    }
  }
}

function stringToBase64Url(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function cookieWriteBase(appBase, expires) {
  return {
    url: appBase,
    path: "/",
    expirationDate: expires,
    // Match website auth cookies (readable by Supabase browser client).
    httpOnly: false,
    sameSite: "lax",
    secure: String(appBase).startsWith("https:"),
  };
}

async function setCookieSafe(details) {
  try {
    const written = await chrome.cookies.set(details);
    if (written) return true;
  } catch {
    // Some Chrome builds reject certain cookie flags.
  }
  try {
    const { httpOnly: _httpOnly, ...rest } = details;
    return Boolean(await chrome.cookies.set(rest));
  } catch {
    return false;
  }
}

async function writeAuthCookies(appBase, cookieName, session) {
  if (!cookieName || !session?.access_token) return false;
  await clearAuthCookies(appBase, cookieName);
  const payload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token || "",
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type || "bearer",
  });
  // Same encoding as @supabase/ssr (base64url + optional chunking).
  const encoded = `base64-${stringToBase64Url(payload)}`;
  const expires = Math.floor(Date.now() / 1000) + AUTH_MAX_AGE_SEC;
  const encodedForSize = encodeURIComponent(encoded);
  const chunks = [];
  if (encodedForSize.length <= COOKIE_CHUNK) {
    chunks.push({ name: cookieName, value: encoded });
  } else {
    let remaining = encodedForSize;
    let index = 0;
    while (remaining.length > 0) {
      let head = remaining.slice(0, COOKIE_CHUNK);
      const lastEscape = head.lastIndexOf("%");
      if (lastEscape > COOKIE_CHUNK - 3) head = head.slice(0, lastEscape);
      let valueHead = "";
      while (head.length > 0) {
        try {
          valueHead = decodeURIComponent(head);
          break;
        } catch {
          if (head.at(-3) === "%" && head.length > 3) {
            head = head.slice(0, head.length - 3);
          } else {
            break;
          }
        }
      }
      if (!valueHead) break;
      chunks.push({ name: `${cookieName}.${index}`, value: valueHead });
      remaining = remaining.slice(head.length);
      index += 1;
    }
  }
  const base = cookieWriteBase(appBase, expires);
  let ok = true;
  for (const chunk of chunks) {
    const written = await setCookieSafe({
      ...base,
      name: chunk.name,
      value: chunk.value,
    });
    if (!written) ok = false;
  }
  await setCookieSafe({
    ...base,
    name: "routine-app-remember-session",
    value: "1",
  });
  return ok;
}

async function syncBrowserSessionCookies(appBase) {
  const origin = preferLiveOrigin(parseOrigin(appBase)) || appBase;
  const stored = await readStoredSession();
  const session = stored?.session;
  if (!session?.access_token) return false;
  await ensureOriginPermission(origin);
  let cookieName =
    (await chrome.storage.sync.get(["authCookieName"])).authCookieName || "";
  if (!cookieName) {
    const config = await probeConfig(origin);
    cookieName = config?.authCookieName || "";
    if (cookieName) {
      await chrome.storage.sync.set({ authCookieName: cookieName });
    }
  }
  if (!cookieName) return false;
  return writeAuthCookies(origin, cookieName, session);
}

function buildConnectGmailBridgeUrl(appBase, bridgePath, ticket) {
  const origin = preferLiveOrigin(parseOrigin(appBase)) || appBase;
  const path = bridgePath || "/auth/gmail-plugin/bridge";
  const url = new URL(path, origin);
  url.searchParams.set("t", ticket);
  return url.toString();
}

async function refreshSession(appBase, session) {
  if (!session?.refresh_token) return null;
  const origin = preferLiveOrigin(appBase) || appBase;
  try {
    const response = await fetch(`${origin}/api/extension/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      redirect: "manual",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (response.status >= 300 && response.status < 400) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.session?.access_token) return null;
    const expiresIn = Number(data.session.expires_in) || 3600;
    const expiresAt =
      Number(data.session.expires_at) ||
      Math.floor(Date.now() / 1000) + expiresIn;
    const next = {
      ...session,
      ...data.session,
      expires_in: expiresIn,
      expires_at: expiresAt,
    };
    if (data.authCookieName) {
      await chrome.storage.sync.set({ authCookieName: data.authCookieName });
    }
    await rememberSession(origin, next);
    return next;
  } catch {
    return null;
  }
}

function jwtStillValid(session) {
  try {
    const payload = JSON.parse(
      atob(session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return Boolean(payload?.exp && payload.exp * 1000 > Date.now() + 5000);
  } catch {
    return false;
  }
}

async function resolveAccessToken(appBase, session, fallback) {
  if (!session?.access_token) return null;
  if (!sessionExpired(session)) {
    await rememberSession(
      appBase,
      mergeSessionPreserveRefresh(session, fallback),
    );
    return session.access_token;
  }
  const refreshed = await refreshSession(appBase, session);
  if (refreshed?.access_token) return refreshed.access_token;
  if (jwtStillValid(session)) {
    await rememberSession(
      appBase,
      mergeSessionPreserveRefresh(session, fallback),
    );
    return session.access_token;
  }
  return null;
}

async function importSessionFromKnownCookies(preferredOrigin) {
  const origins = unique([
    ...originsWithWwwFirst(preferredOrigin),
    ...(await originsFromAuthCookies()),
    ...APP_ORIGIN_CANDIDATES.filter((origin) => !isLocalOrigin(origin)),
  ]);
  for (const origin of expandOrigins(origins)) {
    const { session } = await readSessionFromCookies(origin);
    if (sessionUsable(session)) {
      await rememberSession(origin, session);
      return origin;
    }
  }
  return "";
}

async function getAccessToken(appBase) {
  const origin = preferLiveOrigin(parseOrigin(appBase));
  const stored = await readStoredSession();
  const storedOrigin = preferLiveOrigin(parseOrigin(stored?.appBase));
  const storedSession =
    stored && originsEquivalent(stored.appBase, origin) ? stored.session : null;

  const fromStored = await resolveAccessToken(origin, storedSession, null);
  if (fromStored) return fromStored;

  if (stored?.session && storedOrigin && !originsEquivalent(storedOrigin, origin)) {
    const fromStoredHost = await resolveAccessToken(
      storedOrigin,
      stored.session,
      null,
    );
    if (fromStoredHost) return fromStoredHost;
  }

  if (!(await pluginCookieImportAllowed())) return null;
  for (const candidate of originsWithWwwFirst(origin)) {
    const { session: cookieSession } = await readSessionFromCookies(candidate);
    const bootstrapped = mergeSessionPreserveRefresh(cookieSession, storedSession);
    const token = await resolveAccessToken(
      candidate,
      bootstrapped,
      storedSession,
    );
    if (token) return token;
  }
  return null;
}

async function apiFetch(path, options = {}, retried = false) {
  const appBase = preferLiveOrigin(await getAppBase()) || DEFAULT_APP_BASE;
  const token = await getAccessToken(appBase);
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(`${appBase}${path}`, {
      ...options,
      headers,
      credentials: "omit",
      redirect: "manual",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      data: { ok: false, error: "errors.extension_network" },
      appBase,
    };
  }

  if (
    !retried &&
    response.status >= 300 &&
    response.status < 400
  ) {
    const location = response.headers.get("Location") || "";
    let nextOrigin = "";
    try {
      nextOrigin = preferLiveOrigin(new URL(location, appBase).origin);
    } catch {
      nextOrigin = "";
    }
    if (nextOrigin && nextOrigin !== appBase) {
      await chrome.storage.sync.set({ appBaseUrl: nextOrigin });
      return apiFetch(path, options, true);
    }
  }

  let data = null;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { ok: false, error: text || "errors.extension_invalid_body" };
  }
  return { ok: response.ok, status: response.status, data, appBase };
}

function normalizeExtensionError(error, fallback = "errors.extension_unknown") {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error || "");
  const trimmed = message.trim();
  if (!trimmed) return fallback;
  if (/^errors\./.test(trimmed)) return trimmed;
  if (
    /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(
      trimmed,
    )
  ) {
    return "errors.extension_network";
  }
  return fallback;
}

function base64UrlToBase64(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return padded + pad;
}

function base64UrlToBytes(value) {
  const binary = atob(base64UrlToBase64(value));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function postAttachProgress(tabId, payload) {
  if (tabId == null) return;
  try {
    const sent = chrome.tabs.sendMessage(tabId, {
      type: "routine.attachProgress",
      ...payload,
    });
    if (sent && typeof sent.catch === "function") {
      sent.catch(() => {});
    }
  } catch {
    // Tab closed or content script not ready.
  }
}

async function getGmailAccessToken(options = {}) {
  const forceRefresh = Boolean(options.forceRefresh);
  if (!forceRefresh) {
    const cached = await getCachedGmailToken();
    if (cached) return cached;
  } else {
    await chrome.storage.local.remove(["gmailAccessToken", "gmailTokenExpiresAt"]);
  }
  const path = forceRefresh
    ? "/api/extension/gmail-access?force=1"
    : "/api/extension/gmail-access";
  const result = await apiFetch(path);
  const token = result?.data?.accessToken;
  if (!result?.ok || !token) {
    await chrome.storage.local.remove(["gmailAccessToken", "gmailTokenExpiresAt"]);
    throw new Error(
      result?.data?.error || result?.error || "errors.extension_gmail_not_connected",
    );
  }
  await saveGmailToken(token, result.data.expiresIn);
  return token;
}

async function getCachedGmailToken() {
  const stored = await chrome.storage.local.get([
    "gmailAccessToken",
    "gmailTokenExpiresAt",
  ]);
  const token = String(stored.gmailAccessToken || "");
  const expiresAt = Number(stored.gmailTokenExpiresAt || 0);
  if (token && expiresAt > Date.now() + 60_000) return token;
  return null;
}

async function saveGmailToken(accessToken, expiresInSec) {
  const expiresAt = Date.now() + Math.max(60, Number(expiresInSec) || 3600) * 1000;
  await chrome.storage.local.set({
    gmailAccessToken: accessToken,
    gmailTokenExpiresAt: expiresAt,
  });
}

function headerMap(part) {
  const map = {};
  for (const item of part?.headers || []) {
    const name = String(item?.name || "").toLowerCase();
    if (!name) continue;
    map[name] = String(item?.value || "");
  }
  return map;
}

function filenameFromContentValue(value) {
  const raw = String(value || "");
  const star = raw.match(/filename\*\s*=\s*([^;]+)/i);
  if (star?.[1]) {
    let encoded = star[1].trim().replace(/^["']|["']$/g, "");
    encoded = encoded.replace(/^UTF-8''/i, "");
    try {
      return decodeURIComponent(encoded).trim();
    } catch {
      return encoded.trim();
    }
  }
  const plain = raw.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;\s]+)/i);
  if (plain) return String(plain[1] || plain[2] || "").trim();
  const name = raw.match(/name\s*=\s*"([^"]+)"|name\s*=\s*([^;\s]+)/i);
  if (name) return String(name[1] || name[2] || "").trim();
  return "";
}

function partFilename(part) {
  const direct = String(part?.filename || "").trim();
  if (direct) return direct;
  const headers = headerMap(part);
  return (
    filenameFromContentValue(headers["content-disposition"]) ||
    filenameFromContentValue(headers["content-type"]) ||
    ""
  );
}

function defaultAttachmentName(mime, filename) {
  if (filename) return filename;
  if (mime === "application/pdf") return "attachment.pdf";
  if (mime.startsWith("image/")) {
    const ext = mime.split("/")[1]?.split("+")[0] || "bin";
    return `image.${ext}`;
  }
  return "attachment.bin";
}

function walkParts(part, out) {
  if (!part) return;
  if (Array.isArray(part.parts)) {
    for (const child of part.parts) walkParts(child, out);
  }
  const attachmentId = part.body?.attachmentId;
  if (!attachmentId) return;
  const mime = String(part.mimeType || "").toLowerCase();
  if (mime.startsWith("multipart/")) return;

  const headers = headerMap(part);
  const disposition = String(headers["content-disposition"] || "").toLowerCase();
  const filename = partFilename(part);

  // Skip large inline bodies (html/plain) that Gmail exposes as attachmentId.
  if (
    !filename &&
    !disposition.includes("attachment") &&
    (mime === "text/plain" || mime === "text/html" || mime.startsWith("text/"))
  ) {
    return;
  }
  // Untitled cid / inline images are not user attachments.
  if (
    !filename &&
    mime.startsWith("image/") &&
    !disposition.includes("attachment")
  ) {
    return;
  }

  out.push({
    filename: defaultAttachmentName(mime, filename),
    mimeType: part.mimeType || "application/octet-stream",
    attachmentId,
    size: Number(part.body.size) || 0,
  });
}

function headerValue(headers, name) {
  const found = (headers || []).find(
    (item) => String(item.name || "").toLowerCase() === name.toLowerCase(),
  );
  return found?.value || "";
}

function decodeBodyData(part) {
  if (!part?.body?.data) return "";
  try {
    return new TextDecoder().decode(base64UrlToBytes(part.body.data));
  } catch {
    return "";
  }
}

function extractBodyText(payload) {
  if (!payload) return "";
  const texts = [];
  function walk(part) {
    if (!part) return;
    if (Array.isArray(part.parts)) {
      for (const child of part.parts) walk(child);
      return;
    }
    const mime = String(part.mimeType || "").toLowerCase();
    if (mime === "text/plain") {
      const text = decodeBodyData(part).trim();
      if (text) texts.push(text);
    }
  }
  walk(payload);
  if (texts.length) return texts.join("\n\n");
  // fallback: html stripped lightly
  const html = extractBodyHtml(payload);
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textLooksLikeHtml(value) {
  const t = String(value || "").trim().toLowerCase();
  if (!t) return false;
  if (t.includes("<!doctype html") || t.includes("<html")) return true;
  if (t.includes("<head") && t.includes("<body")) return true;
  return t.includes("<table") && (t.includes("<style") || t.includes("cellpadding"));
}

function extractBodyHtml(payload) {
  if (!payload) return "";
  let plainHtmlFallback = "";
  function walk(part) {
    if (!part) return "";
    if (Array.isArray(part.parts)) {
      // Prefer explicit text/html parts; walk depth-first.
      for (const child of part.parts) {
        const html = walk(child);
        if (html) return html;
      }
      return "";
    }
    const mime = String(part.mimeType || "").toLowerCase();
    const decoded = decodeBodyData(part).trim();
    if (mime === "text/html" && decoded) return decoded;
    // Some senders put full HTML in text/plain
    if (mime === "text/plain" && textLooksLikeHtml(decoded) && !plainHtmlFallback) {
      plainHtmlFallback = decoded;
    }
    return "";
  }
  return walk(payload) || plainHtmlFallback;
}

function guessMimeFromName(name, fallback) {
  const lower = String(name || "").toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".zip")) return "application/zip";
  return fallback || "application/octet-stream";
}

async function gmailGet(path, token) {
  let response;
  try {
    response = await fetch(`https://gmail.googleapis.com/gmail/v1/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    throw new Error(normalizeExtensionError(error, "errors.extension_network"));
  }
  if (response.status === 401) {
    await chrome.storage.local.remove(["gmailAccessToken", "gmailTokenExpiresAt"]);
    throw new Error("errors.extension_gmail_auth");
  }
  if (response.status === 403) {
    throw new Error("errors.extension_gmail_forbidden");
  }
  if (response.status === 404) {
    throw new Error("errors.extension_gmail_not_found");
  }
  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message || "";
    } catch {
      // ignore
    }
    console.error("Gmail API error", response.status, detail);
    throw new Error("errors.extension_gmail_fetch_failed");
  }
  return response.json();
}

async function resolveGmailMessage(messageId, threadId, token) {
  const candidates = [messageId, threadId].filter(Boolean);
  let lastError = null;

  for (const id of candidates) {
    try {
      return await gmailGet(
        `users/me/messages/${encodeURIComponent(id)}?format=full`,
        token,
      );
    } catch (error) {
      lastError = error;
      if (error?.message !== "errors.extension_gmail_not_found") throw error;
    }
  }

  for (const id of candidates) {
    try {
      const thread = await gmailGet(
        `users/me/threads/${encodeURIComponent(id)}?format=full`,
        token,
      );
      const messages = Array.isArray(thread.messages) ? thread.messages : [];
      if (messages.length === 0) continue;
      if (messageId) {
        const exact = messages.find((item) => item.id === messageId);
        if (exact) return exact;
      }
      return messages[messages.length - 1];
    } catch (error) {
      lastError = error;
      if (error?.message !== "errors.extension_gmail_not_found") throw error;
    }
  }

  throw lastError || new Error("errors.extension_gmail_not_found");
}

async function listGmailAttachments(messageId, threadId, interactive) {
  async function once(forceRefresh = false) {
    const token = await getGmailAccessToken({
      interactive,
      forceRefresh,
    });
    if (!token) throw new Error("errors.extension_gmail_auth");
    const message = await resolveGmailMessage(messageId, threadId, token);
    const parts = [];
    walkParts(message.payload, parts);
    return {
      gmailMessageId: message.id || messageId,
      attachments: parts.map((part) => ({
        attachmentId: String(part.attachmentId),
        name:
          part.filename.replace(/[<>:"/\\|?*]/g, "_").slice(0, 180) ||
          "attachment.bin",
        mimeType: part.mimeType || "application/octet-stream",
        size: part.size,
        tooLarge: part.size > EXTENSION_UPLOAD_MAX_BYTES,
      })),
    };
  }

  try {
    return await once(false);
  } catch (error) {
    if (error?.message !== "errors.extension_gmail_auth") throw error;
    return once(true);
  }
}

function sanitizeAttachmentName(name, mimeType) {
  let next = String(name || "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .slice(0, 180) || "attachment.bin";
  const mime = guessMimeFromName(next, mimeType);
  if (mime === "application/pdf" && !next.toLowerCase().endsWith(".pdf")) {
    next = `${next}.pdf`;
  }
  return { name: next, mimeType: mime };
}

async function downloadGmailAttachment(messageId, attachmentId, token, inlineData) {
  try {
    const att = await gmailGet(
      `users/me/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
      token,
    );
    if (att?.data) {
      const bytes = base64UrlToBytes(att.data);
      if (bytes.length > 0 && bytes.length <= EXTENSION_UPLOAD_MAX_BYTES) return bytes;
    }
  } catch {
    // Some small parts only have inline body.data.
  }
  const inline = inlineData?.get(attachmentId);
  if (!inline) return null;
  const bytes = base64UrlToBytes(inline);
  if (bytes.length <= 0 || bytes.length > EXTENSION_UPLOAD_MAX_BYTES) return null;
  return bytes;
}

async function fetchGmailMessageBundle(
  messageId,
  threadId,
  interactive,
  selectedAttachments = null,
  onProgress = null,
) {
  async function loadWithToken(forceRefresh = false) {
    const token = await getGmailAccessToken({ forceRefresh });
    if (!token) throw new Error("errors.extension_gmail_auth");

    onProgress?.({
      key: "extension.gmail.progress_email",
      percent: 8,
    });
    const message = await resolveGmailMessage(messageId, threadId, token);
    return { token, message };
  }

  let token;
  let message;
  try {
    ({ token, message } = await loadWithToken(false));
  } catch (error) {
    if (error?.message !== "errors.extension_gmail_auth") throw error;
    ({ token, message } = await loadWithToken(true));
  }
  const resolvedId = message.id || messageId;
  const headers = message.payload?.headers || [];
  const email = {
    subject: headerValue(headers, "Subject"),
    from: headerValue(headers, "From"),
    to: headerValue(headers, "To"),
    date: headerValue(headers, "Date"),
    body: extractBodyText(message.payload),
    bodyHtml: extractBodyHtml(message.payload),
    permalink: `https://mail.google.com/mail/u/0/#all/${resolvedId}`,
  };
  onProgress?.({
    key: "extension.gmail.progress_email",
    percent: 16,
  });

  const inlineData = new Map();
  function collectInline(part) {
    if (!part) return;
    if (Array.isArray(part.parts)) {
      for (const child of part.parts) collectInline(child);
    }
    if (part.body?.attachmentId && part.body?.data) {
      inlineData.set(String(part.body.attachmentId), part.body.data);
    }
  }
  collectInline(message.payload);

  let toDownload = [];
  if (selectedAttachments == null) {
    const parts = [];
    walkParts(message.payload, parts);
    toDownload = parts
      .filter((part) => !(part.size > 0 && part.size > EXTENSION_UPLOAD_MAX_BYTES))
      .map((part) => ({
        attachmentId: String(part.attachmentId),
        name: part.filename,
        mimeType: part.mimeType,
      }));
  } else if (Array.isArray(selectedAttachments)) {
    toDownload = selectedAttachments
      .map((item) => ({
        attachmentId: String(item?.attachmentId || ""),
        name: String(item?.name || "attachment"),
        mimeType: String(item?.mimeType || ""),
      }))
      .filter((item) => item.attachmentId);
  }

  const attachments = [];
  const skipped = [];
  for (let index = 0; index < toDownload.length; index += 1) {
    const item = toDownload[index];
    const meta = sanitizeAttachmentName(item.name, item.mimeType);
    onProgress?.({
      key: "extension.gmail.progress_download",
      params: {
        name: meta.name,
        current: index + 1,
        total: toDownload.length,
      },
      percent: 16 + Math.round(((index + 1) / Math.max(toDownload.length, 1)) * 54),
    });
    try {
      const bytes = await downloadGmailAttachment(
        resolvedId,
        item.attachmentId,
        token,
        inlineData,
      );
      if (!bytes) {
        skipped.push({ name: meta.name, reason: "errors.extension_gmail_fetch_failed" });
        continue;
      }
      attachments.push({
        attachmentId: item.attachmentId,
        name: meta.name,
        mimeType: meta.mimeType,
        bytes,
      });
    } catch {
      skipped.push({ name: meta.name, reason: "errors.extension_gmail_fetch_failed" });
    }
  }

  return { email, attachments, skipped };
}

async function getSelectedTeamId(teams) {
  const stored = await chrome.storage.sync.get(["selectedTeamId"]);
  const selected = String(stored.selectedTeamId || "");
  if (selected && teams.some((team) => team.id === selected)) return selected;
  const withDrive = teams.find((team) => team.googleDriveConnected);
  return withDrive?.id || teams[0]?.id || "";
}

async function sessionResponse() {
  const result = await apiFetch("/api/extension/session");
  if (result?.data) {
    const teams = Array.isArray(result.data.teams) ? result.data.teams : [];
    const selectedTeamId = await getSelectedTeamId(teams);
    if (selectedTeamId) {
      await chrome.storage.sync.set({ selectedTeamId });
    }
    result.data.selectedTeamId = selectedTeamId;
  }
  return result;
}

async function waitForTabMatch(tabId, test, timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const tab = await chrome.tabs.get(tabId);
      const url = String(tab.url || "");
      if (test(url)) return url;
    } catch {
      return "";
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return "";
}

function isPluginLoginDoneUrl(url) {
  if (!url.includes("/auth/gmail-plugin/done")) return false;
  return (
    url.includes("logged_in=1") ||
    url.includes("connected=1") ||
    url.includes("error=")
  );
}

async function fetchBootstrapFromTicket(origin, ticket) {
  const base = preferLiveOrigin(parseOrigin(origin));
  const value = String(ticket || "").trim();
  if (!base || !value) return null;
  try {
    const response = await fetch(`${base}/api/extension/bootstrap-from-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      redirect: "manual",
      body: JSON.stringify({ ticket: value }),
    });
    if (response.status >= 300 && response.status < 400) return null;
    const data = await response.json().catch(() => null);
    if (data?.ok && data?.session?.access_token) return data.session;
  } catch {
    return null;
  }
  return null;
}

async function readBootstrapTicketFromTab(tabId) {
  if (!chrome.scripting?.executeScript) return "";
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () =>
        document
          .querySelector("[data-routine-bootstrap-ticket]")
          ?.getAttribute("data-routine-bootstrap-ticket") || "",
    });
    return String(result || "").trim();
  } catch {
    return "";
  }
}

async function captureSessionFromDone(
  url,
  cookieHeader,
  directSession,
  bootstrapTicket,
  tabId,
) {
  const origin = preferLiveOrigin(parseOrigin(url));
  if (!origin) return "";

  let session = directSession;
  if (!session?.access_token) {
    const ticket =
      String(bootstrapTicket || "").trim() ||
      (tabId ? await readBootstrapTicketFromTab(tabId) : "");
    if (ticket) {
      session = await fetchBootstrapFromTicket(origin, ticket);
    }
  }

  if (session?.access_token) {
    await rememberSession(origin, session);
    if (sessionUsable(session)) return origin;
    if (await getAccessToken(origin)) return origin;
    const stored = await readStoredSession();
    if (
      stored?.session?.access_token &&
      originsEquivalent(stored.appBase, origin)
    ) {
      return origin;
    }
    return "";
  }

  if (cookieHeader) {
    const fromPage = sessionFromAuthCookieList(cookiesFromHeader(cookieHeader));
    if (fromPage.session?.access_token) {
      await rememberSession(origin, fromPage.session);
    }
  }
  await importSessionFromKnownCookies(origin);
  if (await getAccessToken(origin)) return origin;
  const stored = await readStoredSession();
  if (
    stored?.session?.access_token &&
    originsEquivalent(stored.appBase, origin)
  ) {
    return origin;
  }
  return "";
}

async function waitForPluginSession(tabId, preferredOrigin, timeoutMs = 180000) {
  const started = Date.now();
  let sawDone = false;
  let sawError = false;
  const onUpdated = (id, info, tab) => {
    if (id !== tabId) return;
    const url = String(info.url || tab?.url || "");
    if (!url.includes("/auth/gmail-plugin/done")) return;
    sawDone = true;
    if (url.includes("error=")) {
      sawError = true;
      return;
    }
    void (async () => {
      await markPluginSignedIn();
      await captureSessionFromDone(url, "", null, "", tabId);
    })();
  };
  chrome.tabs.onUpdated.addListener(onUpdated);
  try {
    while (Date.now() - started < timeoutMs) {
      const imported = await importSessionFromKnownCookies(preferredOrigin);
      if (imported && (await getAccessToken(imported))) return imported;
      if (sawError) return "";
      try {
        const tab = await chrome.tabs.get(tabId);
        const url = String(tab.url || tab.pendingUrl || "");
        if (url.includes("/auth/gmail-plugin/done")) {
          sawDone = true;
          if (url.includes("error=")) return "";
          const ready = await captureSessionFromDone(
            url,
            "",
            null,
            "",
            tabId,
          );
          if (ready) return ready;
        }
      } catch {
        const importedAfterClose =
          (await importSessionFromKnownCookies(preferredOrigin)) || "";
        if (importedAfterClose && (await getAccessToken(importedAfterClose))) {
          return importedAfterClose;
        }
        if (!sawDone) return "";
        await new Promise((resolve) => setTimeout(resolve, 600));
        const retry = await importSessionFromKnownCookies(preferredOrigin);
        return retry && (await getAccessToken(retry)) ? retry : "";
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return "";
  } finally {
    chrome.tabs.onUpdated.removeListener(onUpdated);
  }
}

function scheduleSessionRefresh() {
  if (!chrome.alarms) return;
  void chrome.alarms.create("routine.refreshSession", { periodInMinutes: 45 });
}

scheduleSessionRefresh();

if (chrome.cookies?.onChanged) {
  chrome.cookies.onChanged.addListener((changeInfo) => {
    if (changeInfo?.removed) return;
    const cookie = changeInfo.cookie;
    if (!/-auth-token/.test(cookie?.name || "")) return;
    void (async () => {
      const host = String(cookie.domain || "").replace(/^\./, "");
      const protocol = cookie.secure ? "https" : "http";
      const origin =
        host === "localhost" || host === "127.0.0.1"
          ? `${protocol}://${host}:3120`
          : `${protocol}://${host}`;
      const stored = await readStoredSession();
      const storedSession =
        stored && parseOrigin(stored.appBase) === parseOrigin(origin)
          ? stored.session
          : null;
      if (sessionUsable(storedSession)) return;
      if (!(await pluginCookieImportAllowed())) return;
      const { session } = await readSessionFromCookies(origin);
      if (session?.access_token) await rememberSession(origin, session);
    })();
  });
}

if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== "routine.refreshSession") return;
    void (async () => {
      const storedSync = await chrome.storage.sync.get(["appBaseUrl"]);
      const local = await readStoredSession();
      const appBase =
        parseOrigin(storedSync.appBaseUrl) ||
        parseOrigin(local?.appBase) ||
        "";
      if (!appBase) return;
      await getAccessToken(appBase);
    })();
  });
}

if (chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const url = String(changeInfo.url || tab?.url || "");
    if (!isPluginLoginDoneUrl(url) || url.includes("error=")) return;
    void (async () => {
      await markPluginSignedIn();
      await captureSessionFromDone(url, "", null, "", tabId);
    })();
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message?.type === "routine.getSession") {
        sendResponse(await sessionResponse());
        return;
      }
      if (message?.type === "routine.setTeam") {
        const teamId = String(message.teamId || "").trim();
        if (teamId) await chrome.storage.sync.set({ selectedTeamId: teamId });
        sendResponse({ ok: true, teamId });
        return;
      }
      if (message?.type === "routine.pluginAuthDone") {
        const state = String(message.state || "");
        const url = String(message.url || "");
        if (state !== "logged-in" && state !== "connected") {
          sendResponse({ ok: false });
          return;
        }
        await markPluginSignedIn();
        let session = message.session;
        if (!session?.access_token && message.bootstrapTicket) {
          const pageOrigin = preferLiveOrigin(parseOrigin(url));
          session = await fetchBootstrapFromTicket(
            pageOrigin,
            message.bootstrapTicket,
          );
        }
        const origin = await captureSessionFromDone(
          url,
          message.cookieHeader,
          session,
          message.bootstrapTicket,
          sender.tab?.id,
        );
        sendResponse({ ok: Boolean(origin) });
        return;
      }
      if (message?.type === "routine.openLogin") {
        await markPluginSignedIn();
        const appBase = await getAppBase();
        const imported = await importSessionFromKnownCookies(appBase);
        if (imported && (await getAccessToken(imported))) {
          sendResponse({ ok: true });
          return;
        }
        const stored = await chrome.storage.sync.get([
          "loginPath",
          "canonicalOrigin",
        ]);
        const wantGoogle = message.google === true;
        const loginPath = wantGoogle
          ? "/auth/gmail-plugin/login"
          : stored.loginPath || "/login";
        const tabOrigin =
          preferLiveOrigin(
            parseOrigin(stored.canonicalOrigin) || parseOrigin(appBase),
          ) || DEFAULT_APP_BASE;
        const tab = await chrome.tabs.create({
          url: `${tabOrigin}${loginPath}`,
        });
        if (!String(loginPath).includes("/auth/gmail-plugin/login")) {
          sendResponse({ ok: true });
          return;
        }
        const readyOrigin = await waitForPluginSession(tab.id, tabOrigin);
        const token = readyOrigin ? await getAccessToken(readyOrigin) : null;
        sendResponse({
          ok: Boolean(token),
          error: token ? undefined : "extension.gmail.login_failed",
        });
        return;
      }
      if (message?.type === "routine.login") {
        const appBase = preferLiveOrigin(await getAppBase()) || DEFAULT_APP_BASE;
        await ensureOriginPermission(appBase);
        const response = await fetch(`${appBase}/api/extension/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          redirect: "manual",
          body: JSON.stringify({
            email: String(message.email || ""),
            password: String(message.password || ""),
            remember: true,
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok || !data.session?.access_token) {
          sendResponse({
            ok: false,
            error: data?.error || "extension.gmail.login_failed",
            data,
          });
          return;
        }
        await markPluginSignedIn();
        await rememberSession(appBase, data.session);
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === "routine.logout") {
        await markPluginSignedOut();
        await chrome.storage.local.remove(["gmailAccessToken", "gmailTokenExpiresAt"]);
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === "routine.searchSubtasks") {
        const q = encodeURIComponent(String(message.query || ""));
        const result = await apiFetch(`/api/extension/subtasks?q=${q}&limit=25`);
        sendResponse(result);
        return;
      }
      if (message?.type === "routine.browse") {
        const step = encodeURIComponent(String(message.step || "lists"));
        const params = new URLSearchParams({ step });
        if (message.listId) params.set("listId", String(message.listId));
        if (message.parentId) params.set("parentId", String(message.parentId));
        const teamId =
          message.teamId ||
          (await chrome.storage.sync.get(["selectedTeamId"])).selectedTeamId;
        if (teamId) params.set("teamId", String(teamId));
        const result = await apiFetch(`/api/extension/browse?${params}`);
        sendResponse(result);
        return;
      }
      if (message?.type === "routine.createSubtask") {
        const result = await apiFetch("/api/extension/subtasks", {
          method: "POST",
          body: JSON.stringify({
            parentId: String(message.parentId || ""),
            title: String(message.title || ""),
            description: String(message.description || ""),
            startDate: String(message.startDate || ""),
            dueDate: String(message.dueDate || ""),
            assigneeIds: Array.isArray(message.assigneeIds)
              ? message.assigneeIds
              : [],
            status: String(message.status || ""),
          }),
        });
        sendResponse(result);
        return;
      }
      if (message?.type === "routine.connectGmail") {
        const appBase = preferLiveOrigin(await getAppBase()) || DEFAULT_APP_BASE;
        await getAccessToken(appBase);
        const stored = await readStoredSession();
        const session = stored?.session;
        if (!session?.access_token) {
          sendResponse({ ok: false, error: "errors.extension_auth_required" });
          return;
        }
        await syncBrowserSessionCookies(appBase);

        let connectUrl = `${appBase}/auth/gmail-plugin/start`;
        if (session.refresh_token) {
          try {
            const ticketResult = await apiFetch(
              "/api/extension/gmail-bridge-ticket",
              {
                method: "POST",
                body: JSON.stringify({
                  refreshToken: session.refresh_token,
                }),
              },
            );
            const ticket = ticketResult?.data?.ticket;
            if (ticketResult?.ok && ticketResult?.data?.ok !== false && ticket) {
              const bridgePath =
                ticketResult.data.bridgePath || "/auth/gmail-plugin/bridge";
              connectUrl = buildConnectGmailBridgeUrl(
                appBase,
                bridgePath,
                ticket,
              );
            }
          } catch {
            // fall through to /start (cookies may already be synced)
          }
        }

        let tab;
        try {
          tab = await chrome.tabs.create({ url: connectUrl, active: true });
        } catch {
          sendResponse({ ok: false, error: "errors.extension_gmail_auth" });
          return;
        }
        if (!tab?.id) {
          sendResponse({ ok: false, error: "errors.extension_gmail_auth" });
          return;
        }

        // Wait for Gmail OAuth done (not plugin login done, not intermediate /login).
        const doneUrl = await waitForTabMatch(tab.id, (url) => {
          if (!url.includes("/auth/gmail-plugin/done")) return false;
          return url.includes("connected=1") || url.includes("error=");
        });
        if (!doneUrl || doneUrl.includes("error=")) {
          sendResponse({ ok: false, error: "errors.extension_gmail_auth" });
          return;
        }
        await chrome.storage.local.remove([
          "gmailAccessToken",
          "gmailTokenExpiresAt",
        ]);
        let connected = false;
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const after = await sessionResponse();
          if (after?.data?.gmailConnected) {
            connected = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
        sendResponse({
          ok: connected,
          error: connected ? undefined : "errors.extension_gmail_auth",
        });
        return;
      }
      if (message?.type === "routine.listAttachments") {
        const gmailMessageId = String(message.gmailMessageId || "").trim();
        const gmailThreadId = String(message.gmailThreadId || "").trim();
        if (!gmailMessageId && !gmailThreadId) {
          sendResponse({
            ok: false,
            error: "errors.extension_gmail_message_id",
          });
          return;
        }
        try {
          const listed = await listGmailAttachments(
            gmailMessageId,
            gmailThreadId,
            true,
          );
          sendResponse({
            ok: true,
            data: {
              ok: true,
              gmailMessageId: listed.gmailMessageId,
              attachments: listed.attachments,
            },
          });
        } catch (error) {
          sendResponse({
            ok: false,
            error: normalizeExtensionError(
              error,
              "errors.extension_gmail_fetch_failed",
            ),
          });
        }
        return;
      }
      if (message?.type === "routine.attachEmail") {
        const gmailMessageId = String(message.gmailMessageId || "").trim();
        const gmailThreadId = String(message.gmailThreadId || "").trim();
        const selectedAttachments =
          message.selectedAttachments === null ||
          message.selectedAttachments === undefined
            ? null
            : Array.isArray(message.selectedAttachments)
              ? message.selectedAttachments
              : Array.isArray(message.selectedAttachmentIds)
                ? message.selectedAttachmentIds.map((id) => ({
                    attachmentId: String(id),
                    name: "attachment",
                    mimeType: "",
                  }))
                : null;
        const includeEmailBody = message.includeEmailBody !== false;
        const wantsFileAttachments =
          selectedAttachments === null ||
          (Array.isArray(selectedAttachments) &&
            selectedAttachments.length > 0);
        let email = {
          subject: String(message.email?.subject || ""),
          from: String(message.email?.from || ""),
          to: String(message.email?.to || ""),
          date: String(message.email?.date || ""),
          body: String(message.email?.body || ""),
          bodyHtml: String(message.email?.bodyHtml || ""),
          permalink: String(message.email?.permalink || ""),
        };
        let attachmentFiles = [];
        let skippedDownloads = [];

        const tabId = sender.tab?.id;
        const scrapedEnough =
          Boolean(email.subject || email.body || email.bodyHtml);

        if (wantsFileAttachments && (gmailMessageId || gmailThreadId)) {
          try {
            const bundle = await fetchGmailMessageBundle(
              gmailMessageId,
              gmailThreadId,
              true,
              selectedAttachments,
              (progress) => postAttachProgress(tabId, progress),
            );
            email = {
              subject: bundle.email.subject || email.subject,
              from: bundle.email.from || email.from,
              to: bundle.email.to || email.to,
              date: bundle.email.date || email.date,
              body: bundle.email.body || email.body,
              bodyHtml: bundle.email.bodyHtml || email.bodyHtml,
              permalink: bundle.email.permalink || email.permalink,
            };
            attachmentFiles = bundle.attachments;
            skippedDownloads = Array.isArray(bundle.skipped)
              ? bundle.skipped
              : [];
          } catch (error) {
            sendResponse({
              ok: false,
              error: normalizeExtensionError(
                error,
                "errors.extension_gmail_fetch_failed",
              ),
            });
            return;
          }
        } else if (includeEmailBody && scrapedEnough) {
          // Email text only from Gmail DOM — no Gmail OAuth needed.
        } else if (!gmailMessageId && !gmailThreadId) {
          sendResponse({
            ok: false,
            error: "errors.extension_gmail_message_id",
          });
          return;
        } else if (!includeEmailBody && !wantsFileAttachments) {
          sendResponse({
            ok: false,
            error: "errors.extension_nothing_attached",
          });
          return;
        } else {
          // Need Gmail API for body enrichment but OAuth may fail — try scrape-only.
          if (!includeEmailBody || !scrapedEnough) {
            sendResponse({
              ok: false,
              error: "errors.extension_gmail_auth",
            });
            return;
          }
        }

        postAttachProgress(tabId, {
          key: "extension.gmail.progress_upload",
          params: { count: (includeEmailBody ? 1 : 0) + attachmentFiles.length },
          percent: 78,
        });

        const result = await apiFetch("/api/extension/attach-email", {
          method: "POST",
          body: JSON.stringify({
            taskId: String(message.taskId || ""),
            subject: email.subject,
            from: email.from,
            to: email.to,
            date: email.date,
            body: email.body,
            bodyHtml: email.bodyHtml || "",
            permalink: email.permalink,
            includeEmailBody,
            attachments: attachmentFiles.map((attachment) => ({
              name: attachment.name || "attachment.bin",
              mimeType: attachment.mimeType || "application/octet-stream",
              data: bytesToBase64(attachment.bytes),
            })),
          }),
        });
        if (result?.data && Array.isArray(skippedDownloads) && skippedDownloads.length) {
          result.data.skipped = [
            ...(Array.isArray(result.data.skipped) ? result.data.skipped : []),
            ...skippedDownloads,
          ];
        }
        sendResponse(result);
        return;
      }
      if (message?.type === "routine.getAppBase") {
        sendResponse({ ok: true, appBase: await getAppBase() });
        return;
      }
      sendResponse({ ok: false, error: "unknown_message" });
    } catch (error) {
      sendResponse({
        ok: false,
        error: normalizeExtensionError(error),
      });
    }
  })();
  return true;
});
