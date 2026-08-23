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
  return unique(origins.flatMap(originsWithWwwFirst));
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
  await writeStoredSession(appBase, session);
  const origin = parseOrigin(appBase);
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
    await chrome.storage.sync.set({
      appBaseUrl: origin,
      authCookieName: config.authCookieName || "",
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
  if (storedOrigin && !isLocalOrigin(storedOrigin)) return storedOrigin;
  return DEFAULT_APP_BASE;
}

function parseSessionValue(raw) {
  const candidates = [raw];
  try {
    candidates.push(decodeURIComponent(raw));
  } catch {
    // ignore
  }
  for (const candidate of candidates) {
    try {
      let parsed = JSON.parse(candidate);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      if (parsed && typeof parsed.access_token === "string") return parsed;
    } catch {
      // try next
    }
    try {
      const decoded = atob(candidate.replace(/-/g, "+").replace(/_/g, "/"));
      let parsed = JSON.parse(decoded);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      if (parsed && typeof parsed.access_token === "string") return parsed;
    } catch {
      // ignore
    }
  }
  return null;
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

async function readSessionFromCookies(appBase) {
  const cookies = await chrome.cookies.getAll({ url: appBase });
  const authCookies = cookies.filter((cookie) =>
    /-auth-token(\.\d+)?$/.test(cookie.name),
  );
  if (authCookies.length === 0) return { session: null, cookieName: "" };

  const groups = new Map();
  for (const cookie of authCookies) {
    const match = /^(.*-auth-token)(?:\.(\d+))?$/.exec(cookie.name);
    if (!match) continue;
    const base = match[1];
    const index = match[2] ? Number(match[2]) : 0;
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push({ index, value: cookie.value });
  }

  for (const [cookieName, parts] of groups.entries()) {
    parts.sort((a, b) => a.index - b.index);
    const session = parseSessionValue(parts.map((part) => part.value).join(""));
    if (session) return { session, cookieName };
  }
  return { session: null, cookieName: "" };
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

function cookieWriteBase(appBase, expires) {
  return {
    url: appBase,
    path: "/",
    expirationDate: expires,
    httpOnly: true,
    sameSite: "lax",
    secure: String(appBase).startsWith("https:"),
  };
}

async function setCookieSafe(details) {
  try {
    const written = await chrome.cookies.set(details);
    if (written) return true;
  } catch {
    // Some Chrome builds reject httpOnly from extensions.
  }
  try {
    const { httpOnly: _httpOnly, ...rest } = details;
    return Boolean(await chrome.cookies.set(rest));
  } catch {
    return false;
  }
}

async function writeAuthCookies(appBase, cookieName, session) {
  if (!cookieName || !session?.access_token) return;
  await clearAuthCookies(appBase, cookieName);
  const encoded = encodeURIComponent(JSON.stringify(session));
  const expires = Math.floor(Date.now() / 1000) + AUTH_MAX_AGE_SEC;
  const chunks = [];
  for (let offset = 0; offset < encoded.length; offset += COOKIE_CHUNK) {
    chunks.push(encoded.slice(offset, offset + COOKIE_CHUNK));
  }
  const base = cookieWriteBase(appBase, expires);
  if (chunks.length === 1) {
    await setCookieSafe({
      ...base,
      name: cookieName,
      value: chunks[0],
    });
  } else {
    for (let index = 0; index < chunks.length; index += 1) {
      await setCookieSafe({
        ...base,
        name: `${cookieName}.${index}`,
        value: chunks[index],
      });
    }
  }
  await setCookieSafe({
    ...base,
    httpOnly: false,
    name: "routine-app-remember-session",
    value: "1",
  });
}

async function refreshSession(appBase, session) {
  if (!session?.refresh_token) return null;
  try {
    const response = await fetch(`${appBase}/api/extension/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
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
    await rememberSession(appBase, next);
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

async function getAccessToken(appBase) {
  const origin = parseOrigin(appBase);
  const stored = await readStoredSession();
  const storedSession =
    stored && parseOrigin(stored.appBase) === origin ? stored.session : null;

  const fromStored = await resolveAccessToken(appBase, storedSession, null);
  if (fromStored) return fromStored;

  if (!(await pluginCookieImportAllowed())) return null;
  const { session: cookieSession } = await readSessionFromCookies(appBase);
  const bootstrapped = mergeSessionPreserveRefresh(cookieSession, storedSession);
  return resolveAccessToken(appBase, bootstrapped, storedSession);
}

async function apiFetch(path, options = {}) {
  const appBase = await getAppBase();
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

  const response = await fetch(`${appBase}${path}`, {
    ...options,
    headers,
    credentials: "omit",
  });

  let data = null;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { ok: false, error: text || "errors.extension_invalid_body" };
  }
  return { ok: response.ok, status: response.status, data, appBase };
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

async function getGmailAccessToken() {
  const cached = await getCachedGmailToken();
  if (cached) return cached;
  const result = await apiFetch("/api/extension/gmail-access");
  const token = result?.data?.accessToken;
  if (!result?.ok || !token) {
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

function walkParts(part, out) {
  if (!part) return;
  if (Array.isArray(part.parts)) {
    for (const child of part.parts) walkParts(child, out);
  }
  const attachmentId = part.body?.attachmentId;
  if (!attachmentId) return;
  const mime = String(part.mimeType || "").toLowerCase();
  if (mime.startsWith("multipart/")) return;
  const filename = part.filename?.trim();
  // Large inline bodies get attachmentId without a filename — skip those.
  if (!filename) {
    if (mime.startsWith("text/")) return;
    if (mime !== "application/pdf") return;
  }
  out.push({
    filename: filename || "attachment.pdf",
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
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
  const token = await getGmailAccessToken(interactive);
  if (!token) throw new Error("errors.extension_gmail_auth");

  const message = await resolveGmailMessage(messageId, threadId, token);
  const parts = [];
  walkParts(message.payload, parts);
  return {
    gmailMessageId: message.id || messageId,
    attachments: parts.map((part) => ({
      attachmentId: String(part.attachmentId),
      name: part.filename.replace(/[<>:"/\\|?*]/g, "_").slice(0, 180) || "attachment.bin",
      mimeType: part.mimeType || "application/octet-stream",
      size: part.size,
      tooLarge: part.size > EXTENSION_UPLOAD_MAX_BYTES,
    })),
  };
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
  const token = await getGmailAccessToken(interactive);
  if (!token) throw new Error("errors.extension_gmail_auth");

  onProgress?.({
    key: "extension.gmail.progress_email",
    percent: 8,
  });
  const message = await resolveGmailMessage(messageId, threadId, token);
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
      if (test(String(tab.url || ""))) return true;
    } catch {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return false;
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
      if (message?.type === "routine.openLogin") {
        await markPluginSignedIn();
        const appBase = await getAppBase();
        await chrome.tabs.create({ url: `${appBase}/login` });
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === "routine.login") {
        const appBase = await getAppBase();
        await ensureOriginPermission(appBase);
        const response = await fetch(`${appBase}/api/extension/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
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
      if (message?.type === "routine.connectGmail") {
        const appBase = await getAppBase();
        const session = await sessionResponse();
        const path = session?.data?.connectGmailPath || "/auth/gmail-plugin/start";
        const tab = await chrome.tabs.create({ url: `${appBase}${path}` });
        const done = await waitForTabMatch(
          tab.id,
          (url) =>
            url.includes("/auth/gmail-plugin/done") &&
            (url.includes("connected=1") || url.includes("error=")),
        );
        if (!done) {
          sendResponse({ ok: false, error: "errors.extension_gmail_auth" });
          return;
        }
        await chrome.storage.local.remove(["gmailAccessToken", "gmailTokenExpiresAt"]);
        const after = await sessionResponse();
        sendResponse({
          ok: Boolean(after?.data?.gmailConnected),
          error: after?.data?.gmailConnected
            ? undefined
            : "errors.extension_gmail_auth",
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
            error:
              error instanceof Error
                ? error.message
                : "errors.extension_gmail_fetch_failed",
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
        if (gmailMessageId || gmailThreadId) {
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
            skippedDownloads = Array.isArray(bundle.skipped) ? bundle.skipped : [];
          } catch (error) {
            sendResponse({
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : "errors.extension_gmail_fetch_failed",
            });
            return;
          }
        } else {
          sendResponse({
            ok: false,
            error: "errors.extension_gmail_message_id",
          });
          return;
        }

        postAttachProgress(tabId, {
          key: "extension.gmail.progress_upload",
          params: { count: 1 + attachmentFiles.length },
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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();
  return true;
});
