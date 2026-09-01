(() => {
  if (!chrome?.runtime?.id) return;

  const PENDING_BOOTSTRAP_KEY = "pendingBootstrapTicket";
  const READY_ATTR = "data-routine-plugin-ready";
  const CLOSE_ATTR = "data-routine-plugin-close";

  function markReady() {
    document.documentElement.setAttribute(READY_ATTR, "1");
    window.postMessage(
      { source: "routine-gmail-plugin", type: "ready" },
      location.origin,
    );
    window.dispatchEvent(new Event("routine-gmail-plugin-ready"));
  }

  function requestTabClose() {
    chrome.runtime.sendMessage({ type: "routine.closePluginDoneTab" }, () => {
      void chrome.runtime.lastError;
    });
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    if (event.data?.source !== "routine-gmail-plugin") return;
    if (event.data?.type === "close") requestTabClose();
  });

  const closeObserver = new MutationObserver(() => {
    if (document.documentElement.getAttribute(CLOSE_ATTR) === "1") {
      requestTabClose();
    }
  });
  closeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [CLOSE_ATTR],
  });

  if (window.__routineGmailPluginAuthStarted) {
    const marker = document.querySelector("[data-routine-gmail-plugin]");
    const state = marker?.getAttribute("data-routine-gmail-plugin") || "";
    const ticket = marker?.getAttribute("data-routine-bootstrap-ticket")?.trim();
    if ((state === "logged-in" || state === "connected") && ticket) {
      markReady();
    }
    return;
  }
  window.__routineGmailPluginAuthStarted = true;

  async function stashTicketLocally(ticket) {
    const value = String(ticket || "").trim();
    if (!value) return false;
    try {
      await chrome.storage.local.set({
        [PENDING_BOOTSTRAP_KEY]: {
          origin: location.origin,
          ticket: value,
          at: Date.now(),
        },
      });
      return true;
    } catch {
      return false;
    }
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
    if (bootstrapTicket) markReady();

    if (window.__routineGmailPluginAuthSent) return;
    window.__routineGmailPluginAuthSent = true;

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

    void (async () => {
      if (bootstrapTicket) await stashTicketLocally(bootstrapTicket);
      sendAuth({}, 0);
    })();
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
