const DEFAULT_APP_BASE = "http://localhost:3120";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const EXTENSION_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

async function getAppBase() {
  const stored = await chrome.storage.sync.get(["appBaseUrl"]);
  const raw = String(stored.appBaseUrl || DEFAULT_APP_BASE).trim();
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_APP_BASE;
  }
}

async function getAccessToken(appBase) {
  const cookies = await chrome.cookies.getAll({ url: appBase });
  const authCookies = cookies.filter((cookie) =>
    /-auth-token(\.\d+)?$/.test(cookie.name),
  );
  if (authCookies.length === 0) return null;

  const groups = new Map();
  for (const cookie of authCookies) {
    const match = /^(.*-auth-token)(?:\.(\d+))?$/.exec(cookie.name);
    if (!match) continue;
    const base = match[1];
    const index = match[2] ? Number(match[2]) : 0;
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push({ index, value: cookie.value });
  }

  for (const parts of groups.values()) {
    parts.sort((a, b) => a.index - b.index);
    const raw = parts.map((part) => part.value).join("");
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
        if (parsed && typeof parsed.access_token === "string") {
          return parsed.access_token;
        }
      } catch {
        // try next
      }
      try {
        const decoded = atob(candidate.replace(/-/g, "+").replace(/_/g, "/"));
        let parsed = JSON.parse(decoded);
        if (typeof parsed === "string") parsed = JSON.parse(parsed);
        if (parsed && typeof parsed.access_token === "string") {
          return parsed.access_token;
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
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
    credentials: "include",
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

async function getGmailClientId() {
  const stored = await chrome.storage.sync.get(["gmailClientId"]);
  return String(stored.gmailClientId || "").trim();
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

async function getGmailAccessToken(interactive) {
  const cached = await getCachedGmailToken();
  if (cached) return cached;

  const clientId = await getGmailClientId();
  if (!clientId) {
    throw new Error("errors.extension_gmail_client_id");
  }

  const redirectUri = chrome.identity.getRedirectURL("oauth2");
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", GMAIL_SCOPE);
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("prompt", interactive ? "consent" : "none");

  let responseUrl;
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: Boolean(interactive),
    });
  } catch (error) {
    if (!interactive) return null;
    throw error;
  }
  if (!responseUrl) {
    throw new Error("errors.extension_gmail_auth");
  }

  const hash = new URL(responseUrl).hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const expiresIn = params.get("expires_in");
  if (!accessToken) {
    throw new Error("errors.extension_gmail_auth");
  }
  await saveGmailToken(accessToken, expiresIn);
  return accessToken;
}

function walkParts(part, out) {
  if (!part) return;
  if (Array.isArray(part.parts)) {
    for (const child of part.parts) walkParts(child, out);
  }
  const filename = part.filename?.trim();
  const attachmentId = part.body?.attachmentId;
  if (filename && attachmentId) {
    out.push({
      filename,
      mimeType: part.mimeType || "application/octet-stream",
      attachmentId,
      size: Number(part.body.size) || 0,
    });
  }
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
  function walkHtml(part) {
    if (!part) return "";
    if (Array.isArray(part.parts)) {
      for (const child of part.parts) {
        const html = walkHtml(child);
        if (html) return html;
      }
      return "";
    }
    if (String(part.mimeType || "").toLowerCase() === "text/html") {
      return decodeBodyData(part)
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    return "";
  }
  return walkHtml(payload);
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

async function fetchGmailMessageBundle(messageId, threadId, interactive) {
  const token = await getGmailAccessToken(interactive);
  if (!token) throw new Error("errors.extension_gmail_auth");

  const message = await resolveGmailMessage(messageId, threadId, token);
  const resolvedId = message.id || messageId;
  const headers = message.payload?.headers || [];
  const email = {
    subject: headerValue(headers, "Subject"),
    from: headerValue(headers, "From"),
    to: headerValue(headers, "To"),
    date: headerValue(headers, "Date"),
    body: extractBodyText(message.payload),
    permalink: `https://mail.google.com/mail/u/0/#all/${resolvedId}`,
  };

  const parts = [];
  walkParts(message.payload, parts);
  const attachments = [];
  for (const part of parts) {
    if (part.size > EXTENSION_UPLOAD_MAX_BYTES) continue;
    const att = await gmailGet(
      `users/me/messages/${encodeURIComponent(resolvedId)}/attachments/${encodeURIComponent(part.attachmentId)}`,
      token,
    );
    if (!att?.data) continue;
    const bytes = base64UrlToBytes(att.data);
    if (bytes.length <= 0 || bytes.length > EXTENSION_UPLOAD_MAX_BYTES) continue;
    attachments.push({
      name: part.filename.replace(/[<>:"/\\|?*]/g, "_").slice(0, 180) || "attachment.bin",
      mimeType: part.mimeType || "application/octet-stream",
      bytes,
    });
  }

  return { email, attachments };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      if (message?.type === "routine.getSession") {
        const result = await apiFetch("/api/extension/session");
        sendResponse(result);
        return;
      }
      if (message?.type === "routine.searchSubtasks") {
        const q = encodeURIComponent(String(message.query || ""));
        const result = await apiFetch(`/api/extension/subtasks?q=${q}&limit=25`);
        sendResponse(result);
        return;
      }
      if (message?.type === "routine.connectGmail") {
        await getGmailAccessToken(true);
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === "routine.attachEmail") {
        const gmailMessageId = String(message.gmailMessageId || "").trim();
        const gmailThreadId = String(message.gmailThreadId || "").trim();
        let email = {
          subject: String(message.email?.subject || ""),
          from: String(message.email?.from || ""),
          to: String(message.email?.to || ""),
          date: String(message.email?.date || ""),
          body: String(message.email?.body || ""),
          permalink: String(message.email?.permalink || ""),
        };
        let attachmentFiles = [];

        if (gmailMessageId || gmailThreadId) {
          try {
            const bundle = await fetchGmailMessageBundle(
              gmailMessageId,
              gmailThreadId,
              true,
            );
            email = {
              subject: bundle.email.subject || email.subject,
              from: bundle.email.from || email.from,
              to: bundle.email.to || email.to,
              date: bundle.email.date || email.date,
              body: bundle.email.body || email.body,
              permalink: bundle.email.permalink || email.permalink,
            };
            attachmentFiles = bundle.attachments;
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

        const form = new FormData();
        form.set("taskId", String(message.taskId || ""));
        form.set("subject", email.subject);
        form.set("from", email.from);
        form.set("to", email.to);
        form.set("date", email.date);
        form.set("body", email.body);
        form.set("permalink", email.permalink);

        for (const attachment of attachmentFiles) {
          const blob = new Blob([attachment.bytes], {
            type: attachment.mimeType || "application/octet-stream",
          });
          form.append("attachment", blob, attachment.name || "attachment.bin");
        }

        const result = await apiFetch("/api/extension/attach-email", {
          method: "POST",
          body: form,
        });
        sendResponse(result);
        return;
      }
      if (message?.type === "routine.getAppBase") {
        sendResponse({ ok: true, appBase: await getAppBase() });
        return;
      }
      if (message?.type === "routine.getRedirectUri") {
        sendResponse({
          ok: true,
          redirectUri: chrome.identity.getRedirectURL("oauth2"),
        });
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
