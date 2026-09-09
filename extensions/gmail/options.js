const FALLBACK_LV = {
  "extension.gmail.checking_app": "Ielādē {SYSTEM_NAME}…",
  "extension.gmail.checking_session": "Pārbauda TASQIN sesiju…",
  "auth.login.title": "Ienākt",
  "auth.google.continue": "Turpināt ar Google",
  "common.email": "E-pasts",
  "auth.fields.password": "Parole",
  "auth.fields.password_show": "Rādīt paroli",
  "auth.fields.password_hide": "Paslēpt paroli",
  "extension.gmail.login_failed": "Neizdevās ienākt.",
  "extension.gmail.site_access_required":
    "Atļauj piekļuvi TASQIN, lai spraudnis varētu pabeigt ielogošanos.",
  "errors.extension_login_mfa":
    "Šim kontam ir MFA. Pabeidz ienākšanu TASQIN lapā un mēģini vēlreiz.",
  "errors.auth_invalid": "E-pasts vai parole nav pareiza.",
  "errors.extension_auth_required":
    "Ienāc TASQIN spraudnī. Sesija paliek aptuveni 30 dienas, arī ja lapa ir aizvērta.",
  "nav.team": "Komanda",
  "extension.gmail.team.label": "Komanda",
  "extension.gmail.team.drive_missing":
    "Šai komandai nav pieslēgts Google Drive. Spraudnis nestrādās.",
  "errors.extension_team_drive_missing":
    "Šai komandai nav pieslēgts Google Drive. Spraudnis nestrādās.",
  "errors.extension_team_onedrive_missing":
    "Šai komandai nav pieslēgts OneDrive. Spraudnis nestrādās.",
  "errors.extension_team_cloud_missing":
    "Šai komandai nav pieslēgts Google Drive vai OneDrive. Spraudnis nestrādās.",
  "extension.gmail.connect_gmail": "Savienot Gmail",
  "extension.gmail.reconnect_gmail": "Atjaunot Gmail savienojumu",
  "extension.gmail.connect_gmail_hint":
    "Custom login kontam Gmail jāsavieno šeit. Savienojums tiks saglabāts arī TASQIN.",
  "extension.gmail.reconnect_gmail_hint":
    "Pēc sistēmas vai OAuth izmaiņām atjauno Gmail piekļuvi šeit.",
  "extension.gmail.gmail_connected": "Gmail savienots: {email}",
  "extension.gmail.plugin_disabled":
    "Gmail spraudnis sistēmā ir izslēgts. Ieslēdz to Administrācija → Moduļi.",
  "extension.gmail.options.connecting": "Atveras Google atļauju logs…",
  "extension.gmail.options.connected": "Gmail savienots.",
  "extension.gmail.options.connect_failed":
    "Neizdevās savienot Gmail. Pārbaudi Google OAuth un Gmail API.",
  "user_menu.sign_out": "Iziet",
  "errors.extension_unknown": "Nezināma kļūda.",
  "errors.extension_network":
    "Neizdevās savienoties ar serveri. Pārbaudi internetu un mēģini vēlreiz.",
};

