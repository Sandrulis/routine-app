(() => {
  if (!chrome?.runtime?.id) return;
  if (window.__routineGmailPluginAuthStarted) return;
  window.__routineGmailPluginAuthStarted = true;

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
    if (window.__routineGmailPluginAuthSent) return;
    window.__routineGmailPluginAuthSent = true;

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
          const runtimeError = chrome.runtime.lastError;
          if (runtimeError) {
            if (attempt >= 40) return;
            window.setTimeout(
              () => sendAuth(payload, attempt + 1),
              Math.min(250 * (attempt + 1), 2000),
            );
            return;
          }
          if (response?.ok) {
            markReady();
            return;
          }
          if (attempt >= 40) {
            if (payload.session) return;
            void (async () => {
              const session = await loadSessionFromBootstrap();
              if (!session?.access_token) return;
              sendAuth({ session }, 0);
            })();
            return;
          }
          window.setTimeout(
            () => sendAuth(payload, attempt + 1),
            Math.min(250 * (attempt + 1), 2000),
          );
        },
      );
    }

    // Background is the ticket consumer; ACK means the plugin stored it.
    sendAuth({}, 0);
  }

  function waitForMarker(attempt) {
    const marker = document.querySelector("[data-routine-gmail-plugin]");
    if (marker) begin(marker);
    if (attempt >= 80) return;
    window.setTimeout(() => waitForMarker(attempt + 1), 100);
  }

  const observer = new MutationObserver(() => {
    const marker = document.querySelector("[data-routine-gmail-plugin]");
    if (marker) begin(marker);
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "data-routine-gmail-plugin",
      "data-routine-bootstrap-ticket",
    ],
  });

  waitForMarker(0);
})();
