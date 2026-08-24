(() => {
  const marker = document.querySelector("[data-routine-gmail-plugin]");
  const state = marker?.getAttribute("data-routine-gmail-plugin") || "";
  if (state !== "logged-in" && state !== "connected") return;
  if (!chrome?.runtime?.id) return;

  async function loadSession() {
    try {
      const response = await fetch("/api/extension/bootstrap-session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = await response.json().catch(() => null);
      if (data?.ok && data?.session?.access_token) return data.session;
    } catch {
      // Background may still import from chrome.cookies / document.cookie.
    }
    return null;
  }

  async function notify(attempt) {
    const session = await loadSession();
    chrome.runtime.sendMessage(
      {
        type: "routine.pluginAuthDone",
        url: location.href,
        cookieHeader: document.cookie,
        state,
        session: session || undefined,
      },
      (response) => {
        void chrome.runtime.lastError;
        if (response?.ok) return;
        if (attempt >= 8) return;
        window.setTimeout(() => void notify(attempt + 1), 400);
      },
    );
  }

  void notify(0);
})();
