(() => {
  if (!chrome?.runtime?.id) return;

  function markReady() {
    window.dispatchEvent(new Event("routine-gmail-plugin-ready"));
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

  function begin(marker) {
    const state = marker.getAttribute("data-routine-gmail-plugin") || "";
    if (state !== "logged-in" && state !== "connected") return;

    const bootstrapTicket =
      marker.getAttribute("data-routine-bootstrap-ticket")?.trim() || "";

    function sendAuth(payload, attempt) {
      chrome.runtime.sendMessage(
        {
          type: "routine.pluginAuthDone",
          url: location.href,
          cookieHeader: document.cookie,
          state,
          bootstrapTicket: bootstrapTicket || undefined,
          ...payload,
        },
        (response) => {
          void chrome.runtime.lastError;
          if (response?.ok) {
            markReady();
            return;
          }
          if (attempt >= 12) {
            if (payload.session) return;
            void (async () => {
              const session = await loadSessionFromBootstrap();
              if (!session?.access_token) return;
              sendAuth({ session }, 0);
            })();
            return;
          }
          window.setTimeout(() => sendAuth(payload, attempt + 1), 300);
        },
      );
    }

    // Background is the single ticket consumer (avoids refresh_token rotation races).
    sendAuth({}, 0);
  }

  function waitForMarker(attempt) {
    const marker = document.querySelector("[data-routine-gmail-plugin]");
    if (marker) {
      begin(marker);
      return;
    }
    if (attempt >= 40) return;
    window.setTimeout(() => waitForMarker(attempt + 1), 100);
  }

  waitForMarker(0);
})();
