const DEFAULT_APP_BASE = "http://localhost:3120";

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

function setStatus(text, ok) {
  status.className = ok ? "ok" : "err";
  status.textContent = text;
}

save.addEventListener("click", async () => {
  let origin = appBaseInput.value.trim() || DEFAULT_APP_BASE;
  try {
    origin = new URL(origin).origin;
  } catch {
    setStatus("Nederīgs Routine URL.", false);
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
  setStatus("Saglabāts.", true);
});

connectGmail.addEventListener("click", async () => {
  const gmailClientId = clientIdInput.value.trim();
  if (!gmailClientId) {
    setStatus("Vispirms ievadi Gmail OAuth Client ID un saglabā.", false);
    return;
  }
  await chrome.storage.sync.set({ gmailClientId });
  setStatus("Atveras Google atļauju logs…", true);
  chrome.runtime.sendMessage({ type: "routine.connectGmail" }, (response) => {
    if (response?.ok) {
      setStatus("Gmail savienots.", true);
      return;
    }
    setStatus(
      response?.error === "errors.extension_gmail_client_id"
        ? "Trūkst Client ID."
        : "Neizdevās savienot Gmail. Pārbaudi Client ID un redirect URI.",
      false,
    );
  });
});
