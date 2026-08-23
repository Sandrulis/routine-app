(() => {
  if (typeof globalThis.__routineGmailCleanup === "function") {
    try {
      globalThis.__routineGmailCleanup();
    } catch {
      // previous content script leftover
    }
  } else {
    document.getElementById("routine-gmail-root")?.remove();
    for (const btn of document.querySelectorAll("[data-routine-gmail-inline]")) {
      btn.remove();
    }
  }

  const FALLBACK_STRINGS = {
  "actions.add": "Pievienot",
  "actions.save": "Saglabāt",
  "actions.close": "Aizvērt",
  "errors.auth_required":
    "Ielogojies Routine (tajā pašā pārlūkā) un mēģini vēlreiz.",
  "errors.extension_auth_required":
    "Ielogojies Routine (tajā pašā pārlūkā) un mēģini vēlreiz.",
  "errors.extension_gmail_not_connected":
    "Vispirms savieno Gmail spraudnī. Savienojums tiks saglabāts arī Routine.",
  "errors.extension_plugin_disabled": "Gmail spraudnis sistēmā ir izslēgts.",
  "errors.extension_team_drive_missing":
    "Šai komandai nav pieslēgts Google Drive. Spraudnis nestrādās.",
  "errors.extension_not_subtask": "Izvēlētais ieraksts nav apakšuzdevums.",
  "errors.extension_subtask_unavailable": "Apakšuzdevums nav pieejams.",
  "errors.file_type_mismatch": "Pielikuma tips nesakrīt ar saturu.",
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
  "errors.extension_gmail_message_id":
    "Neatrada Gmail ziņas ID — atver e-pastu pilnā skatā.",
  "errors.extension_unknown": "Nezināma kļūda.",
  "extension.gmail.title": "Pievienot apakšuzdevumam",
  "extension.gmail.back": "Atpakaļ",
  "extension.gmail.waiting": "Gaida…",
  "extension.gmail.processing": "Apstrādā…",
  "extension.gmail.step_lists": "1. Izvēlies sarakstu",
  "extension.gmail.step_items": "2. Izvēlies mapi vai uzdevumu",
  "extension.gmail.step_items_folder": "2. Izvēlies mapi vai uzdevumu mapē",
  "extension.gmail.step_subtasks": "3. Izvēlies apakšuzdevumu",
  "extension.gmail.attachments": "Pielikumi",
  "extension.gmail.uncheck_all": "Noņemt visus",
  "extension.gmail.check_all": "Atzīmēt visus",
  "extension.gmail.email_always": "E-pasta saturs (.txt) tiek pievienots vienmēr.",
  "extension.gmail.too_large": "{size} — pārāk liels (>25 MB)",
  "extension.gmail.empty": "Šeit nav ierakstu",
  "extension.gmail.load_lists": "Ielādē sarakstus…",
  "extension.gmail.load_lists_failed": "Neizdevās ielādēt sarakstus",
  "extension.gmail.loading": "Ielādē…",
  "extension.gmail.load_failed": "Neizdevās ielādēt",
  "extension.gmail.no_tasks_in_folder": "Šajā mapē nav atvērtu uzdevumu",
  "extension.gmail.no_items": "Sarakstā nav mapju vai atvērtu uzdevumu",
  "extension.gmail.open_folder": "Atvērt mapi",
  "extension.gmail.empty_folder": "Tukša mape",
  "extension.gmail.choose_subtask": "Izvēlēties apakšuzdevumu",
  "extension.gmail.load_subtasks": "Ielādē apakšuzdevumus…",
  "extension.gmail.load_subtasks_failed": "Neizdevās ielādēt apakšuzdevumus",
  "extension.gmail.no_subtasks": "Nav atvērtu apakšuzdevumu",
  "extension.gmail.email_label": "E-pasts: {subject}",
  "extension.gmail.open_email": "Atver e-pastu Gmailā, tad pievieno.",
  "extension.gmail.checking_session": "Pārbauda Routine sesiju…",
  "extension.gmail.open_login": "Atvērt Routine login",
  "extension.gmail.connect_gmail": "Savienot Gmail",
  "extension.gmail.add_to_routine": "Pievienot Routine",
  "extension.gmail.loading_gmail": "Ielādē e-pastu un pielikumus no Gmail…",
  "extension.gmail.progress_email": "Ielādē e-pastu no Gmail…",
  "extension.gmail.progress_download": "Lejupielādē {name} ({current}/{total})",
  "extension.gmail.progress_upload": "Saglabā Routine ({count})…",
  "extension.gmail.attach_failed": "Neizdevās pievienot.",
  "extension.gmail.attached_one": "Veiksmīgi! Pievienots «{name}».",
  "extension.gmail.attached_many": "Veiksmīgi! Pievienoti {count} faili.",
  "extension.gmail.skipped": "Izlaisti {count}.",
  "extension.gmail.skipped_named": "Izlaisti {count}: {names}.",
};

let languageCode = "lv";
let strings = { ...FALLBACK_STRINGS };

function interpolate(value, params) {
  if (!params) return value;
  return String(value).replace(/\{(\w+)\}/g, (_, key) =>
    params[key] == null ? `{${key}}` : String(params[key]),
  );
}

function t(key, params) {
  const raw = strings[key] || FALLBACK_STRINGS[key] || key;
  return interpolate(raw, params);
}

function applySessionI18n(data) {
  const code = data?.languageCode;
  if (code === "en" || code === "lv" || code === "ru") languageCode = code;
  if (data?.strings && typeof data.strings === "object") {
    strings = { ...FALLBACK_STRINGS, ...data.strings };
  }
}

function tError(key) {
  if (!key) return t("errors.extension_unknown");
  if (key === "errors.auth_required") return t("errors.extension_auth_required");
  return t(key);
}

const INLINE_BTN_ATTR = "data-routine-gmail-inline";

const ICONS = {
  list: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M2 3h12v1.5H2V3zm0 4.25h12V8.75H2V7.25zm0 4.25h12V13.5H2v-2z"/></svg>`,
  folder: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.2l1.2 1.5H13A1.5 1.5 0 0 1 14.5 5v7A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V3.5z"/></svg>`,
  task: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M3 2.5h10A1.5 1.5 0 0 1 14.5 4v8A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V4A1.5 1.5 0 0 1 3 2.5zm1.2 3.2 1.6 1.6 3.8-3.8.9.9-4.7 4.7-2.5-2.5.9-.9z"/></svg>`,
  subtask: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="2.4" fill="currentColor"/></svg>`,
};

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

function formatBytes(size) {
  const n = Number(size) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 102.4) / 10} KB`;
  return `${Math.round(n / (1024 * 102.4)) / 10} MB`;
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
  const existing = document.getElementById("routine-gmail-root");
  if (existing?.dataset?.routineUi === "5") {
    existing.querySelector("#routine-gmail-fab")?.remove();
    return;
  }
  existing?.remove();

  const root = document.createElement("div");
  root.id = "routine-gmail-root";
  root.dataset.routineUi = "5";
  root.innerHTML = `
    <div id="routine-gmail-modal" hidden>
      <div class="routine-gmail-backdrop" data-close="1"></div>
      <div class="routine-gmail-panel" role="dialog" aria-modal="true">
        <header>
          <strong id="routine-gmail-title"></strong>
          <button type="button" class="routine-gmail-x" data-close="1" aria-label="">×</button>
        </header>
        <div id="routine-gmail-feedback" class="routine-gmail-feedback" hidden role="status" aria-live="polite"></div>
        <div id="routine-gmail-picker" class="routine-gmail-picker">
          <p id="routine-gmail-meta" class="routine-gmail-meta"></p>
          <div id="routine-gmail-crumbs" class="routine-gmail-crumbs" hidden></div>
          <p id="routine-gmail-step" class="routine-gmail-label"></p>
          <ul id="routine-gmail-results"></ul>
          <section id="routine-gmail-attachments" class="routine-gmail-attachments" hidden>
            <div class="routine-gmail-attachments-head">
              <p class="routine-gmail-label" id="routine-gmail-att-label"></p>
              <button type="button" id="routine-gmail-att-toggle" class="routine-gmail-link-btn"></button>
            </div>
            <ul id="routine-gmail-attach-list"></ul>
            <p class="routine-gmail-hint" id="routine-gmail-att-hint"></p>
          </section>
          <footer>
            <button type="button" id="routine-gmail-back" class="routine-gmail-back" hidden></button>
            <button type="button" id="routine-gmail-attach" disabled>
              <span class="routine-gmail-btn-label"></span>
            </button>
          </footer>
        </div>
        <div id="routine-gmail-busy" class="routine-gmail-busy" hidden>
          <div class="routine-gmail-spinner" aria-hidden="true"></div>
          <p id="routine-gmail-busy-text" class="routine-gmail-busy-text"></p>
          <div id="routine-gmail-progress" class="routine-gmail-progress" hidden>
            <div id="routine-gmail-progress-bar" class="routine-gmail-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
          </div>
          <p id="routine-gmail-progress-count" class="routine-gmail-progress-count" hidden></p>
        </div>
      </div>
    </div>
  `;
  document.documentElement.appendChild(root);

  const modal = root.querySelector("#routine-gmail-modal");
  const panel = root.querySelector(".routine-gmail-panel");
  const picker = root.querySelector("#routine-gmail-picker");
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
  const progressWrap = root.querySelector("#routine-gmail-progress");
  const progressBar = root.querySelector("#routine-gmail-progress-bar");
  const progressCount = root.querySelector("#routine-gmail-progress-count");
  const closeBtn = root.querySelector(".routine-gmail-x");
  const attachmentsSection = root.querySelector("#routine-gmail-attachments");
  const attachList = root.querySelector("#routine-gmail-attach-list");
  const attToggleBtn = root.querySelector("#routine-gmail-att-toggle");

  /** @type {{ type: 'lists' } | { type: 'items', listId: string, listName: string, parentId: string | null, trail: {id:string,title:string,kind:string}[] } | { type: 'subtasks', listId: string, listName: string, parentId: string, parentTitle: string, trail: {id:string,title:string,kind:string}[] }} */
  let view = { type: "lists" };
  let selectedId = null;
  let session = null;
  let isBusy = false;
  let closeTimer = null;
  /** @type {{ attachmentId: string, name: string, mimeType?: string, size: number, tooLarge?: boolean }[]} */
  let attachmentOptions = [];
  let listedGmailMessageId = "";

  function applyStaticLabels() {
    const titleEl = root.querySelector("#routine-gmail-title");
    if (titleEl) titleEl.textContent = t("extension.gmail.title");
    closeBtn.setAttribute("aria-label", t("actions.close"));
    closeBtn.title = t("actions.close");
    backBtn.textContent = t("extension.gmail.back");
    if (!isBusy) attachLabel.textContent = t("actions.add");
    const attLabel = root.querySelector("#routine-gmail-att-label");
    if (attLabel) attLabel.textContent = t("extension.gmail.attachments");
    const attHint = root.querySelector("#routine-gmail-att-hint");
    if (attHint) attHint.textContent = t("extension.gmail.email_always");
    panel.setAttribute("lang", languageCode);
    for (const btn of document.querySelectorAll(`[${INLINE_BTN_ATTR}="1"]`)) {
      btn.title = t("extension.gmail.add_to_routine");
      btn.setAttribute("aria-label", t("extension.gmail.add_to_routine"));
    }
  }

  function clearCloseTimer() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function setResultMode(active) {
    panel.classList.toggle("is-result", active);
    picker.hidden = active;
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

  function setBusy(busy, text, percent) {
    isBusy = busy;
    busyEl.hidden = !busy;
    busyText.textContent = text || t("extension.gmail.processing");
    const hasPercent = busy && typeof percent === "number" && Number.isFinite(percent);
    progressWrap.hidden = !hasPercent;
    progressCount.hidden = !hasPercent;
    if (hasPercent) {
      const pct = Math.max(0, Math.min(100, Math.round(percent)));
      progressBar.style.width = `${pct}%`;
      progressBar.setAttribute("aria-valuenow", String(pct));
      progressCount.textContent = `${pct}%`;
    } else {
      progressBar.style.width = "0%";
      progressBar.setAttribute("aria-valuenow", "0");
      progressCount.textContent = "";
    }
    closeBtn.disabled = busy;
    backBtn.disabled = busy;
    attToggleBtn.disabled = busy;
    attachBtn.disabled = busy || !selectedId;
    attachLabel.textContent = busy ? t("extension.gmail.waiting") : t("actions.add");
    modal.classList.toggle("is-busy", busy);
    panel.classList.toggle("is-busy", busy);
    for (const row of results.querySelectorAll("li")) {
      row.classList.toggle("is-disabled", busy);
    }
    for (const input of attachList.querySelectorAll("input")) {
      input.disabled = busy || input.dataset.tooLarge === "1";
    }
    for (const crumb of crumbsEl.querySelectorAll("button")) {
      crumb.disabled = busy;
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
    stepEl.textContent = t("extension.gmail.step_lists");
  }

  function resetAttachmentsUi() {
    attachmentOptions = [];
    listedGmailMessageId = "";
    attachList.innerHTML = "";
    attachmentsSection.hidden = true;
    attToggleBtn.textContent = t("extension.gmail.uncheck_all");
  }

  function selectedAttachments() {
    return [...attachList.querySelectorAll('input[type="checkbox"]')]
      .map((input, index) => ({ input, item: attachmentOptions[index] }))
      .filter(({ input, item }) => Boolean(item) && input.checked && !item.tooLarge)
      .map(({ item }) => ({
        attachmentId: String(item.attachmentId || ""),
        name: String(item.name || "attachment"),
        mimeType: String(item.mimeType || ""),
      }))
      .filter((item) => item.attachmentId);
  }

  function updateAttToggleLabel() {
    const boxes = [...attachList.querySelectorAll('input[type="checkbox"]:not(:disabled)')];
    if (!boxes.length) {
      attToggleBtn.hidden = true;
      return;
    }
    attToggleBtn.hidden = false;
    const allOn = boxes.every((box) => box.checked);
    attToggleBtn.textContent = allOn
      ? t("extension.gmail.uncheck_all")
      : t("extension.gmail.check_all");
  }

  function renderAttachments(items) {
    attachmentOptions = items || [];
    attachList.innerHTML = "";
    if (!attachmentOptions.length) {
      attachmentsSection.hidden = true;
      return;
    }
    attachmentsSection.hidden = false;
    attachmentOptions.forEach((item, index) => {
      const li = document.createElement("li");
      const id = `routine-att-${index}`;
      const tooLarge = Boolean(item.tooLarge);
      li.innerHTML = `
        <label class="routine-gmail-att-row" for="${id}">
          <input type="checkbox" id="${id}" />
          <span class="routine-gmail-att-meta">
            <span class="routine-gmail-att-name"></span>
            <span class="routine-gmail-att-size"></span>
          </span>
        </label>
      `;
      const input = li.querySelector("input");
      input.dataset.attachmentId = item.attachmentId;
      input.value = item.attachmentId;
      input.checked = !tooLarge;
      input.disabled = tooLarge;
      if (tooLarge) input.dataset.tooLarge = "1";
      li.querySelector(".routine-gmail-att-name").textContent = item.name;
      li.querySelector(".routine-gmail-att-size").textContent = tooLarge
        ? t("extension.gmail.too_large", { size: formatBytes(item.size) })
        : formatBytes(item.size);
      input.addEventListener("change", updateAttToggleLabel);
      attachList.appendChild(li);
    });
    updateAttToggleLabel();
  }

  async function loadAttachmentsList() {
    resetAttachmentsUi();
    const { messageId, threadId } = getGmailIds();
    if (!messageId && !threadId) return;
    try {
      const result = await send("routine.listAttachments", {
        gmailMessageId: messageId,
        gmailThreadId: threadId,
      });
      if (!result?.ok) return;
      listedGmailMessageId = String(result.data?.gmailMessageId || "");
      renderAttachments(result.data?.attachments || []);
    } catch {
      // keep picker usable without attachments list
    }
  }

  function closeModal() {
    if (isBusy) return;
    clearCloseTimer();
    modal.hidden = true;
    setFeedback("");
    setBusy(false);
    setResultMode(false);
    resetPicker();
    resetAttachmentsUi();
    for (const el of panel.querySelectorAll(".routine-gmail-login-link")) {
      el.remove();
    }
  }

  async function navigateCrumb(index) {
    if (isBusy || view.type === "lists") return;
    // 0 = list root
    if (index <= 0) {
      view = {
        type: "items",
        listId: view.listId,
        listName: view.listName,
        parentId: null,
        trail: [],
      };
      await loadItems();
      return;
    }
    const trail = view.trail.slice(0, index);
    const last = trail[trail.length - 1];
    if (!last) {
      await navigateCrumb(0);
      return;
    }
    if (last.kind === "task") {
      view = {
        type: "subtasks",
        listId: view.listId,
        listName: view.listName,
        parentId: last.id,
        parentTitle: last.title,
        trail,
      };
      await loadSubtasks();
      return;
    }
    view = {
      type: "items",
      listId: view.listId,
      listName: view.listName,
      parentId: last.id,
      trail,
    };
    await loadItems();
  }

  function renderCrumbs() {
    crumbsEl.innerHTML = "";
    if (view.type === "lists") {
      crumbsEl.hidden = true;
      backBtn.hidden = true;
      return;
    }
    crumbsEl.hidden = false;
    backBtn.hidden = false;

    const crumbs = [
      { title: view.listName, index: 0 },
      ...view.trail.map((item, i) => ({ title: item.title, index: i + 1 })),
    ];

    crumbs.forEach((crumb, i) => {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.className = "routine-gmail-crumb-sep";
        sep.textContent = "/";
        crumbsEl.appendChild(sep);
      }
      const isLast = i === crumbs.length - 1;
      if (isLast) {
        const span = document.createElement("span");
        span.className = "routine-gmail-crumb-current";
        span.textContent = crumb.title;
        crumbsEl.appendChild(span);
      } else {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "routine-gmail-crumb-btn";
        btn.textContent = crumb.title;
        btn.addEventListener("click", () => {
          void navigateCrumb(crumb.index);
        });
        crumbsEl.appendChild(btn);
      }
    });
  }

  function setStepLabel() {
    if (view.type === "lists") stepEl.textContent = t("extension.gmail.step_lists");
    else if (view.type === "items") {
      stepEl.textContent = view.trail.some((item) => item.kind === "folder")
        ? t("extension.gmail.step_items_folder")
        : t("extension.gmail.step_items");
    } else stepEl.textContent = t("extension.gmail.step_subtasks");
  }

  function emptyRow(text) {
    results.innerHTML = `<li class="routine-gmail-empty">${text}</li>`;
  }

  function kindIcon(kind) {
    if (kind === "folder") return ICONS.folder;
    if (kind === "task") return ICONS.task;
    if (kind === "subtask") return ICONS.subtask;
    if (kind === "list") return ICONS.list;
    return "";
  }

  function applyLogoTo(img, fallback, logoUrl) {
    if (!img) return;
    if (logoUrl) {
      img.src = logoUrl;
      img.classList.remove("is-hidden");
      img.hidden = false;
      if (fallback) {
        fallback.classList.add("is-hidden");
        fallback.hidden = true;
      }
    } else {
      img.removeAttribute("src");
      img.classList.add("is-hidden");
      img.hidden = true;
      if (fallback) {
        fallback.classList.remove("is-hidden");
        fallback.hidden = false;
      }
    }
  }

  async function refreshSession() {
    const result = await send("routine.getSession");
    session = result?.data || null;
    applySessionI18n(session);
    applyStaticLabels();
    const logoUrl = session?.logoUrl;
    for (const btn of document.querySelectorAll(`[${INLINE_BTN_ATTR}="1"]`)) {
      applyLogoTo(
        btn.querySelector(".routine-gmail-inline-img"),
        btn.querySelector(".routine-gmail-inline-fallback"),
        logoUrl,
      );
    }
    return result;
  }

  function renderSelectable(rows, onPick) {
    results.innerHTML = "";
    selectedId = null;
    attachBtn.disabled = true;
    if (!rows.length) {
      emptyRow(t("extension.gmail.empty"));
      return;
    }
    for (const row of rows) {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.innerHTML = `
        <span class="routine-gmail-row-main">
          <span class="routine-gmail-row-icon"></span>
          <span class="title"></span>
        </span>
        <span class="path"></span>
      `;
      li.querySelector(".routine-gmail-row-icon").innerHTML = kindIcon(row.kind);
      li.querySelector(".title").textContent = row.title;
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
    setBusy(true, t("extension.gmail.load_lists"));
    const result = await send("routine.browse", { step: "lists" });
    setBusy(false);
    if (!result?.ok || !result.data?.ok) {
      setFeedback(tError(result?.data?.error || result?.error), "error");
      emptyRow(t("extension.gmail.load_lists_failed"));
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
    setBusy(true, t("extension.gmail.loading"));
    const result = await send("routine.browse", {
      step: "items",
      listId: view.listId,
      parentId: view.parentId || "",
    });
    setBusy(false);
    if (!result?.ok || !result.data?.ok) {
      setFeedback(tError(result?.data?.error || result?.error), "error");
      emptyRow(t("extension.gmail.load_failed"));
      return;
    }
    setFeedback("");
    const items = result.data.items || [];
    if (!items.length) {
      emptyRow(
        view.parentId
          ? t("extension.gmail.no_tasks_in_folder")
          : t("extension.gmail.no_items"),
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
              ? t("extension.gmail.open_folder")
              : t("extension.gmail.empty_folder")
            : t("extension.gmail.choose_subtask"),
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
    setBusy(true, t("extension.gmail.load_subtasks"));
    const result = await send("routine.browse", {
      step: "subtasks",
      parentId: view.parentId,
    });
    setBusy(false);
    if (!result?.ok || !result.data?.ok) {
      setFeedback(tError(result?.data?.error || result?.error), "error");
      emptyRow(t("extension.gmail.load_subtasks_failed"));
      return;
    }
    setFeedback("");
    const subtasks = result.data.subtasks || [];
    if (!subtasks.length) {
      emptyRow(t("extension.gmail.no_subtasks"));
      return;
    }
    renderSelectable(
      subtasks.map((item) => ({
        id: item.id,
        title: item.title,
        kind: "subtask",
        hint: "",
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
      const folders = view.trail.filter((t) => t.kind === "folder");
      view = {
        type: "items",
        listId: view.listId,
        listName: view.listName,
        parentId: folders.length ? folders[folders.length - 1].id : null,
        trail: folders,
      };
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

  async function openModal() {
    clearCloseTimer();
    modal.hidden = false;
    setBusy(false);
    setFeedback("");
    setResultMode(false);
    resetPicker();
    resetAttachmentsUi();
    for (const el of panel.querySelectorAll(".routine-gmail-login-link")) {
      el.remove();
    }
    const email = scrapeEmailFallback();
    setBusy(true, t("extension.gmail.checking_session"));
    const sessionResult = await refreshSession();
    meta.textContent = email.subject
      ? t("extension.gmail.email_label", { subject: email.subject })
      : t("extension.gmail.open_email");
    setBusy(false);
    if (!sessionResult?.data?.authenticated) {
      const appBase = sessionResult?.appBase || "https://tasqin.com";
      setResultMode(true);
      setFeedback(tError("errors.extension_auth_required"), "error");
      feedback.insertAdjacentHTML(
        "afterend",
        `<p class="routine-gmail-login-link"><a href="${appBase}/login" target="_blank" rel="noreferrer">${t("extension.gmail.open_login")}</a></p>`,
      );
      return;
    }
    const data = sessionResult.data;
    if (data.gmailPluginEnabled === false) {
      setResultMode(true);
      setFeedback(tError("errors.extension_plugin_disabled"), "error");
      return;
    }
    if (data.fileUploadEnabled === false) {
      setResultMode(true);
      setFeedback(tError("errors.extension_uploads_disabled"), "error");
      return;
    }
    if (!data.gmailConnected) {
      const appBase = sessionResult.appBase || "https://tasqin.com";
      const path = data.connectGmailPath || "/auth/gmail-plugin/start";
      setResultMode(true);
      setFeedback(tError("errors.extension_gmail_not_connected"), "error");
      feedback.insertAdjacentHTML(
        "afterend",
        `<p class="routine-gmail-login-link"><a href="${appBase}${path}" target="_blank" rel="noreferrer">${t("extension.gmail.connect_gmail")}</a></p>`,
      );
      return;
    }
    const teams = Array.isArray(data.teams) ? data.teams : [];
    const team =
      teams.find((item) => item.id === data.selectedTeamId) || teams[0] || null;
    if (team && !team.googleDriveConnected) {
      setResultMode(true);
      setFeedback(tError("errors.extension_team_drive_missing"), "error");
      return;
    }
    await Promise.all([loadAttachmentsList(), loadLists()]);
  }

  function makeInlineButton() {
    const btn = document.createElement("div");
    btn.setAttribute(INLINE_BTN_ATTR, "1");
    btn.className = "routine-gmail-inline";
    btn.setAttribute("role", "button");
    btn.tabIndex = 0;
    btn.title = t("extension.gmail.add_to_routine");
    btn.setAttribute("aria-label", t("extension.gmail.add_to_routine"));
    btn.innerHTML = `
      <img class="routine-gmail-inline-img is-hidden" alt="" />
      <span class="routine-gmail-inline-fallback">R</span>
      <span class="routine-gmail-inline-label">Routine</span>
    `;
    applyLogoTo(
      btn.querySelector(".routine-gmail-inline-img"),
      btn.querySelector(".routine-gmail-inline-fallback"),
      session?.logoUrl,
    );
    const open = (event) => {
      event.preventDefault();
      event.stopPropagation();
      void openModal();
    };
    btn.addEventListener("click", open);
    btn.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") open(event);
    });
    return btn;
  }

  function injectInlineButtons() {
    // Remove old left-side message bars from previous versions.
    for (const bar of document.querySelectorAll(".routine-gmail-inline-bar")) {
      bar.remove();
    }

    const hosts = [];

    // Reply / Forward row and message action toolbars
    for (const toolbar of document.querySelectorAll("div.amn, div.gH.bAk, div.ade")) {
      if (!(toolbar instanceof HTMLElement)) continue;
      if (toolbar.closest('[aria-hidden="true"]')) continue;
      if (toolbar.getClientRects().length === 0) continue;
      if (toolbar.querySelector(`[${INLINE_BTN_ATTR}="1"]`)) continue;
      hosts.push(toolbar);
    }

    // Subject / title row
    for (const subject of document.querySelectorAll("h2.hP, h2[data-thread-perm-id]")) {
      const wrap = subject.parentElement;
      if (!(wrap instanceof HTMLElement)) continue;
      if (wrap.querySelector(`[${INLINE_BTN_ATTR}="1"]`)) continue;
      if (wrap.getClientRects().length === 0) continue;
      hosts.push(wrap);
    }

    for (const host of hosts) {
      host.appendChild(makeInlineButton());
    }
  }

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

  attToggleBtn.addEventListener("click", () => {
    if (isBusy) return;
    const boxes = [...attachList.querySelectorAll('input[type="checkbox"]:not(:disabled)')];
    if (!boxes.length) return;
    const allOn = boxes.every((box) => box.checked);
    for (const box of boxes) box.checked = !allOn;
    updateAttToggleLabel();
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
    const email = scrapeEmailFallback();
    const selected =
      attachmentOptions.length > 0 ? selectedAttachments() : null;
    setBusy(true, t("extension.gmail.loading_gmail"), 4);

    let result;
    try {
      result = await send("routine.attachEmail", {
        taskId: selectedId,
        gmailMessageId: listedGmailMessageId || messageId,
        gmailThreadId: threadId,
        email,
        selectedAttachments: selected,
      });
    } catch (error) {
      setBusy(false);
      setResultMode(true);
      setFeedback(
        error instanceof Error ? error.message : t("extension.gmail.attach_failed"),
        "error",
      );
      return;
    }

    setBusy(false);

    if (!result?.ok || !result.data?.ok) {
      setResultMode(true);
      setFeedback(tError(result?.data?.error || result?.error), "error");
      return;
    }

    const attached = result.data.attached || [];
    const skipped = result.data.skipped || [];
    const attachedCount = attached.length;
    const skippedCount = skipped.length;

    let msg =
      attachedCount === 1 && attached[0]?.name
        ? t("extension.gmail.attached_one", { name: attached[0].name })
        : t("extension.gmail.attached_many", { count: attachedCount });
    if (skippedCount > 0) {
      const names = skipped
        .map((item) => item.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");
      msg += ` ${
        names
          ? t("extension.gmail.skipped_named", { count: skippedCount, names })
          : t("extension.gmail.skipped", { count: skippedCount })
      }`;
    }

    setResultMode(true);
    setFeedback(msg, skippedCount > 0 && attachedCount > 0 ? "info" : "success");
    closeTimer = setTimeout(() => {
      closeModal();
    }, skippedCount > 0 ? 4500 : 2800);
  });

  function onAttachProgress(message) {
    if (message?.type !== "routine.attachProgress") return;
    if (!isBusy) return;
    const key = typeof message.key === "string" ? message.key : "";
    if (!key.startsWith("extension.gmail.progress_")) return;
    setBusy(true, t(key, message.params), message.percent);
  }
  if (globalThis.__routineGmailOnMessage) {
    chrome.runtime.onMessage.removeListener(globalThis.__routineGmailOnMessage);
  }
  globalThis.__routineGmailOnMessage = onAttachProgress;
  chrome.runtime.onMessage.addListener(onAttachProgress);

  applyStaticLabels();
  refreshSession().catch(() => undefined);
  injectInlineButtons();
  root._routineInjectInline = injectInlineButtons;
}

ensureUi();

let injectScheduled = false;
function scheduleInlineInject() {
  if (injectScheduled) return;
  injectScheduled = true;
  requestAnimationFrame(() => {
    injectScheduled = false;
    const root = document.getElementById("routine-gmail-root");
    if (!root) {
      ensureUi();
      return;
    }
    if (typeof root._routineInjectInline === "function") {
      root._routineInjectInline();
    }
  });
}

const observer = new MutationObserver(() => {
  if (!document.getElementById("routine-gmail-root")) ensureUi();
  scheduleInlineInject();
});
observer.observe(document.documentElement, { childList: true, subtree: true });

// Hash changes in Gmail often open/close threads without full reload.
function onHashChange() {
  scheduleInlineInject();
}
window.addEventListener("hashchange", onHashChange);
const injectTimer = setInterval(scheduleInlineInject, 2500);

globalThis.__routineGmailCleanup = () => {
  observer.disconnect();
  window.removeEventListener("hashchange", onHashChange);
  clearInterval(injectTimer);
  if (globalThis.__routineGmailOnMessage) {
    chrome.runtime.onMessage.removeListener(globalThis.__routineGmailOnMessage);
    globalThis.__routineGmailOnMessage = null;
  }
  document.getElementById("routine-gmail-root")?.remove();
  for (const btn of document.querySelectorAll("[data-routine-gmail-inline]")) {
    btn.remove();
  }
};
})();