const FALLBACK_EN = {
  "extension.gmail.checking_app": "Loading {SYSTEM_NAME}…",
  "extension.gmail.checking_session": "Checking TASQIN session…",
  "auth.login.title": "Sign in",
  "auth.google.continue": "Continue with Google",
  "common.email": "Email",
  "auth.fields.password": "Password",
  "auth.fields.password_show": "Show password",
  "auth.fields.password_hide": "Hide password",
  "extension.gmail.login_failed": "Could not sign in.",
  "extension.gmail.site_access_required":
    "Allow access to TASQIN so the plugin can finish signing in.",
  "errors.extension_login_mfa":
    "This account has MFA. Finish signing in on the TASQIN page and try again.",
  "errors.auth_invalid": "Email or password is incorrect.",
  "errors.extension_auth_required":
    "Sign in to the TASQIN extension. The session lasts about 30 days, even if the website is closed.",
  "nav.team": "Team",
  "extension.gmail.team.label": "Team",
  "extension.gmail.team.drive_missing":
    "This team has no Google Drive connected. The plugin will not work.",
  "errors.extension_team_drive_missing":
    "This team has no Google Drive connected. The plugin will not work.",
  "errors.extension_team_onedrive_missing":
    "This team has no OneDrive connected. The plugin will not work.",
  "errors.extension_team_cloud_missing":
    "This team has no Google Drive or OneDrive connected. The plugin will not work.",
  "extension.gmail.connect_gmail": "Connect Gmail",
  "extension.gmail.reconnect_gmail": "Reconnect Gmail",
  "extension.gmail.connect_gmail_hint":
    "Custom-login accounts must connect Gmail here. The connection is also saved in TASQIN.",
  "extension.gmail.reconnect_gmail_hint":
    "After system or OAuth changes, renew Gmail access here.",
  "extension.gmail.gmail_connected": "Gmail connected: {email}",
  "extension.gmail.plugin_disabled":
    "The Gmail plugin is disabled. Turn it on in Administration → Modules.",
  "extension.gmail.options.connecting": "Google permission window is opening…",
  "extension.gmail.options.connected": "Gmail connected.",
  "extension.gmail.options.connect_failed":
    "Could not connect Gmail. Check the Google Plugin integration and the Gmail API.",
  "user_menu.sign_out": "Sign out",
  "errors.extension_unknown": "Unknown error.",
  "errors.extension_network":
    "Could not reach the server. Check your connection and try again.",
};

function chromeUiLanguage() {
  try {
    const raw = String(chrome.i18n.getUILanguage() || "")
      .trim()
      .toLowerCase();
    const primary = raw.split(/[-_]/)[0] || "";
    if (primary === "nb" || primary === "nn") return "no";
    return primary || "en";
  } catch {
    return "en";
  }
}

function fallbackTable(lang) {
  return lang === "lv" ? FALLBACK_LV : FALLBACK_EN;
}

const chromeLang = chromeUiLanguage();
let strings = { ...fallbackTable(chromeLang) };
let systemName = "TASQIN";
let i18nHydrated = false;
try {
  document.documentElement.lang = chromeLang;
} catch {
  // popup document not ready
}

function interpolate(value, params) {
  if (!params) return value;
  return String(value).replace(/\{(\w+)\}/g, (_, key) =>
    params[key] == null ? `{${key}}` : String(params[key]),
  );
}

function t(key, params) {
  let resolved = key;
  if (
    /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(
      String(key || ""),
    )
  ) {
    resolved = "errors.extension_network";
  }
  return interpolate(
    strings[resolved] ||
      fallbackTable(chromeLang)[resolved] ||
      FALLBACK_EN[resolved] ||
      resolved,
    {
      SYSTEM_NAME: systemName,
      ...params,
    },
  );
}

function extensionCloudMissingKey(session) {
  const driveOn = session?.googleDriveEnabled !== false;
  const odOn = session?.oneDriveEnabled === true;
  if (driveOn && odOn) return "errors.extension_team_cloud_missing";
  if (odOn) return "errors.extension_team_onedrive_missing";
  return "errors.extension_team_drive_missing";
}

function applySessionI18n(data, options = {}) {
  if (data?.languageCode) document.documentElement.lang = data.languageCode;
  const name = String(data?.systemName || "").trim();
  if (name && !/^routine$/i.test(name)) systemName = name;
  if (!data?.strings || typeof data.strings !== "object") return;
  strings = { ...fallbackTable(data.languageCode || chromeLang), ...data.strings };
  i18nHydrated = true;
  if (options.persist === false) return;
  const persistKey = data.authenticated
    ? "extensionI18n"
    : "extensionI18nDefault";
  void chrome.storage.local.set({
    [persistKey]: {
      languageCode: data.languageCode || "",
      systemName: name,
      strings: data.strings,
    },
  });
}

