(() => {
  const marker = document.querySelector("[data-routine-gmail-plugin]");
  const state = marker?.getAttribute("data-routine-gmail-plugin") || "";
  if (state !== "logged-in" && state !== "connected") return;
  if (!chrome?.runtime?.id) return;

  function notify(attempt) {
    chrome.runtime.sendMessage(
      {
        type: "routine.pluginAuthDone",
        url: location.href,
        cookieHeader: document.cookie,
        state,
      },
      (response) => {
        void chrome.runtime.lastError;
        if (response?.ok) return;
        if (attempt >= 8) return;
        window.setTimeout(() => notify(attempt + 1), 400);
      },
    );
  }

  notify(0);
})();
