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
  "errors.extension_list_required": "Izvēlies sarakstu.",
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
        <div id="routine-gmail-feedback" class="routine-gmail-feedback" hidden role="status" aria-live="polite"></div>
        <div id="routine-gmail-crumbs" class="routine-gmail-crumbs" hidden></div>
        <p id="routine-gmail-step" class="routine-gmail-label">1. Izvēlies sarakstu</p>
        <ul id="routine-gmail-results"></ul>
        <footer>
          <button type="button" id="routine-gmail-back" class="routine-gmail-back" hidden>Atpakaļ</button>
          <button type="button" id="routine-gmail-attach" disabled>
            <span class="routine-gmail-btn-label">Pievienot</span>
          </button>
        </footer>
        <div id="routine-gmail-busy" class="routine-gmail-busy" hidden>
          <div class="routine-gmail-spinner" aria-hidden="true"></div>
          <p id="routine-gmail-busy-text" class="routine-gmail-busy-text">Apstrādā…</p>
        </div>
      </div>
    </div>
  `;
  document.documentElement.appendChild(root);

  const fab = root.querySelector("#routine-gmail-fab");
  const modal = root.querySelector("#routine-gmail-modal");
  const results = root.querySelector("#routine-gmail-results");
  const attachBtn = root.querySelector("#routine-gmail-attach");
  const attachLabel = root.querySelector(".routine-gmail-btn-label");
  const backBtn = root.querySelector("#routine-gmail-back");
  const feedback = root.querySelector("#routine-gmail-feedback");
  const meta = root.querySelector("#routine-gmail-meta");
  const crumbsEl = root.querySelector("#routine-gmail-crumbs");
  const stepEl = root.querySelector("#routine-gmail-step");
  const busyEl = root.querySelector("#routine-gmail-busy");
  const busyText = root.querySelector("#routine-gmail-busy-text");
  const closeBtn = root.querySelector(".routine-gmail-x");

  /** @type {{ type: 'lists' } | { type: 'items', listId: string, listName: string, parentId: string | null, trail: {id:string,title:string,kind:string}[] } | { type: 'subtasks', listId: string, listName: string, parentId: string, parentTitle: string, trail: {id:string,title:string,kind:string}[] }} */
  let view = { type: "lists" };
  let selectedId = null;
  let session = null;
  let isBusy = false;
  let closeTimer = null;

  function clearCloseTimer() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function setFeedback(text, variant) {
    if (!text) {
      feedback.hidden = true;
      feedback.textContent = "";
      feedback.className = "routine-gmail-feedback";
      return;
    }
    feedback.hidden = false;
    feedback.textContent = text;
    feedback.className = `routine-gmail-feedback is-${variant || "info"}`;
  }

  function setBusy(busy, text) {
    isBusy = busy;
    busyEl.hidden = !busy;
    busyText.textContent = text || "Apstrādā…";
    closeBtn.disabled = busy;
    backBtn.disabled = busy;
    attachBtn.disabled = busy || !selectedId;
    attachLabel.textContent = busy ? "Gaida…" : "Pievienot";
    modal.classList.toggle("is-busy", busy);
    for (const row of results.querySelectorAll("li")) {
      row.classList.toggle("is-disabled", busy);
    }
  }

  function resetPicker() {
    view = { type: "lists" };
    selectedId = null;
    attachBtn.disabled = true;
    results.innerHTML = "";
    crumbsEl.hidden = true;
    crumbsEl.innerHTML = "";
    backBtn.hidden = true;
    stepEl.textContent = "1. Izvēlies sarakstu";
  }

  function closeModal() {
    if (isBusy) return;
    clearCloseTimer();
    modal.hidden = true;
    setFeedback("");
    setBusy(false);
    resetPicker();
  }

  function renderCrumbs() {
    if (view.type === "lists") {
      crumbsEl.hidden = true;
      crumbsEl.innerHTML = "";
      backBtn.hidden = true;
      return;
    }
    crumbsEl.hidden = false;
    backBtn.hidden = false;
    // trail already includes folders and the selected task (on subtasks step)
    const parts = [view.listName, ...view.trail.map((item) => item.title)];
    crumbsEl.textContent = parts.filter(Boolean).join(" / ");
  }

  function setStepLabel() {
    if (view.type === "lists") stepEl.textContent = "1. Izvēlies sarakstu";
    else if (view.type === "items") {
      stepEl.textContent = view.trail.some((item) => item.kind === "folder")
        ? "2. Izvēlies mapi vai uzdevumu mapē"
        : "2. Izvēlies mapi vai uzdevumu";
    } else stepEl.textContent = "3. Izvēlies apakšuzdevumu";
  }

  function emptyRow(text) {
    results.innerHTML = `<li class="routine-gmail-empty">${text}</li>`;
  }

  function kindPrefix(kind) {
    if (kind === "folder") return "[mape] ";
    if (kind === "task") return "[uzdevums] ";
    if (kind === "subtask") return "";
    if (kind === "list") return "";
    return "";
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

  function renderSelectable(rows, onPick) {
    results.innerHTML = "";
    selectedId = null;
    attachBtn.disabled = true;
    if (!rows.length) {
      emptyRow("Šeit nav ierakstu");
      return;
    }
    for (const row of rows) {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.innerHTML = `<span class="title"></span><span class="path"></span>`;
      li.querySelector(".title").textContent = `${kindPrefix(row.kind)}${row.title}`;
      li.querySelector(".path").textContent = row.hint || "";
      li.addEventListener("click", () => {
        if (isBusy) return;
        onPick(row, li);
      });
      results.appendChild(li);
    }
  }

  async function loadLists() {
    view = { type: "lists" };
    selectedId = null;
    attachBtn.disabled = true;
    renderCrumbs();
    setStepLabel();
    setFeedback("Ielādē sarakstus…", "info");
    const result = await send("routine.browse", { step: "lists" });
    if (!result?.ok || !result.data?.ok) {
      setFeedback(tError(result?.data?.error || result?.error), "error");
      emptyRow("Neizdevās ielādēt sarakstus");
      return;
    }
    setFeedback("");
    const lists = result.data.lists || [];
    renderSelectable(
      lists.map((item) => ({
        id: item.id,
        title: item.name,
        kind: "list",
        hint: item.teamName || "",
        raw: item,
      })),
      async (row) => {
        view = {
          type: "items",
          listId: row.id,
          listName: row.title,
          parentId: null,
          trail: [],
        };
        await loadItems();
      },
    );
  }

  async function loadItems() {
    if (view.type !== "items") return;
    selectedId = null;
    attachBtn.disabled = true;
    renderCrumbs();
    setStepLabel();
    setFeedback("Ielādē…", "info");
    const result = await send("routine.browse", {
      step: "items",
      listId: view.listId,
      parentId: view.parentId || "",
    });
    if (!result?.ok || !result.data?.ok) {
      setFeedback(tError(result?.data?.error || result?.error), "error");
      emptyRow("Neizdevās ielādēt");
      return;
    }
    setFeedback("");
    const items = result.data.items || [];
    if (!items.length) {
      emptyRow(
        view.parentId
          ? "Šajā mapē nav uzdevumu"
          : "Sarakstā nav mapju vai uzdevumu",
      );
      return;
    }
    renderSelectable(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind,
        hint:
          item.kind === "folder"
            ? item.hasChildren
              ? "Mape — atvērt"
              : "Tukša mape"
            : item.hasSubtasks
              ? "Uzdevums — izvēlēties apakšuzdevumu"
              : "Uzdevums bez apakšuzdevumiem",
        raw: item,
      })),
      async (row) => {
        const item = row.raw;
        if (item.kind === "folder") {
          view = {
            type: "items",
            listId: view.listId,
            listName: view.listName,
            parentId: item.id,
            trail: [...view.trail, { id: item.id, title: item.title, kind: "folder" }],
          };
          await loadItems();
          return;
        }
        // task → subtasks step
        view = {
          type: "subtasks",
          listId: view.listId,
          listName: view.listName,
          parentId: item.id,
          parentTitle: item.title,
          trail: [...view.trail, { id: item.id, title: item.title, kind: "task" }],
        };
        await loadSubtasks();
      },
    );
  }

  async function loadSubtasks() {
    if (view.type !== "subtasks") return;
    selectedId = null;
    attachBtn.disabled = true;
    renderCrumbs();
    setStepLabel();
    setFeedback("Ielādē apakšuzdevumus…", "info");
    const result = await send("routine.browse", {
      step: "subtasks",
      parentId: view.parentId,
    });
    if (!result?.ok || !result.data?.ok) {
      setFeedback(tError(result?.data?.error || result?.error), "error");
      emptyRow("Neizdevās ielādēt apakšuzdevumus");
      return;
    }
    setFeedback("");
    const subtasks = result.data.subtasks || [];
    if (!subtasks.length) {
      emptyRow("Šim uzdevumam nav apakšuzdevumu");
      return;
    }
    renderSelectable(
      subtasks.map((item) => ({
        id: item.id,
        title: item.title,
        kind: "subtask",
        hint: "Apakšuzdevums",
        raw: item,
      })),
      (row, li) => {
        selectedId = row.id;
        for (const node of results.querySelectorAll("li")) {
          node.classList.toggle("is-selected", node === li);
        }
        attachBtn.disabled = false;
      },
    );
  }

  async function goBack() {
    if (isBusy) return;
    if (view.type === "subtasks") {
      const trail = view.trail.slice(0, -1);
      const parent = trail[trail.length - 1] || null;
      view = {
        type: "items",
        listId: view.listId,
        listName: view.listName,
        parentId: parent && parent.kind === "folder" ? parent.id : null,
        trail: parent && parent.kind === "folder" ? trail : trail.filter((t) => t.kind === "folder"),
      };
      // If we came from a task inside a folder, trail after removing task should be folders only
      const folders = view.trail.filter((t) => t.kind === "folder");
      view.trail = folders;
      view.parentId = folders.length ? folders[folders.length - 1].id : null;
      await loadItems();
      return;
    }
    if (view.type === "items") {
      if (view.trail.length > 0) {
        const trail = view.trail.slice(0, -1);
        view = {
          type: "items",
          listId: view.listId,
          listName: view.listName,
          parentId: trail.length ? trail[trail.length - 1].id : null,
          trail,
        };
        await loadItems();
        return;
      }
      await loadLists();
    }
  }

  fab.addEventListener("click", async () => {
    clearCloseTimer();
    modal.hidden = false;
    setBusy(false);
    setFeedback("");
    resetPicker();
    const email = scrapeEmailFallback();
    meta.textContent = email.subject
      ? `E-pasts: ${email.subject}`
      : "Atver e-pastu Gmailā, tad pievieno.";
    setBusy(true, "Pārbauda Routine sesiju…");
    const sessionResult = await refreshSession();
    setBusy(false);
    if (!sessionResult?.data?.authenticated) {
      const appBase = sessionResult?.appBase || "http://localhost:3120";
      setFeedback(tError("errors.auth_required"), "error");
      results.innerHTML = `<li class="routine-gmail-empty"><a href="${appBase}/login" target="_blank" rel="noreferrer">Atvērt Routine login</a></li>`;
      return;
    }
    if (sessionResult.data.fileUploadEnabled === false) {
      setFeedback(tError("errors.extension_uploads_disabled"), "error");
      return;
    }
    await loadLists();
  });

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (target?.dataset?.close) {
      if (isBusy) return;
      closeModal();
    }
  });

  backBtn.addEventListener("click", () => {
    void goBack();
  });

  attachBtn.addEventListener("click", async () => {
    if (!selectedId || isBusy) return;
    const { messageId, threadId } = getGmailIds();
    if (!messageId && !threadId) {
      setFeedback(tError("errors.extension_gmail_message_id"), "error");
      return;
    }

    clearCloseTimer();
    setFeedback("");
    setBusy(true, "Ielādē e-pastu un pielikumus no Gmail…");
    const email = scrapeEmailFallback();

    let result;
    try {
      result = await send("routine.attachEmail", {
        taskId: selectedId,
        gmailMessageId: messageId,
        gmailThreadId: threadId,
        email,
      });
    } catch (error) {
      setBusy(false);
      setFeedback(
        error instanceof Error ? error.message : "Neizdevās pievienot.",
        "error",
      );
      return;
    }

    setBusy(false);

    if (!result?.ok || !result.data?.ok) {
      setFeedback(tError(result?.data?.error || result?.error), "error");
      attachBtn.disabled = !selectedId;
      return;
    }

    const attached = result.data.attached || [];
    const skipped = result.data.skipped || [];
    const attachedCount = attached.length;
    const skippedCount = skipped.length;

    let msg =
      attachedCount === 1 && attached[0]?.name
        ? `Veiksmīgi! Pievienots «${attached[0].name}».`
        : `Veiksmīgi! Pievienoti ${attachedCount} faili.`;
    if (skippedCount > 0) {
      const names = skipped
        .map((item) => item.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");
      msg += ` Izlaisti ${skippedCount}${names ? `: ${names}` : ""}.`;
    }

    setFeedback(msg, skippedCount > 0 && attachedCount > 0 ? "info" : "success");
    closeTimer = setTimeout(() => {
      closeModal();
    }, skippedCount > 0 ? 4500 : 2800);
  });

  refreshSession().catch(() => undefined);
}

ensureUi();
const observer = new MutationObserver(() => {
  if (!document.getElementById("routine-gmail-root")) ensureUi();
});
observer.observe(document.documentElement, { childList: true, subtree: true });