async function hydrateI18n() {
  applyLabels();
  let stored = {};
  try {
    stored = await chrome.storage.local.get([
      "extensionI18n",
      "extensionI18nDefault",
    ]);
  } catch {
    stored = {};
  }
  applySessionI18n(stored.extensionI18n || stored.extensionI18nDefault, {
    persist: false,
  });
  applyLabels();
  if (stored.extensionI18n?.strings) return;
  if (i18nHydrated && document.documentElement.lang === chromeLang) return;
  const result = await send("routine.getPublicI18n", { lang: chromeLang });
  applySessionI18n(result?.data, { persist: false });
  applyLabels();
}

function $(id) {
  return document.getElementById(id);
}

function setStatus(text, ok) {
  const el = $("status");
  el.className = ok === true ? "ok" : ok === false ? "err" : "";
  el.textContent = text || "";
}

function initials(first, last, email) {
  const a = String(first || "").trim().charAt(0);
  const b = String(last || "").trim().charAt(0);
  const fromName = `${a}${b}`.toUpperCase();
  if (fromName.trim()) return fromName;
  return String(email || systemName || "").charAt(0).toUpperCase();
}

function applyLabels() {
  $("boot").textContent = t("extension.gmail.checking_app");
  $("loginHint").textContent = t("errors.extension_auth_required");
  $("googleLogin").textContent = t("auth.google.continue");
  $("emailLabel").textContent = t("common.email");
  $("passwordLabel").textContent = t("auth.fields.password");
  $("passwordLogin").textContent = t("auth.login.title");
  updatePasswordToggle(false);
  $("teamLabel").textContent = t("extension.gmail.team.label");
  $("driveWarn").textContent = t("errors.extension_team_drive_missing");
  $("pluginWarn").textContent = t("extension.gmail.plugin_disabled");
  const signOutLabel = t("user_menu.sign_out");
  $("signOut").title = signOutLabel;
  $("signOut").setAttribute("aria-label", signOutLabel);
}

function send(type, payload = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      resolve(response || { ok: false });
    });
  });
}

const SESSION_CACHE_KEY = "extensionSessionCache";

const SESSION_SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Read the worker's cached session straight from storage. Waking the service
 * worker with sendMessage costs more than the popup's whole first paint.
 */
async function readCachedSessionSnapshot() {
  try {
    const data = await chrome.storage.local.get([SESSION_CACHE_KEY]);
    const entry = data[SESSION_CACHE_KEY];
    const at = Number(entry?.at) || 0;
    if (!at || Date.now() - at > SESSION_SNAPSHOT_MAX_AGE_MS) return null;
    return entry?.result?.data ?? null;
  } catch {
    return null;
  }
}

/** @type {((result: object | null) => void) | null} */
let sessionPushWaiter = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "routine.sessionUpdated") return;
  if (sessionPushWaiter) {
    sessionPushWaiter(message.result || null);
    sessionPushWaiter = null;
    return;
  }
  // Background revalidation landed: repaint without flipping to the login view
  // on a transient failure — an expired session shows on the next open.
  const data = message.result?.data;
  if (!data?.authenticated) return;
  applySessionI18n(data);
  applyLabels();
  showAccount(data);
});

function waitForSessionPush(timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      sessionPushWaiter = null;
      resolve(null);
    }, timeoutMs);
    sessionPushWaiter = (result) => {
      clearTimeout(timer);
      resolve(result);
    };
  });
}

function selectedTeam(session) {
  const teams = Array.isArray(session?.teams) ? session.teams : [];
  const selectedId = session?.selectedTeamId || "";
  return teams.find((team) => team.id === selectedId) || teams[0] || null;
}

