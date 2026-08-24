const FALLBACK = {
  "extension.gmail.checking_app": "Ielādē {SYSTEM_NAME}…",
  "extension.gmail.checking_session": "Pārbauda TASQIN sesiju…",
  "auth.login.title": "Ienākt",
  "auth.google.continue": "Turpināt ar Google",
  "common.email": "E-pasts",
  "auth.fields.password": "Parole",
  "auth.fields.password_show": "Rādīt paroli",
  "auth.fields.password_hide": "Paslēpt paroli",
  "extension.gmail.login_failed": "Neizdevās ienākt.",
  "errors.extension_login_mfa":
    "Šim kontam ir MFA. Pabeidz ienākšanu TASQIN lapā un mēģini vēlreiz.",
  "errors.auth_invalid": "E-pasts vai parole nav pareiza.",
  "errors.extension_auth_required":
    "Ienāc TASQIN spraudnī. Sesija paliek aptuveni 30 dienas, arī ja lapa ir aizvērta.",
  "nav.team": "Komanda",
  "extension.gmail.team.label": "Komanda",
  "extension.gmail.team.drive_missing":
    "Šai komandai nav pieslēgts Google Drive. Spraudnis nestrādās.",
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

let strings = { ...FALLBACK };
let systemName = "TASQIN";

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
  return interpolate(strings[resolved] || FALLBACK[resolved] || resolved, {
    SYSTEM_NAME: systemName,
    ...params,
  });
}

function applySessionI18n(data) {
  if (data?.languageCode) document.documentElement.lang = data.languageCode;
  const name = String(data?.systemName || "").trim();
  if (name) systemName = name;
  if (data?.strings && typeof data.strings === "object") {
    strings = { ...FALLBACK, ...data.strings };
  }
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
  return String(email || "R").charAt(0).toUpperCase();
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
  $("driveWarn").textContent = t("extension.gmail.team.drive_missing");
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
  const driveOk = Boolean(current?.googleDriveConnected);
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

async function refreshUi() {
  applyLabels();
  $("boot").classList.remove("hidden");
  $("login").classList.add("hidden");
  $("account").classList.add("hidden");
  const result = await send("routine.getSession");
  const session = result?.data || null;
  applySessionI18n(session);
  applyLabels();
  $("boot").classList.add("hidden");

  if (!session?.authenticated) {
    $("login").classList.remove("hidden");
    $("googleWrap").classList.toggle("hidden", session?.googleSignInEnabled === false);
    $("passwordWrap").classList.toggle(
      "hidden",
      session?.emailPasswordEnabled === false,
    );
    fitPopup();
    return session;
  }

  $("account").classList.remove("hidden");
  renderAccount(session);
  fitPopup();
  return session;
}

function fitPopup() {
  document.documentElement.style.height = "auto";
  document.body.style.height = "auto";
}

$("googleLogin").addEventListener("click", async () => {
  setStatus(t("extension.gmail.options.connecting"));
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

applyLabels();
void refreshUi();
