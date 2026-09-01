const PLUGIN_HOST_ORIGINS = [
  "https://www.tasqin.com/*",
  "https://tasqin.com/*",
  "http://localhost:3120/*",
  "http://127.0.0.1:3120/*",
  "https://mail.google.com/*",
];

/** Must run in a user-gesture (popup/content click). SW request makes Chrome badge the icon. */
async function ensurePluginHostAccess() {
  if (!chrome?.permissions?.contains || !chrome?.permissions?.request) {
    return true;
  }
  try {
    const already = await chrome.permissions.contains({
      origins: PLUGIN_HOST_ORIGINS,
    });
    if (already) return true;
    return await chrome.permissions.request({ origins: PLUGIN_HOST_ORIGINS });
  } catch {
    return false;
  }
}