function renderAccount(session) {
  const user = session?.user || {};
  const first = user.firstName || "";
  const last = user.lastName || "";
  const name = `${first} ${last}`.trim() || user.name || "";
  $("displayName").textContent = name;
  $("displayEmail").textContent = user.email || "";
  const avatarWrap = $("avatarFallback");
  avatarWrap.textContent = initials(first, last, user.email);
  avatarWrap.querySelector("img")?.remove();
  if (user.avatarUrl) {
    const img = document.createElement("img");
    img.alt = "";
    img.src = user.avatarUrl;
    img.addEventListener("error", () => img.remove());
    avatarWrap.textContent = "";
    avatarWrap.appendChild(img);
  }

  const teams = Array.isArray(session.teams) ? session.teams : [];
  const teamSelect = $("team");
  teamSelect.innerHTML = "";
  for (const team of teams) {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.name || team.id;
    teamSelect.appendChild(option);
  }
  const current = selectedTeam(session);
  if (current) teamSelect.value = current.id;
  const driveOk = Boolean(
    (session.googleDriveEnabled !== false && current?.googleDriveConnected) ||
      (session.oneDriveEnabled === true && current?.oneDriveConnected),
  );
  $("driveWarn").textContent = t(extensionCloudMissingKey(session));
  $("driveWarn").classList.toggle("hidden", !current || driveOk);

  const gmailConnected = Boolean(session.gmailConnected);
  const gmailEmail = session.gmailEmail || user.email || "";
  const connectLabel = gmailConnected
    ? t("extension.gmail.reconnect_gmail")
    : t("extension.gmail.connect_gmail");
  const connectTip = gmailConnected
    ? `${t("extension.gmail.gmail_connected", { email: gmailEmail })}. ${t("extension.gmail.reconnect_gmail_hint")}`
    : `${connectLabel}. ${t("extension.gmail.connect_gmail_hint")}`;
  const connectBtn = $("connectGmail");
  connectBtn.classList.toggle("needs-attention", !gmailConnected);
  connectBtn.title = connectTip;
  connectBtn.setAttribute("aria-label", connectLabel);
  $("connectGmailTip").textContent = connectTip;
  $("connectGmailIcon").innerHTML = gmailConnected
    ? '<path fill="#EA4335" d="M20.5 6.2 12 12.1 3.5 6.2A2 2 0 0 1 4.7 5h14.6a2 2 0 0 1 1.2 1.2Z"/><path fill="#4285F4" d="M3 7.1V17a2 2 0 0 0 2 2h.8V9.4L3 7.1Z"/><path fill="#34A853" d="M18.2 19H19a2 2 0 0 0 2-2V7.1l-2.8 2.3V19Z"/><path fill="#FBBC05" d="M5.8 19h12.4V9.4L12 13.6 5.8 9.4V19Z"/>'
    : '<path d="M4 7.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5M4 7.5 12 13l8-5.5M4 7.5 12 4l8 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 15.5v3M15 17h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';

  const pluginOn = session.gmailPluginEnabled !== false;
  $("pluginWarn").classList.toggle("hidden", pluginOn);
}

function showAccount(session) {
  $("boot").classList.add("hidden");
  $("login").classList.add("hidden");
  $("account").classList.remove("hidden");
  renderAccount(session);
  fitPopup();
}

/**
 * `silent` keeps the already painted account on screen while revalidating, so
 * the popup never flashes a loading state when a cached session exists.
 */
