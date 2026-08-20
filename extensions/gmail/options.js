const DEFAULT_APP_BASE = "http://localhost:3120";

const FALLBACK = {
  "extension.gmail.options.app_url": "Routine URL",
  "extension.gmail.options.client_id": "Gmail OAuth Client ID",
  "extension.gmail.options.redirect": "Redirect URI (ieliec Google Cloud OAuth klientā):",
  "actions.save": "Saglabāt",
  "extension.gmail.options.connect": "Savienot Gmail",
  "extension.gmail.options.hint":
    "Ielogojies Routine tajā pašā Chrome profilā. Pielikumi nāk caur Gmail API (līdz 25 MB; lielākiem failiem vajag komandas Google Drive).",
  "extension.gmail.options.saved": "Saglabāts.",
  "extension.gmail.options.invalid_url": "Nederīgs Routine URL.",
  "extension.gmail.options.need_client_id":
    "Vispirms ievadi Gmail OAuth Client ID un saglabā.",
  "extension.gmail.options.connecting": "Atveras Google atļauju logs…",
  "extension.gmail.options.connected": "Gmail savienots.",
  "extension.gmail.options.connect_failed":
    "Neizdevās savienot Gmail. Pārbaudi Client ID un redirect URI.",
  "extension.gmail.options.missing_client_id": "Trūkst Client ID.",
};

let strings = { ...FALLBACK };

function t(key) {
  return strings[key] || FALLBACK[key] || key;
}

function applyLabels() {
  document.documentElement.lang =
    strings === FALLBACK ? "lv" : document.documentElement.lang;
  const appLabel = document.querySelector('label[for="appBaseUrl"]');
  const clientLabel = document.querySelector('label[for="gmailClientId"]');
  if (appLabel) appLabel.textContent = t("extension.gmail.options.app_url");
  if (clientLabel) clientLabel.textContent = t("extension.gmail.options.client_id");
  const redirectP = document.getElementById("redirectHint");
  if (redirectP) redirectP.textContent = t("extension.gmail.options.redirect");
  const saveBtn = document.getElementById("save");
  if (saveBtn) saveBtn.textContent = t("actions.save");
  const connectBtn = document.getElementById("connectGmail");
  if (connectBtn) connectBtn.textContent = t("extension.gmail.options.connect");
  const hint = document.getElementById("optionsHint");
  if (hint) hint.textContent = t("extension.gmail.options.hint");
}

const appBaseInput = document.getElementById("appBaseUrl");
const clientIdInput = document.getElementById("gmailClientId");
const redirectUriEl = document.getElementById("redirectUri");
const status = document.getElementById("status");
const save = document.getElementById("save");
const connectGmail = document.getElementById("connectGmail");

chrome.storage.sync.get(["appBaseUrl", "gmailClientId"], (stored) => {
  appBaseInput.value = stored.appBaseUrl || DEFAULT_APP_BASE;
  clientIdInput.value = stored.gmailClientId || "";
});

chrome.runtime.sendMessage({ type: "routine.getRedirectUri" }, (response) => {
  redirectUriEl.textContent =
    response?.redirectUri || chrome.identity.getRedirectURL("oauth2");
});

chrome.runtime.sendMessage({ type: "routine.getSession" }, (response) => {
  const data = response?.data;
  if (data?.strings && typeof data.strings === "object") {
    strings = { ...FALLBACK, ...data.strings };
    if (data.languageCode) document.documentElement.lang = data.languageCode;
    applyLabels();
  }
});

function setStatus(text, ok) {
  status.className = ok ? "ok" : "err";
  status.textContent = text;
}

save.addEventListener("click", async () => {
  let origin = appBaseInput.value.trim() || DEFAULT_APP_BASE;
  try {
    origin = new URL(origin).origin;
  } catch {
    setStatus(t("extension.gmail.options.invalid_url"), false);
    return;
  }
  appBaseInput.value = origin;
  const gmailClientId = clientIdInput.value.trim();
  await chrome.storage.sync.set({ appBaseUrl: origin, gmailClientId });
  try {
    await chrome.permissions.request({ origins: [`${origin}/*`] });
  } catch {
    // optional
  }
  setStatus(t("extension.gmail.options.saved"), true);
});

connectGmail.addEventListener("click", async () => {
  const gmailClientId = clientIdInput.value.trim();
  if (!gmailClientId) {
    setStatus(t("extension.gmail.options.need_client_id"), false);
    return;
  }
  await chrome.storage.sync.set({ gmailClientId });
  setStatus(t("extension.gmail.options.connecting"), true);
  chrome.runtime.sendMessage({ type: "routine.connectGmail" }, (response) => {
    if (response?.ok) {
      setStatus(t("extension.gmail.options.connected"), true);
      return;
    }
    setStatus(
      response?.error === "errors.extension_gmail_client_id"
        ? t("extension.gmail.options.missing_client_id")
        : t("extension.gmail.options.connect_failed"),
      false,
    );
  });
});

applyLabels();
