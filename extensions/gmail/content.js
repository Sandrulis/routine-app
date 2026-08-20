const ERROR_LV = {
  "errors.auth_required": "Ielogojies Routine (tajā pašā pārlūkā) un mēģini vēlreiz.",
  "errors.extension_not_subtask": "Izvēlētais ieraksts nav apakšuzdevums.",
  "errors.extension_subtask_unavailable": "Apakšuzdevums nav pieejams.",
  "errors.extension_file_type": "Daži pielikumi nav atļauti (tips).",
  "errors.extension_file_empty": "Tukšs fails.",
  "errors.extension_file_too_large": "Fails pārsniedz 25 MB limitu.",
  "errors.extension_file_needs_drive":
    "Liels fails: ieslēdz komandas Google Drive integrāciju.",
  "errors.extension_upload_failed": "Neizdevās pievienot failu.",
  "errors.extension_nothing_attached": "Nekas netika pievienots.",
  "errors.extension_search_failed": "Meklēšana neizdevās.",
  "errors.extension_uploads_disabled": "Failu augšupielāde Routine ir izslēgta.",
  "errors.extension_invalid_body": "Nederīgs pieprasījums.",
  "errors.extension_task_required": "Izvēlies apakšuzdevumu.",
  "errors.extension_gmail_client_id":
    "Iestati Gmail OAuth Client ID paplašinājuma opcijās.",
  "errors.extension_gmail_auth":
    "Atļauj Gmail piekļuvi: opcijās → Savienot Gmail.",
  "errors.extension_gmail_fetch_failed": "Neizdevās ielādēt e-pastu no Gmail API.",
  "errors.extension_gmail_forbidden":
    "Gmail API liegts: ieslēdz Gmail API Google Cloud projektā un atkārtoti Savienot Gmail (scope gmail.readonly).",
  "errors.extension_gmail_not_found":
    "Gmail neatradā ziņu — atver e-pastu pilnā skatā un mēģini vēlreiz.",
  "errors.extension_gmail_message_id": "Neatrada Gmail ziņas ID — atver e-pastu pilnā skatā.",
};

function tError(key) {
  if (!key) return "Nezināma kļūda.";
  return ERROR_LV[key] || key;
}

function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload });
}

