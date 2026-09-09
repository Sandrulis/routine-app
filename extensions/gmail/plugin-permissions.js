// Idempotent: a second inject must not redeclare top-level const.
(() => {
  if (typeof globalThis.ensurePluginHostAccess === "function") return;

  const APP_HOST_ORIGINS = [
    "https://www.tasqin.com/*",
    "https://tasqin.com/*",
  ];
  const GMAIL_HOST_ORIGINS = [
    "https://mail.google.com/*",
    "https://gmail.googleapis.com/*",
  ];
  const LOCAL_HOST_ORIGINS = [
    "http://localhost:3120/*",
    "http://127.0.0.1:3120/*",
  ];

  function isUnpackedInstall() {
    try {
      return !chrome.runtime.getManifest().update_url;
    } catch {
      return false;
    }
  }

  /**
   * Must run in a user-gesture (popup/content click). Do not await
   * permissions.contains() first — that async gap drops the gesture and Chrome
   * returns false without a prompt.
   *
   * One request per gesture. Unpacked (local) includes localhost in that same
   * request so Chrome Site access does not have to be toggled by hand.
   * Chrome Web Store builds never batch localhost: if any origin cannot be
   * granted, Chrome grants none.
   */
  globalThis.ensurePluginHostAccess = async function ensurePluginHostAccess(
    options = {},
  ) {
    if (!chrome?.permissions?.request) return true;
    const origins = [...APP_HOST_ORIGINS];
    if (options.includeGmail !== false) {
      origins.push(...GMAIL_HOST_ORIGINS);
    }
    if (isUnpackedInstall()) {
      origins.push(...LOCAL_HOST_ORIGINS);
    }
    try {
      return await chrome.permissions.request({ origins: [...new Set(origins)] });
    } catch {
      return false;
    }
  };
})();
