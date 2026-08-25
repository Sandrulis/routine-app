(() => {
  const marker = document.querySelector("[data-routine-gmail-plugin]");
  const state = marker?.getAttribute("data-routine-gmail-plugin") || "";
  if (state !== "logged-in" && state !== "connected") return;
  if (!chrome?.runtime?.id) return;

  const bootstrapTicket =
    marker?.getAttribute("data-routine-bootstrap-ticket")?.trim() || "";

  async function loadSessionFromTicket() {
    if (!bootstrapTicket) return null;
    try {
      const response = await fetch("/api/extension/bootstrap-from-ticket", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: bootstrapTicket }),
      });
      if (!response.ok) return null;
      const data = await response.json().catch(() => null);
      if (data?.ok && data?.session?.access_token) return data.session;
    } catch {
      // Background may exchange the same ticket via host_permissions.
    }
    return null;
  }

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
      // Background may still import from chrome.cookies / document.cookie.
    }
    return null;
  }

  async function loadSession() {
    return (await loadSessionFromTicket()) || (await loadSessionFromBootstrap());
  }

  async function notify(attempt) {
    const session = await loadSession();
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