function textOf(el) {
  return (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();
}

function firstMatch(root, selectors) {
  for (const selector of selectors) {
    const el = root.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function findOpenMessageRoot() {
  const candidates = [
    ...document.querySelectorAll('div[role="main"] div[data-message-id]'),
    ...document.querySelectorAll("div.adn, div.a3s"),
  ];
  for (const el of candidates) {
    if (el.closest('[aria-hidden="true"]')) continue;
    if (el.getClientRects().length > 0) return el.closest("div.adn") || el;
  }
  return document.querySelector('div[role="main"]');
}

function getGmailIds() {
  const root = findOpenMessageRoot() || document;

  // Prefer legacy IDs — these match Gmail API message/thread ids.
  const messageId =
    firstMatch(root, ["[data-legacy-message-id]"])
      ?.getAttribute("data-legacy-message-id")
      ?.trim() ||
    [...document.querySelectorAll("[data-legacy-message-id]")]
      .map((el) => el.getAttribute("data-legacy-message-id")?.trim())
      .find(Boolean) ||
    "";

  let threadId =
    firstMatch(root, ["[data-legacy-thread-id]"])
      ?.getAttribute("data-legacy-thread-id")
      ?.trim() ||
    firstMatch(document, ["h2[data-legacy-thread-id], [data-legacy-thread-id]"])
      ?.getAttribute("data-legacy-thread-id")
      ?.trim() ||
    "";

  // URL hash is usually a thread id in modern Gmail (FMfcgz…).
  if (!threadId) {
    const hash = location.hash || "";
    const hashMatch = hash.match(/\/([a-zA-Z0-9_-]{10,})(?:\?|$)/);
    if (hashMatch?.[1]) threadId = hashMatch[1];
  }

  return { messageId, threadId };
}

function scrapeEmailFallback() {
  const root = findOpenMessageRoot() || document;
  const subjectEl = firstMatch(document, [
    "h2[data-thread-perm-id]",
    "h2.hP",
    ".ha h2",
  ]);
  const fromEl = firstMatch(root, ["span.gD", "span[email]"]);
  const toEl = firstMatch(root, [".g2 span[email]", ".hb span[email]"]);
  const dateEl = firstMatch(root, ["span.g3", "span[title].g3"]);
  const bodyEl = firstMatch(root, [
    "div.a3s.aiL",
    "div.a3s",
    "div[data-message-id] div.a3s",
  ]);

  const fromEmail = fromEl?.getAttribute("email") || textOf(fromEl);
  const fromName = fromEl?.getAttribute("name") || "";
  const from = fromName && fromEmail ? `${fromName} <${fromEmail}>` : fromEmail;

  return {
    subject: textOf(subjectEl),
    from,
    to: toEl?.getAttribute("email") || textOf(toEl),
    date: dateEl?.getAttribute("title") || textOf(dateEl),
    body: (bodyEl?.innerText || "").trim(),
    permalink: location.href,
  };
}

function ensureUi() {
  if (document.getElementById("routine-gmail-root")) return;

  const root = document.createElement("div");
  root.id = "routine-gmail-root";
  root.innerHTML = `
    <button type="button" id="routine-gmail-fab" aria-label="Routine" title="Pievienot Routine">
      <img id="routine-gmail-fab-img" alt="" />
      <span id="routine-gmail-fab-fallback">R</span>
    </button>
    <div id="routine-gmail-modal" hidden>
      <div class="routine-gmail-backdrop" data-close="1"></div>
      <div class="routine-gmail-panel" role="dialog" aria-modal="true">
        <header>
          <strong id="routine-gmail-title">Pievienot apakšuzdevumam</strong>
          <button type="button" class="routine-gmail-x" data-close="1" aria-label="Aizvērt">×</button>
        </header>
        <p id="routine-gmail-meta" class="routine-gmail-meta"></p>
        <p id="routine-gmail-status" class="routine-gmail-status"></p>
        <label class="routine-gmail-label" for="routine-gmail-search">Meklēt apakšuzdevumu</label>
        <input id="routine-gmail-search" type="search" placeholder="Nosaukums…" autocomplete="off" />
        <ul id="routine-gmail-results"></ul>
        <footer>
          <button type="button" id="routine-gmail-attach" disabled>Pievienot</button>
        </footer>
      </div>
    </div>
  `;
  document.documentElement.appendChild(root);

  const fab = root.querySelector("#routine-gmail-fab");
  const modal = root.querySelector("#routine-gmail-modal");
  const search = root.querySelector("#routine-gmail-search");
  const results = root.querySelector("#routine-gmail-results");
  const attachBtn = root.querySelector("#routine-gmail-attach");
  const status = root.querySelector("#routine-gmail-status");
  const meta = root.querySelector("#routine-gmail-meta");

  let selectedId = null;
  let searchTimer = null;
  let session = null;

  function setStatus(text, isError = false) {
    status.textContent = text || "";
    status.classList.toggle("is-error", Boolean(isError && text));
  }

  function closeModal() {
    modal.hidden = true;
    selectedId = null;
    attachBtn.disabled = true;
    results.innerHTML = "";
    search.value = "";
    setStatus("");
  }

  async function refreshSession() {
    const result = await send("routine.getSession");
    session = result?.data || null;
    const img = root.querySelector("#routine-gmail-fab-img");
    const fallback = root.querySelector("#routine-gmail-fab-fallback");
    const logoUrl = session?.logoUrl;
    if (logoUrl) {
      img.src = logoUrl;
      img.hidden = false;
      fallback.hidden = true;
    } else {
      img.hidden = true;
      fallback.hidden = false;
    }
    return result;
  }

  function renderResults(subtasks) {
    results.innerHTML = "";
    selectedId = null;
    attachBtn.disabled = true;
    if (!subtasks?.length) {
      results.innerHTML = `<li class="routine-gmail-empty">Nav rezultātu</li>`;
      return;
    }
    for (const item of subtasks) {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.dataset.id = item.id;
      const path = [item.teamName, item.listName, item.parentTitle]
        .filter(Boolean)
        .join(" / ");
      li.innerHTML = `<span class="title"></span><span class="path"></span>`;
      li.querySelector(".title").textContent = item.title;
      li.querySelector(".path").textContent = path;
      li.addEventListener("click", () => {
        selectedId = item.id;
        for (const row of results.querySelectorAll("li")) {
          row.classList.toggle("is-selected", row === li);
        }
        attachBtn.disabled = false;
      });
      results.appendChild(li);
    }
  }

  async function runSearch(query) {
    setStatus("Meklē…");
    const result = await send("routine.searchSubtasks", { query });
    if (!result?.ok || !result.data?.ok) {
      setStatus(tError(result?.data?.error || result?.error), true);
      renderResults([]);
      return;
    }
    setStatus("");
    renderResults(result.data.subtasks || []);
  }

  fab.addEventListener("click", async () => {
    modal.hidden = false;
    const email = scrapeEmailFallback();
    meta.textContent = email.subject
      ? `E-pasts: ${email.subject}`
      : "Atver e-pastu Gmailā, tad pievieno.";
    setStatus("Pārbauda sesiju…");
    const sessionResult = await refreshSession();
    if (!sessionResult?.data?.authenticated) {
      const appBase = sessionResult?.appBase || "http://localhost:3120";
      setStatus(tError("errors.auth_required"), true);
      results.innerHTML = `<li class="routine-gmail-empty"><a href="${appBase}/login" target="_blank" rel="noreferrer">Atvērt Routine login</a></li>`;
      return;
    }
    if (sessionResult.data.fileUploadEnabled === false) {
      setStatus(tError("errors.extension_uploads_disabled"), true);
      return;
    }
    setStatus("");
    await runSearch("");
    search.focus();
  });

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (target?.dataset?.close) closeModal();
  });

  search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(search.value), 250);
  });

  attachBtn.addEventListener("click", async () => {
    if (!selectedId) return;
    const { messageId, threadId } = getGmailIds();
    if (!messageId && !threadId) {
      setStatus(tError("errors.extension_gmail_message_id"), true);
      return;
    }

    attachBtn.disabled = true;
    setStatus("Ielādē e-pastu un pielikumus no Gmail API…");
    const email = scrapeEmailFallback();
    const result = await send("routine.attachEmail", {
      taskId: selectedId,
      gmailMessageId: messageId,
      gmailThreadId: threadId,
      email,
    });
    if (!result?.ok || !result.data?.ok) {
      setStatus(tError(result?.data?.error || result?.error), true);
      attachBtn.disabled = false;
      return;
    }
    const attachedCount = result.data.attached?.length || 0;
    const skippedCount = result.data.skipped?.length || 0;
    let msg = `Pievienots: ${attachedCount}`;
    if (skippedCount) msg += ` (izlaisti: ${skippedCount})`;
    setStatus(msg, false);
    setTimeout(closeModal, 1200);
  });

  refreshSession().catch(() => undefined);
}

ensureUi();
const observer = new MutationObserver(() => {
  if (!document.getElementById("routine-gmail-root")) ensureUi();
});
observer.observe(document.documentElement, { childList: true, subtree: true });