async function refreshUi(options = {}) {
  const silent = options.silent === true;
  applyLabels();
  if (!silent) {
    $("boot").classList.remove("hidden");
    $("login").classList.add("hidden");
    $("account").classList.add("hidden");
  }

  const deadline = Date.now() + 15000;
  let result = await send(
    "routine.getSession",
    silent ? {} : { force: true },
  );
  let session = result?.data || null;
  applySessionI18n(session);
  applyLabels();

  while (
    !session?.authenticated &&
    session?.handoffPending &&
    Date.now() < deadline
  ) {
    $("boot").classList.remove("hidden");
    $("account").classList.add("hidden");
    $("boot").textContent = t("extension.gmail.checking_session");
    const pushed = await waitForSessionPush(1200);
    if (pushed?.data?.authenticated) {
      result = pushed;
      session = pushed.data;
      applySessionI18n(session);
      break;
    }
    result = await send("routine.getSession", { force: true });
    session = result?.data || null;
    applySessionI18n(session);
    if (session?.authenticated) break;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  $("boot").classList.add("hidden");

  if (!session?.authenticated) {
    const err = session?.error || result?.data?.error;
    if (err === "errors.extension_network") {
      // Offline revalidation must not wipe the account we already painted.
      if (silent && !$("account").classList.contains("hidden")) {
        setStatus(t("errors.extension_network"), false);
        return session;
      }
      $("boot").classList.remove("hidden");
      $("boot").textContent = t("errors.extension_network");
      fitPopup();
      return session;
    }
    $("account").classList.add("hidden");
    $("login").classList.remove("hidden");
    $("googleWrap").classList.toggle(
      "hidden",
      session?.googleSignInEnabled === false,
    );
    $("passwordWrap").classList.toggle(
      "hidden",
      session?.emailPasswordEnabled === false,
    );
    fitPopup();
    return session;
  }

  showAccount(session);
  return session;
}

function fitPopup() {
  document.documentElement.style.height = "auto";
  document.body.style.height = "auto";
}

$("googleLogin").addEventListener("click", async () => {
  setStatus(t("extension.gmail.options.connecting"));
  const granted = await ensurePluginHostAccess();
  if (!granted) {
    setStatus(t("extension.gmail.site_access_required"), false);
    return;
  }
  const result = await send("routine.openLogin", { google: true });
  if (!result?.ok) {
    setStatus(t(result?.error || "extension.gmail.login_failed"), false);
    return;
  }
  setStatus("", true);
  await refreshUi();
});

function updatePasswordToggle(visible) {
  const input = $("password");
  const button = $("passwordToggle");
  const icon = $("passwordToggleIcon");
  if (!input || !button || !icon) return;
  input.type = visible ? "text" : "password";
  button.setAttribute("aria-pressed", visible ? "true" : "false");
  const label = visible
    ? t("auth.fields.password_hide")
    : t("auth.fields.password_show");
  button.title = label;
  button.setAttribute("aria-label", label);
  icon.innerHTML = visible
    ? '<path d="M3 3l18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M9.9 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-4.1 4.8M6.1 6.2A17.5 17.5 0 0 0 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
    : '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>';
}

$("passwordToggle")?.addEventListener("click", () => {
  updatePasswordToggle($("password").type === "password");
});

$("passwordLogin").addEventListener("click", async () => {
  setStatus(t("extension.gmail.checking_session"), true);
  const granted = await ensurePluginHostAccess();
  if (!granted) {
    setStatus(t("extension.gmail.site_access_required"), false);
    return;
  }
  const result = await send("routine.login", {
    email: $("email").value,
    password: $("password").value,
  });
  if (!result?.ok) {
    setStatus(
      t(result?.error || result?.data?.error || "extension.gmail.login_failed"),
      false,
    );
    if (result?.data?.needsMfa || result?.error === "errors.extension_login_mfa") {
      await send("routine.openLogin");
    }
    return;
  }
  $("password").value = "";
  setStatus("", true);
  await refreshUi();
});

$("team").addEventListener("change", async () => {
  await send("routine.setTeam", { teamId: $("team").value });
  await refreshUi();
});

$("connectGmail").addEventListener("click", async () => {
  setStatus(t("extension.gmail.options.connecting"), true);
  const granted = await ensurePluginHostAccess({ includeGmail: true });
  if (!granted) {
    setStatus(t("extension.gmail.site_access_required"), false);
    return;
  }
  const result = await send("routine.connectGmail");
  if (!result?.ok) {
    setStatus(t(result?.error || "extension.gmail.options.connect_failed"), false);
    return;
  }
  setStatus(t("extension.gmail.options.connected"), true);
  await refreshUi();
});

$("signOut").addEventListener("click", async () => {
  await send("routine.logout");
  setStatus("", true);
  await refreshUi();
});

void (async () => {
  const [, cached] = await Promise.all([
    hydrateI18n(),
    readCachedSessionSnapshot(),
  ]);
  if (cached?.authenticated) {
    applySessionI18n(cached, { persist: false });
    applyLabels();
    showAccount(cached);
    await refreshUi({ silent: true });
    return;
  }
  await refreshUi();
})();
