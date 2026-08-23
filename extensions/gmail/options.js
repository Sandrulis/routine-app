const FALLBACK = {
  "extension.gmail.checking_app": "Meklē TASQIN…",
  "extension.gmail.checking_session": "Pārbauda TASQIN sesiju…",
  "auth.login.title": "Ienākt",
  "auth.google.continue": "Turpināt ar Google",
  "common.email": "E-pasts",
  "auth.fields.password": "Parole",
  "extension.gmail.login_failed": "Neizdevās ienākt.",
  "errors.extension_login_mfa":
    "Šim kontam ir MFA. Pabeidz ienākšanu TASQIN lapā un mēģini vēlreiz.",
  "errors.auth_invalid": "E-pasts vai parole nav pareiza.",
  "errors.extension_auth_required":
    "Ielogojies TASQIN (tajā pašā pārlūkā) un mēģini vēlreiz.",
  "nav.team": "Komanda",
  "extension.gmail.team.label": "Komanda",
  "extension.gmail.team.drive_missing":
    "Šai komandai nav pieslēgts Google Drive. Spraudnis nestrādās.",
  "extension.gmail.connect_gmail": "Savienot Gmail",
  "extension.gmail.connect_gmail_hint":
    "Custom login kontam Gmail jāsavieno šeit. Savienojums tiks saglabāts arī TASQIN.",
  "extension.gmail.gmail_connected": "Gmail savienots: {email}",
  "extension.gmail.plugin_disabled":
    "Gmail spraudnis sistēmā ir izslēgts. Ieslēdz to Administrācija → Moduļi.",
  "extension.gmail.options.connecting": "Atveras Google atļauju logs…",
  "extension.gmail.options.connected": "Gmail savienots.",
  "extension.gmail.options.connect_failed":
    "Neizdevās savienot Gmail. Pārbaudi Google OAuth un Gmail API.",
  "user_menu.sign_out": "Iziet",
  "errors.extension_unknown": "Nezināma kļūda.",
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
  return interpolate(strings[key] || FALLBACK[key] || key, {
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
  $("teamLabel").textContent = t("extension.gmail.team.label");
  $("driveWarn").textContent = t("extension.gmail.team.drive_missing");
  $("pluginWarn").textContent = t("extension.gmail.plugin_disabled");
  $("connectGmail").textContent = t("extension.gmail.connect_gmail");
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
  const gmailLabel = t("extension.gmail.gmail_connected", { email: gmailEmail });
  $("gmailBadge").classList.toggle("hidden", !gmailConnected);
  $("gmailTip").textContent = gmailLabel;
  $("gmailBadge").title = gmailLabel;
  $("gmailBadge").setAttribute("aria-label", gmailLabel);
  $("gmailStatus").textContent = gmailConnected
    ? ""
    : t("extension.gmail.connect_gmail_hint");
  $("gmailStatus").classList.toggle("hidden", gmailConnected);
  $("connectWrap").classList.toggle("hidden", gmailConnected);

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
  setStatus("", true);
  await send("routine.openLogin");
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
