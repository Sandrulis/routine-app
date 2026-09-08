const APP_HOST_ORIGINS = [
  "https://www.tasqin.com/*",
  "https://tasqin.com/*",
];
const GMAIL_HOST_ORIGINS = ["https://mail.google.com/*"];

/**
 * Must run in a user-gesture (popup/content click). Do not await
 * permissions.contains() first — that async gap drops the gesture and Chrome
 * returns false without a prompt.
 *
 * Never batch localhost with live origins: if any origin in the request cannot
 * be granted, Chrome grants none (Chrome Web Store installs often withhold
 * http://localhost).
 */
async function ensurePluginHostAccess(options = {}) {
  if (!chrome?.permissions?.request) return true;
  const origins = options.includeGmail
    ? [...APP_HOST_ORIGINS, ...GMAIL_HOST_ORIGINS]
    : APP_HOST_ORIGINS;
  try {
    return await chrome.permissions.request({ origins });
  } catch {
    return false;
  }
}
