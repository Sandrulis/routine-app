(() => {
  const marker = document.querySelector("[data-routine-gmail-plugin]");
  const state = marker?.getAttribute("data-routine-gmail-plugin") || "";
  if (state !== "logged-in" && state !== "connected") return;
  if (!chrome?.runtime?.id) return;

  const bootstrapTicket =
    marker?.getAttribute("data-routine-bootstrap-ticket")?.trim() || "";

  async function loadSessionFromBootstrap() {
    try {
      const response = await fetch("/api/extension/bootstrap-session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = await response.json().catch(() => null);
      if (data?.ok && data?.session?.access_token) return data.session;
    } catch {
      // Background exchanges the ticket; cookies may still import the session.
    }
    return null;
  }

  async function notify(attempt) {
    const session = await loadSessionFromBootstrap();
    chrome.runtime.sendMessage(
      {
        type: "routine.pluginAuthDone",
        url: location.href,
        cookieHeader: document.cookie,
        state,
        bootstrapTicket: bootstrapTicket || undefined,
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
