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
  "actions.delete": "Dzēst",
  "errors.auth_required":
    "Ienāc TASQIN spraudnī. Sesija paliek aptuveni 30 dienas, arī ja lapa ir aizvērta.",
  "errors.extension_auth_required":
    "Ienāc TASQIN spraudnī. Sesija paliek aptuveni 30 dienas, arī ja lapa ir aizvērta.",
  "errors.extension_gmail_not_connected":
    "Vispirms savieno Gmail spraudnī. Savienojums tiks saglabāts arī TASQIN.",
  "errors.extension_plugin_disabled": "Gmail spraudnis sistēmā ir izslēgts.",
  "errors.extension_team_drive_missing":
    "Šai komandai nav pieslēgts Google Drive. Spraudnis nestrādās.",
  "errors.extension_team_onedrive_missing":
    "Šai komandai nav pieslēgts OneDrive. Spraudnis nestrādās.",
  "errors.extension_team_cloud_missing":
    "Šai komandai nav pieslēgts Google Drive vai OneDrive. Spraudnis nestrādās.",
  "errors.extension_not_subtask": "Izvēlētais ieraksts nav apakšuzdevums.",
  "errors.extension_subtask_unavailable": "Apakšuzdevums nav pieejams.",
  "errors.file_type_mismatch": "Pielikuma tips nesakrīt ar saturu.",
  "errors.extension_file_type": "Daži pielikumi nav atļauti (tips).",
  "errors.extension_file_empty": "Tukšs fails.",
  "errors.extension_file_too_large": "Fails pārsniedz 25 MB limitu.",
  "errors.extension_file_needs_drive":
    "Liels fails: ieslēdz komandas Google Drive integrāciju.",
  "errors.files_require_google_drive":
    "Lai augšupielādētu failus, vispirms pieslēdziet komandas Google Drive.",
  "errors.files_require_onedrive":
    "Lai augšupielādētu failus, vispirms pieslēdziet komandas OneDrive.",
  "errors.files_require_cloud":
    "Lai augšupielādētu failus, vispirms pieslēdziet komandas Google Drive vai OneDrive.",
  "errors.extension_upload_failed": "Neizdevās pievienot failu.",
  "errors.extension_nothing_attached": "Nekas netika pievienots.",
  "errors.extension_search_failed": "Meklēšana neizdevās.",
  "errors.extension_uploads_disabled": "Failu augšupielāde TASQIN ir izslēgta.",
  "errors.extension_subtask_upload_forbidden":
    "Tev nav pieejas pievienot pielikumus apakšuzdevumam.",
  "errors.extension_invalid_body": "Nederīgs pieprasījums.",
  "errors.extension_task_required": "Izvēlies apakšuzdevumu.",
  "errors.extension_list_required": "Izvēlies sarakstu.",
  "errors.extension_gmail_client_id":
    "Iestati Gmail OAuth Client ID paplašinājuma opcijās.",
  "errors.extension_gmail_auth":
    "Gmail atļauja novecojusi. Spraudnī → Savienot Gmail (atjauno OAuth).",
  "errors.extension_gmail_fetch_failed": "Neizdevās ielādēt e-pastu no Gmail API.",
  "errors.extension_gmail_forbidden":
    "Gmail API liegts: ieslēdz Gmail API Google Cloud projektā un atkārtoti Savienot Gmail (scope gmail.readonly).",
  "errors.extension_gmail_not_found":
    "Gmail neatradā ziņu — atver e-pastu pilnā skatā un mēģini vēlreiz.",
  "errors.extension_gmail_message_id":
    "Neatrada Gmail ziņas ID — atver e-pastu pilnā skatā.",
  "errors.extension_unknown": "Nezināma kļūda.",
  "errors.extension_network":
    "Neizdevās savienoties ar serveri. Pārbaudi internetu un mēģini vēlreiz.",
  "errors.extension_context_invalidated":
    "Spraudnis tika pārstartēts. Pārlādē Gmail cilni (F5) un mēģini vēlreiz.",
  "extension.gmail.title": "Pievienot apakšuzdevumam",
  "extension.gmail.back": "Atpakaļ",
  "extension.gmail.waiting": "Gaida…",
  "extension.gmail.processing": "Apstrādā…",
  "extension.gmail.step_lists": "1. Izvēlies sarakstu",
  "extension.gmail.step_items": "2. Izvēlies mapi vai uzdevumu",
  "extension.gmail.step_items_folder": "2. Izvēlies mapi vai uzdevumu mapē",
  "extension.gmail.step_subtasks": "3. Izvēlies apakšuzdevumu",
  "extension.gmail.attachments": "Pielikumi",
  "extension.gmail.attachments_loading": "Ielādē pielikumus…",
  "extension.gmail.attachments_empty": "Nav atsevišķu pielikumu.",
  "extension.gmail.attachments_failed": "Neizdevās ielādēt pielikumus.",
  "extension.gmail.attachments_retry": "Mēģināt vēlreiz",
  "extension.gmail.uncheck_all": "Noņemt visus",
  "extension.gmail.check_all": "Atzīmēt visus",
  "extension.gmail.email_always": "E-pasta saturs (.txt) ir izvēles iespēja.",
  "extension.gmail.email_body": "E-pasta saturs (.txt)",
  "extension.gmail.email_body_hint": "Noņem atzīmi, ja e-pasta tekstu nevēlies pievienot.",
  "files.note": "Piezīme",
  "files.note.help": "Piezīme parādās, kad uzvelc peli uz pielikuma.",
  "lists.windows.files_note_placeholder": "Īsa piezīme",
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
  "extension.gmail.step_new_subtask": "3. Jauns apakšuzdevums",
  "subtasks.add.title": "Jauns apakšuzdevums",
  "subtasks.created": "Apakšuzdevums pievienots.",
  "subtasks.fields.title_placeholder": "Apakšuzdevuma nosaukums",
  "tasks.fields.title": "Nosaukums",
  "tasks.fields.start_date": "Sākums",
  "tasks.fields.description_placeholder": "Īss uzdevuma apraksts",
  "todo.fields.due_date": "Termiņš",
  "todo.fields.assignee": "Atbildīgais",
  "todo.fields.people": "Lietotāji",
  "todo.fields.groups": "Lietotāju grupas",
  "todo.fields.unassigned": "Nepiešķirts",
  "common.description": "Apraksts",
  "actions.cancel": "Atcelt",
  "actions.continue": "Turpināt",
  "lists.fields.icon_search": "Meklēt...",
  "subtasks.table.status": "Statuss",
  "status.search.empty": "Nav atbilstošu statusu.",
  "status.group.not_started": "Nav sākts",
  "status.group.active": "Aktīvs",
  "status.group.closed": "Slēgts",
  "todo.columns.todo": "Darāms",
  "todo.columns.in_progress": "Procesā",
  "todo.columns.done": "Gatavs",
  "team.roles.list": "Lomas",
  "errors.extension_title_required": "Ievadi apakšuzdevuma nosaukumu.",
  "errors.extension_create_failed": "Neizdevās pievienot apakšuzdevumu.",
  "errors.extension_create_forbidden": "Nav tiesību pievienot apakšuzdevumu.",
  "extension.gmail.email_label": "E-pasts: {subject}",
  "extension.gmail.open_email": "Atver e-pastu Gmailā, tad pievieno.",
  "extension.gmail.checking_session": "Pārbauda TASQIN sesiju…",
  "extension.gmail.open_login": "Atvērt TASQIN login",
  "extension.gmail.login_failed": "Neizdevās ienākt.",
  "extension.gmail.site_access_required":
    "Atļauj piekļuvi TASQIN, lai spraudnis varētu pabeigt ielogošanos.",
  "extension.gmail.options.connecting": "Atveras Google atļauju logs…",
  "extension.gmail.connect_gmail": "Savienot Gmail",
  "extension.gmail.reconnect_gmail": "Atjaunot Gmail savienojumu",
  "extension.gmail.add_to_routine": "Pievienot TASQIN",
  "extension.gmail.loading_gmail": "Ielādē e-pastu un pielikumus no Gmail…",
  "extension.gmail.progress_email": "Ielādē e-pastu no Gmail…",
  "extension.gmail.progress_download": "Lejupielādē {name} ({current}/{total})",
  "extension.gmail.progress_upload": "Saglabā TASQIN ({count})…",
  "extension.gmail.attach_failed": "Neizdevās pievienot.",
  "extension.gmail.attached_one": "Veiksmīgi! Pievienots «{name}».",
  "extension.gmail.attached_many": "Veiksmīgi! Pievienoti {count} faili.",
  "extension.gmail.skipped": "Izlaisti {count}.",
  "extension.gmail.skipped_named": "Izlaisti {count}: {names}.",
};

let languageCode = "lv";
let strings = { ...FALLBACK_STRINGS };
let systemName = "TASQIN";

function interpolate(value, params) {
  if (!params) return value;
  return String(value).replace(/\{(\w+)\}/g, (_, key) =>
    params[key] == null ? `{${key}}` : String(params[key]),
  );
}

function t(key, params) {
  const raw = strings[key] || FALLBACK_STRINGS[key] || key;
  return interpolate(raw, { SYSTEM_NAME: systemName, ...params });
}

function applySessionI18n(data) {
  const code = data?.languageCode;
  if (typeof code === "string" && /^[a-z]{2}$/.test(code)) languageCode = code;
  const name = String(data?.systemName || "").trim();
  if (name) systemName = name;
  if (data?.strings && typeof data.strings === "object") {
    strings = { ...FALLBACK_STRINGS, ...data.strings };
  }
}

function tError(key) {
  if (!key) return t("errors.extension_unknown");
  if (key === "errors.auth_required") return t("errors.extension_auth_required");
  if (
    /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(
      String(key),
    )
  ) {
    return t("errors.extension_network");
  }
  return t(key);
}

const INLINE_BTN_ATTR = "data-routine-gmail-inline";

const ICONS = {
  list: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M2 3h12v1.5H2V3zm0 4.25h12V8.75H2V7.25zm0 4.25h12V13.5H2v-2z"/></svg>`,
  folder: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.2l1.2 1.5H13A1.5 1.5 0 0 1 14.5 5v7A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V3.5z"/></svg>`,
  task: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M3 2.5h10A1.5 1.5 0 0 1 14.5 4v8A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V4A1.5 1.5 0 0 1 3 2.5zm1.2 3.2 1.6 1.6 3.8-3.8.9.9-4.7 4.7-2.5-2.5.9-.9z"/></svg>`,
  subtask: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="2.4" fill="currentColor"/></svg>`,
  plus: `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M7.25 2.5h1.5v4.75H13.5v1.5H8.75V13.5h-1.5V8.75H2.5v-1.5h4.75V2.5z"/></svg>`,
};

function send(type, payload = {}) {
  try {
    if (!chrome?.runtime?.id) {
      return Promise.resolve({
        ok: false,
        error: "errors.extension_context_invalidated",
      });
    }
    return chrome.runtime.sendMessage({ type, ...payload }).then(
      (response) => {
        if (chrome.runtime.lastError) {
          const message = chrome.runtime.lastError.message || "";
          if (/context invalidated|extension host|receiving end/i.test(message)) {
            return {
              ok: false,
              error: "errors.extension_context_invalidated",
            };
          }
          return {
            ok: false,
            error: "errors.extension_unknown",
            detail: message,
          };
        }
        return response;
      },
      (error) => {
        const message = error instanceof Error ? error.message : String(error || "");
        if (/context invalidated|extension host|receiving end/i.test(message)) {
          return {
            ok: false,
            error: "errors.extension_context_invalidated",
          };
        }
        return {
          ok: false,
          error: "errors.extension_unknown",
          detail: message,
        };
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "");
    if (/context invalidated|extension host|receiving end/i.test(message)) {
      return Promise.resolve({
        ok: false,
        error: "errors.extension_context_invalidated",
      });
    }
    return Promise.resolve({
      ok: false,
      error: "errors.extension_unknown",
      detail: message,
    });
  }
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

function attrOf(el, names) {
  if (!el) return "";
  for (const name of names) {
    const value = el.getAttribute(name)?.trim();
    if (value) return value;
  }
  return "";
}

function normalizeGmailApiId(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  // Gmail DOM sometimes uses "#msg-f:…" / "#msg-a:…" wrappers.
  const stripped = value.replace(/^#?msg-[af]:/i, "").trim();
  if (/^[a-zA-Z0-9_-]{6,}$/.test(stripped)) return stripped;
  return "";
}

function getGmailIds() {
  const root = findOpenMessageRoot() || document;

  const messageEl =
    firstMatch(root, [
      "[data-legacy-message-id]",
      "[data-message-id]",
    ]) ||
    firstMatch(document, [
      "div[role='main'] [data-legacy-message-id]",
      "div[role='main'] [data-message-id]",
      "[data-legacy-message-id]",
    ]);

  let messageId =
    normalizeGmailApiId(attrOf(messageEl, ["data-legacy-message-id"])) ||
    [...document.querySelectorAll("[data-legacy-message-id]")]
      .map((el) => normalizeGmailApiId(el.getAttribute("data-legacy-message-id")))
      .find(Boolean) ||
    normalizeGmailApiId(attrOf(messageEl, ["data-message-id"])) ||
    "";

  const threadEl =
    firstMatch(document, [
      "h2[data-legacy-thread-id]",
      "h2[data-thread-perm-id]",
      "[data-legacy-thread-id]",
      "[data-thread-perm-id]",
    ]) ||
    firstMatch(root, [
      "[data-legacy-thread-id]",
      "[data-thread-perm-id]",
    ]);

  let threadId =
    normalizeGmailApiId(
      attrOf(threadEl, ["data-legacy-thread-id", "data-thread-perm-id"]),
    ) || "";

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

function senderEmailFromHeader(from) {
  const trimmed = String(from || "").trim();
  if (!trimmed) return "";
  const named = trimmed.match(/<([^<>]+@[^<>]+)>/);
  const raw = (named?.[1] ?? trimmed).replace(/^["']|["']$/g, "").trim();
  const match = raw.match(/[^\s<>"]+@[^\s<>"]+/);
  return (match?.[0] || "").toLowerCase();
}

function emailBodyAttachmentName(from) {
  const email = senderEmailFromHeader(from);
  return email ? `${email}.txt` : "email.txt";
}

function ensureUi() {
  const existing = document.getElementById("routine-gmail-root");
  if (existing?.dataset?.routineUi === "25") {
    existing.querySelector("#routine-gmail-fab")?.remove();
    return;
  }
  existing?.remove();

  const root = document.createElement("div");
  root.id = "routine-gmail-root";
  root.dataset.routineUi = "25";
  root.innerHTML = `
    <div id="routine-gmail-modal" hidden>
      <div class="routine-gmail-backdrop" data-close="1"></div>
      <div class="routine-gmail-panel" role="dialog" aria-modal="true">
        <header>
          <strong id="routine-gmail-title"></strong>
          <button type="button" class="routine-gmail-x" id="routine-gmail-close" data-close="1" aria-label="">×</button>
        </header>
        <div id="routine-gmail-feedback" class="routine-gmail-feedback" hidden role="status" aria-live="polite"></div>
        <div id="routine-gmail-picker" class="routine-gmail-picker">
          <p id="routine-gmail-meta" class="routine-gmail-meta"></p>
          <div id="routine-gmail-crumbs" class="routine-gmail-crumbs" hidden></div>
          <p id="routine-gmail-step" class="routine-gmail-label"></p>
          <button type="button" id="routine-gmail-new-subtask" class="routine-gmail-new-subtask" hidden></button>
          <ul id="routine-gmail-results"></ul>
          <section id="routine-gmail-attachments" class="routine-gmail-attachments" hidden>
            <div class="routine-gmail-attachments-head">
              <p class="routine-gmail-label" id="routine-gmail-att-label"></p>
              <button type="button" id="routine-gmail-att-toggle" class="routine-gmail-link-btn"></button>
            </div>
            <ul id="routine-gmail-attach-list"></ul>
            <p class="routine-gmail-hint" id="routine-gmail-att-hint"></p>
          </section>
        </div>
        <footer class="routine-gmail-footer">
          <button type="button" id="routine-gmail-back" class="routine-gmail-back" hidden></button>
          <button type="button" id="routine-gmail-attach" disabled>
            <span class="routine-gmail-btn-label"></span>
          </button>
        </footer>
        <div id="routine-gmail-create-modal" class="routine-gmail-create-modal" hidden>
          <header>
            <strong id="routine-gmail-create-heading"></strong>
            <button type="button" class="routine-gmail-x" id="routine-gmail-create-x" aria-label="">×</button>
          </header>
          <div id="routine-gmail-create-feedback" class="routine-gmail-feedback" hidden role="status" aria-live="polite"></div>
          <form id="routine-gmail-create" class="routine-gmail-create">
            <label class="routine-gmail-field">
              <span id="routine-gmail-create-title-label"></span>
              <input type="text" id="routine-gmail-create-title" autocomplete="off" />
            </label>
            <div class="routine-gmail-create-dates">
              <label class="routine-gmail-field">
                <span id="routine-gmail-create-start-label"></span>
                <input type="date" id="routine-gmail-create-start" />
              </label>
              <label class="routine-gmail-field">
                <span id="routine-gmail-create-due-label"></span>
                <input type="date" id="routine-gmail-create-due" />
              </label>
            </div>
            <div class="routine-gmail-field">
              <span id="routine-gmail-create-status-label"></span>
              <button type="button" id="routine-gmail-create-status" class="routine-gmail-status-pill" aria-haspopup="listbox" aria-expanded="false">
                <span id="routine-gmail-create-status-text"></span>
              </button>
              <div id="routine-gmail-status-picker" class="routine-gmail-status-picker" hidden role="listbox">
                <div class="routine-gmail-status-search-wrap">
                  <input type="search" id="routine-gmail-status-search" autocomplete="off" />
                </div>
                <div id="routine-gmail-status-groups" class="routine-gmail-status-groups"></div>
              </div>
            </div>
            <div class="routine-gmail-field">
              <span id="routine-gmail-create-assignee-label"></span>
              <div class="routine-gmail-assignee-combo">
                <input type="text" id="routine-gmail-create-assignee-query" autocomplete="off" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" />
                <ul id="routine-gmail-create-assignee-hints" class="routine-gmail-assignee-hints" hidden role="listbox"></ul>
              </div>
              <div id="routine-gmail-create-assignee-badges" class="routine-gmail-assignee-badges"></div>
            </div>
            <label class="routine-gmail-field">
              <span id="routine-gmail-create-desc-label"></span>
              <textarea id="routine-gmail-create-desc" rows="3"></textarea>
            </label>
          </form>
          <footer class="routine-gmail-footer">
            <button type="button" id="routine-gmail-create-cancel" class="routine-gmail-back"></button>
            <button type="submit" form="routine-gmail-create" id="routine-gmail-create-submit"></button>
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
  const closeBtn = root.querySelector("#routine-gmail-close");
  const attachmentsSection = root.querySelector("#routine-gmail-attachments");
  const attachList = root.querySelector("#routine-gmail-attach-list");
  const attToggleBtn = root.querySelector("#routine-gmail-att-toggle");
  const createModal = root.querySelector("#routine-gmail-create-modal");
  const createForm = root.querySelector("#routine-gmail-create");
  const createFeedback = root.querySelector("#routine-gmail-create-feedback");
  const createHeading = root.querySelector("#routine-gmail-create-heading");
  const createTitle = root.querySelector("#routine-gmail-create-title");
  const createStart = root.querySelector("#routine-gmail-create-start");
  const createDue = root.querySelector("#routine-gmail-create-due");
  const createStatusBtn = root.querySelector("#routine-gmail-create-status");
  const createStatusText = root.querySelector("#routine-gmail-create-status-text");
  const createStatusPicker = root.querySelector("#routine-gmail-status-picker");
  const createStatusSearch = root.querySelector("#routine-gmail-status-search");
  const createStatusGroups = root.querySelector("#routine-gmail-status-groups");
  const createAssigneeQuery = root.querySelector("#routine-gmail-create-assignee-query");
  const createAssigneeHints = root.querySelector("#routine-gmail-create-assignee-hints");
  const createAssigneeBadges = root.querySelector("#routine-gmail-create-assignee-badges");
  const createDesc = root.querySelector("#routine-gmail-create-desc");
  const createSubmit = root.querySelector("#routine-gmail-create-submit");
  const createCancel = root.querySelector("#routine-gmail-create-cancel");
  const createCloseBtn = root.querySelector("#routine-gmail-create-x");
  const newSubtaskBtn = root.querySelector("#routine-gmail-new-subtask");

  /** @type {{ type: 'lists' } | { type: 'items', listId: string, listName: string, parentId: string | null, trail: {id:string,title:string,kind:string}[] } | { type: 'subtasks', listId: string, listName: string, parentId: string, parentTitle: string, trail: {id:string,title:string,kind:string}[] }} */
  let view = { type: "lists" };
  let selectedId = null;
  let session = null;
  let isBusy = false;
  let closeTimer = null;
  /** @type {{ attachmentId: string, name: string, mimeType?: string, size: number, tooLarge?: boolean }[]} */
  let attachmentOptions = [];
  let listedGmailMessageId = "";
  let listedGmailFrom = "";
  let creatingSubtask = false;
  const DRAFT_ID = "__draft__";
  /** @type {{ id: string, title: string }[]} */
  let subtaskRowsCache = [];
  /** @type {null | { title: string, description: string, startDate: string, dueDate: string, status: string, assignees: { id: string, name: string, kind: 'member' | 'role' }[] }} */
  let draftSubtask = null;
  /** @type {{ id: string, name: string, kind: 'member' | 'role' }[]} */
  let assigneeOptions = [];
  /** @type {{ id: string, name: string, kind: 'member' | 'role' }[]} */
  let selectedAssignees = [];
  let assigneeHintIndex = 0;
  let assigneesLoading = false;
  /** @type {{ id: string, label: string, color: string, groupKey: 'not_started' | 'active' | 'closed' }[]} */
  let statusOptions = [];
  let defaultStatusId = "todo";
  let selectedStatusId = "todo";

  function applyStaticLabels() {
    const titleEl = root.querySelector("#routine-gmail-title");
    if (titleEl) titleEl.textContent = t("extension.gmail.title");
    closeBtn.setAttribute("aria-label", t("actions.close"));
    closeBtn.title = t("actions.close");
    createCloseBtn.setAttribute("aria-label", t("actions.close"));
    createCloseBtn.title = t("actions.close");
    createHeading.textContent = t("subtasks.add.title");
    createCancel.textContent = t("actions.cancel");
    backBtn.textContent = t("extension.gmail.back");
    if (!isBusy) attachLabel.textContent = t("actions.add");
    const attLabel = root.querySelector("#routine-gmail-att-label");
    if (attLabel) attLabel.textContent = t("extension.gmail.attachments");
    const attHint = root.querySelector("#routine-gmail-att-hint");
    if (attHint) attHint.textContent = t("extension.gmail.email_body_hint");
    paintAttachmentNotePlaceholders();
    paintEmailBodyOptionName();
    const titleLabel = root.querySelector("#routine-gmail-create-title-label");
    if (titleLabel) titleLabel.textContent = t("tasks.fields.title");
    createTitle.placeholder = t("subtasks.fields.title_placeholder");
    const startLabel = root.querySelector("#routine-gmail-create-start-label");
    if (startLabel) startLabel.textContent = t("tasks.fields.start_date");
    const dueLabel = root.querySelector("#routine-gmail-create-due-label");
    if (dueLabel) dueLabel.textContent = t("todo.fields.due_date");
    const statusLabel = root.querySelector("#routine-gmail-create-status-label");
    if (statusLabel) statusLabel.textContent = t("subtasks.table.status");
    createStatusSearch.placeholder = t("lists.fields.icon_search");
    createStatusBtn.setAttribute("aria-label", t("subtasks.table.status"));
    const assigneeLabel = root.querySelector("#routine-gmail-create-assignee-label");
    if (assigneeLabel) assigneeLabel.textContent = t("todo.fields.assignee");
    createAssigneeQuery.placeholder = t("lists.fields.icon_search");
    createAssigneeQuery.setAttribute(
      "aria-controls",
      "routine-gmail-create-assignee-hints",
    );
    createAssigneeHints.setAttribute("aria-label", t("todo.fields.assignee"));
    const descLabel = root.querySelector("#routine-gmail-create-desc-label");
    if (descLabel) descLabel.textContent = t("common.description");
    createDesc.placeholder = t("tasks.fields.description_placeholder");
    createSubmit.textContent = t("actions.continue");
    newSubtaskBtn.innerHTML = `${ICONS.plus} <span>${t("subtasks.add.title")}</span>`;
    paintStatusPill();
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
    attachBtn.disabled = busy || creatingSubtask || !selectedId;
    attachLabel.textContent = busy ? t("extension.gmail.waiting") : t("actions.add");
    modal.classList.toggle("is-busy", busy);
    panel.classList.toggle("is-busy", busy);
    createTitle.disabled = busy;
    createStart.disabled = busy;
    createDue.disabled = busy;
    createStatusBtn.disabled = busy;
    createStatusSearch.disabled = busy;
    createAssigneeQuery.disabled = busy;
    createDesc.disabled = busy;
    createSubmit.disabled = busy;
    createCancel.disabled = busy;
    createCloseBtn.disabled = busy;
    newSubtaskBtn.disabled = busy;
    for (const btn of createAssigneeBadges.querySelectorAll("button")) {
      btn.disabled = busy;
    }
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
    creatingSubtask = false;
    draftSubtask = null;
    subtaskRowsCache = [];
    assigneeOptions = [];
    selectedAssignees = [];
    assigneesLoading = false;
    statusOptions = [];
    defaultStatusId = "todo";
    selectedStatusId = "todo";
    hideStatusPicker();
    hideAssigneeHints();
    newSubtaskBtn.hidden = true;
    attachBtn.disabled = true;
    attachBtn.hidden = false;
    results.innerHTML = "";
    results.hidden = false;
    createModal.hidden = true;
    crumbsEl.hidden = true;
    crumbsEl.innerHTML = "";
    backBtn.hidden = true;
    stepEl.textContent = t("extension.gmail.step_lists");
  }

  function resetAttachmentsUi() {
    attachmentOptions = [];
    listedGmailMessageId = "";
    listedGmailFrom = "";
    attachList.innerHTML = "";
    attachmentsSection.hidden = true;
    attToggleBtn.hidden = true;
    attToggleBtn.dataset.mode = "toggle";
    attToggleBtn.textContent = t("extension.gmail.uncheck_all");
  }

  function showAttachmentsPlaceholder(message, options = {}) {
    attachmentOptions = [];
    attachmentsSection.hidden = false;
    const reconnect = Boolean(options.reconnect);
    const retry = Boolean(options.retry);
    attachList.innerHTML = "";
    ensureEmailBodyOption();
    if (message) {
      const msgLi = document.createElement("li");
      msgLi.className = "routine-gmail-empty";
      msgLi.textContent = message;
      attachList.appendChild(msgLi);
    }
    if (reconnect) {
      const li = document.createElement("li");
      li.className = "routine-gmail-empty";
      const link = document.createElement("a");
      link.href = "#";
      link.className = "routine-gmail-reconnect";
      link.textContent = t("extension.gmail.reconnect_gmail");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        void (async () => {
          setBusy(true, t("extension.gmail.options.connecting"));
          setFeedback("");
          const granted = await ensurePluginHostAccess();
          if (!granted) {
            setBusy(false);
            setFeedback(tError("extension.gmail.site_access_required"), "error");
            return;
          }
          const result = await send("routine.connectGmail");
          setBusy(false);
          if (result?.ok) {
            await loadAttachmentsList();
            return;
          }
          setFeedback(
            tError(result?.error || "extension.gmail.options.connect_failed"),
            "error",
          );
        })();
      });
      li.appendChild(link);
      attachList.appendChild(li);
    }
    updateAttToggleLabel();
    if (retry) {
      attToggleBtn.hidden = false;
      attToggleBtn.dataset.mode = "retry";
      attToggleBtn.textContent = t("extension.gmail.attachments_retry");
    }
  }

  function emailBodyFromHeader() {
    return listedGmailFrom || scrapeEmailFallback().from || "";
  }

  function paintEmailBodyOptionName() {
    const input = attachList.querySelector("#routine-att-email-body");
    const nameEl = input?.closest("label")?.querySelector(".routine-gmail-att-name");
    if (nameEl) nameEl.textContent = emailBodyAttachmentName(emailBodyFromHeader());
  }

  function paintAttachmentNotePlaceholders() {
    for (const note of attachList.querySelectorAll(".routine-gmail-att-note")) {
      note.placeholder = t("lists.windows.files_note_placeholder");
      note.setAttribute("aria-label", t("files.note"));
      note.title = t("files.note.help");
    }
  }

  function syncAttachmentNoteVisibility(input) {
    const note = input
      ?.closest("li")
      ?.querySelector(".routine-gmail-att-note");
    if (!note) return;
    const show = Boolean(input.checked) && !input.disabled;
    note.hidden = !show;
  }

  function createAttachmentNoteInput() {
    const note = document.createElement("input");
    note.type = "text";
    note.className = "routine-gmail-att-note";
    note.maxLength = 500;
    note.autocomplete = "off";
    note.placeholder = t("lists.windows.files_note_placeholder");
    note.setAttribute("aria-label", t("files.note"));
    note.title = t("files.note.help");
    note.addEventListener("click", (event) => event.stopPropagation());
    return note;
  }

  function ensureEmailBodyOption() {
    const existing = attachList.querySelector("#routine-att-email-body");
    if (existing) {
      paintEmailBodyOptionName();
      return;
    }
    const li = document.createElement("li");
    li.innerHTML = `
      <label class="routine-gmail-att-row" for="routine-att-email-body">
        <input type="checkbox" id="routine-att-email-body" checked data-email-body="1" />
        <span class="routine-gmail-att-meta">
          <span class="routine-gmail-att-name"></span>
          <span class="routine-gmail-att-size"></span>
        </span>
      </label>
    `;
    const nameEl = li.querySelector(".routine-gmail-att-name");
    const sizeEl = li.querySelector(".routine-gmail-att-size");
    if (nameEl) nameEl.textContent = emailBodyAttachmentName(emailBodyFromHeader());
    if (sizeEl) sizeEl.textContent = ".txt";
    const note = createAttachmentNoteInput();
    note.dataset.emailBody = "1";
    li.appendChild(note);
    const input = li.querySelector("input[type='checkbox']");
    input?.addEventListener("change", () => {
      syncAttachmentNoteVisibility(input);
      updateAttToggleLabel();
    });
    syncAttachmentNoteVisibility(input);
    attachList.prepend(li);
  }

  function includeEmailBodySelected() {
    const input = attachList.querySelector('input[data-email-body="1"]');
    if (!input) return true;
    return Boolean(input.checked);
  }

  function emailBodyNoteSelected() {
    if (!includeEmailBodySelected()) return "";
    const note = attachList.querySelector(
      '.routine-gmail-att-note[data-email-body="1"]',
    );
    return String(note?.value || "")
      .trim()
      .slice(0, 500);
  }

  function selectedAttachments() {
    return [...attachList.querySelectorAll('input[type="checkbox"]:not([data-email-body])')]
      .map((input) => {
        const id = input.dataset.attachmentId || input.value;
        const item = attachmentOptions.find(
          (row) => String(row.attachmentId) === String(id),
        );
        const note = input
          .closest("li")
          ?.querySelector(".routine-gmail-att-note");
        return { input, item, note };
      })
      .filter(({ input, item }) => Boolean(item) && input.checked && !item.tooLarge)
      .map(({ item, note }) => ({
        attachmentId: String(item.attachmentId || ""),
        name: String(item.name || "attachment"),
        mimeType: String(item.mimeType || ""),
        note: String(note?.value || "")
          .trim()
          .slice(0, 500),
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
    attToggleBtn.dataset.mode = "toggle";
    const allOn = boxes.every((box) => box.checked);
    attToggleBtn.textContent = allOn
      ? t("extension.gmail.uncheck_all")
      : t("extension.gmail.check_all");
  }

  function renderAttachments(items) {
    attachmentOptions = items || [];
    attachList.innerHTML = "";
    attachmentsSection.hidden = false;
    ensureEmailBodyOption();
    if (!attachmentOptions.length) {
      updateAttToggleLabel();
      return;
    }
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
      const note = createAttachmentNoteInput();
      note.dataset.attachmentId = String(item.attachmentId || "");
      li.appendChild(note);
      input.addEventListener("change", () => {
        syncAttachmentNoteVisibility(input);
        updateAttToggleLabel();
      });
      syncAttachmentNoteVisibility(input);
      attachList.appendChild(li);
    });
    updateAttToggleLabel();
  }

  async function loadAttachmentsList() {
    resetAttachmentsUi();
    const { messageId, threadId } = getGmailIds();
    if (!messageId && !threadId) {
      showAttachmentsPlaceholder(tError("errors.extension_gmail_message_id"), {
        retry: true,
      });
      return;
    }
    showAttachmentsPlaceholder(t("extension.gmail.attachments_loading"));
    try {
      const result = await send("routine.listAttachments", {
        gmailMessageId: messageId,
        gmailThreadId: threadId,
      });
      if (!result?.ok) {
        const err = result?.error || "extension.gmail.attachments_failed";
        const needsReconnect =
          err === "errors.extension_gmail_auth" ||
          err === "errors.extension_gmail_not_connected" ||
          err === "errors.extension_gmail_forbidden";
        showAttachmentsPlaceholder(tError(err), {
          retry: !needsReconnect,
          reconnect: needsReconnect,
        });
        return;
      }
      listedGmailMessageId = String(result.data?.gmailMessageId || "");
      listedGmailFrom = String(result.data?.from || "");
      renderAttachments(result.data?.attachments || []);
    } catch {
      showAttachmentsPlaceholder(t("extension.gmail.attachments_failed"), {
        retry: true,
      });
    }
  }

  function closeModal() {
    if (isBusy) return;
    clearCloseTimer();
    hideCreateForm();
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

  function assigneeMatchesQuery(item, query) {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    const hay = `${item.name} ${item.email || ""} ${item.kind === "role" ? t("team.roles.list") : ""}`.toLowerCase();
    return tokens.every((token) => hay.includes(token));
  }

  function appendHighlightedText(parent, text, query) {
    const needle = query.trim();
    if (!needle) {
      parent.textContent = text;
      return;
    }
    const lower = text.toLowerCase();
    const match = needle.toLowerCase();
    const index = lower.indexOf(match);
    if (index < 0) {
      parent.textContent = text;
      return;
    }
    parent.appendChild(document.createTextNode(text.slice(0, index)));
    const mark = document.createElement("mark");
    mark.textContent = text.slice(index, index + needle.length);
    parent.appendChild(mark);
    parent.appendChild(document.createTextNode(text.slice(index + needle.length)));
  }

  function assigneeHintItems() {
    return [...createAssigneeHints.querySelectorAll("li[data-id]")];
  }

  function setAssigneeHintIndex(next) {
    const items = assigneeHintItems();
    if (!items.length) {
      assigneeHintIndex = 0;
      return;
    }
    assigneeHintIndex = ((next % items.length) + items.length) % items.length;
    items.forEach((item, index) => {
      item.classList.toggle("is-active", index === assigneeHintIndex);
    });
    items[assigneeHintIndex].scrollIntoView({ block: "nearest" });
  }

  function hideAssigneeHints() {
    createAssigneeHints.hidden = true;
    createAssigneeHints.classList.remove("is-open");
    createAssigneeHints.innerHTML = "";
    createAssigneeQuery.setAttribute("aria-expanded", "false");
    assigneeHintIndex = 0;
  }

  function appendAssigneeHeading(label) {
    const heading = document.createElement("li");
    heading.className = "routine-gmail-assignee-heading";
    heading.textContent = label;
    createAssigneeHints.appendChild(heading);
  }

  function appendAssigneeOption(item, query) {
    const li = document.createElement("li");
    li.dataset.id = item.id;
    li.setAttribute("role", "option");
    const title = document.createElement("span");
    title.className = "routine-gmail-assignee-hint-name";
    appendHighlightedText(title, item.name, query);
    li.appendChild(title);
    if (item.kind === "member" && item.email && item.email !== item.name) {
      const meta = document.createElement("span");
      meta.className = "routine-gmail-assignee-hint-meta";
      appendHighlightedText(meta, item.email, query);
      li.appendChild(meta);
    }
    li.addEventListener("mousedown", (event) => {
      event.preventDefault();
      addAssignee(item);
    });
    createAssigneeHints.appendChild(li);
  }

  function renderAssigneeHints() {
    const query = createAssigneeQuery.value;
    const selected = new Set(selectedAssignees.map((item) => item.id));
    const matches = assigneeOptions.filter(
      (item) => !selected.has(item.id) && assigneeMatchesQuery(item, query),
    );
    const people = matches.filter((item) => item.kind === "member");
    const groups = matches.filter((item) => item.kind === "role");
    createAssigneeHints.innerHTML = "";
    if (assigneesLoading && !assigneeOptions.length) {
      const empty = document.createElement("li");
      empty.className = "routine-gmail-assignee-empty";
      empty.textContent = t("extension.gmail.loading");
      createAssigneeHints.appendChild(empty);
    } else if (!people.length && !groups.length) {
      const empty = document.createElement("li");
      empty.className = "routine-gmail-assignee-empty";
      empty.textContent = t("extension.gmail.empty");
      createAssigneeHints.appendChild(empty);
    } else {
      if (people.length) {
        appendAssigneeHeading(t("todo.fields.people"));
        for (const item of people.slice(0, 20)) appendAssigneeOption(item, query);
      }
      if (groups.length) {
        appendAssigneeHeading(t("todo.fields.groups"));
        for (const item of groups.slice(0, 20)) appendAssigneeOption(item, query);
      }
    }
    createAssigneeHints.hidden = false;
    createAssigneeHints.classList.add("is-open");
    createAssigneeQuery.setAttribute("aria-expanded", "true");
    setAssigneeHintIndex(0);
  }

  async function openAssigneeHints() {
    hideStatusPicker();
    renderAssigneeHints();
    if (assigneeOptions.length) return;
    assigneesLoading = true;
    renderAssigneeHints();
    await ensureAssignees();
    assigneesLoading = false;
    if (document.activeElement === createAssigneeQuery && creatingSubtask) {
      renderAssigneeHints();
    }
  }

  function renderAssigneeBadges() {
    createAssigneeBadges.innerHTML = "";
    for (const item of selectedAssignees) {
      const badge = document.createElement("span");
      badge.className =
        item.kind === "role"
          ? "routine-gmail-assignee-badge is-group"
          : "routine-gmail-assignee-badge";
      const label = document.createElement("span");
      label.textContent = item.name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.setAttribute("aria-label", t("actions.close"));
      remove.title = t("actions.close");
      remove.textContent = "×";
      remove.disabled = isBusy;
      remove.addEventListener("click", () => {
        if (isBusy) return;
        selectedAssignees = selectedAssignees.filter((row) => row.id !== item.id);
        renderAssigneeBadges();
        if (createAssigneeQuery.value.trim() || document.activeElement === createAssigneeQuery) {
          renderAssigneeHints();
        }
      });
      badge.appendChild(label);
      badge.appendChild(remove);
      createAssigneeBadges.appendChild(badge);
    }
  }

  function addAssignee(item) {
    if (selectedAssignees.some((row) => row.id === item.id)) return;
    selectedAssignees = [...selectedAssignees, item];
    createAssigneeQuery.value = "";
    renderAssigneeBadges();
    createAssigneeQuery.focus();
    renderAssigneeHints();
  }

  function fallbackStatuses() {
    return [
      {
        id: "todo",
        label: t("todo.columns.todo"),
        color: "#a1a1aa",
        groupKey: "not_started",
      },
      {
        id: "in_progress",
        label: t("todo.columns.in_progress"),
        color: "#f97316",
        groupKey: "active",
      },
      {
        id: "done",
        label: t("todo.columns.done"),
        color: "#10b981",
        groupKey: "closed",
      },
    ];
  }

  function statusCatalog() {
    return statusOptions.length ? statusOptions : fallbackStatuses();
  }

  function findStatus(id) {
    const catalog = statusCatalog();
    return (
      catalog.find((row) => row.id === id) ||
      catalog[0] || {
        id: id || "todo",
        label: id || t("todo.columns.todo"),
        color: "#a1a1aa",
        groupKey: "not_started",
      }
    );
  }

  function statusGlyphHtml(color, groupKey) {
    const fill = color || "#a1a1aa";
    if (groupKey === "closed") {
      const glyph = document.createElement("span");
      glyph.className = "routine-gmail-status-glyph is-closed";
      glyph.style.backgroundColor = fill;
      glyph.innerHTML =
        '<svg viewBox="0 0 16 16" width="8" height="8" aria-hidden="true"><path fill="currentColor" d="M6.2 11.2 3.4 8.4l1.1-1.1 1.7 1.7 4.3-4.3 1.1 1.1z"/></svg>';
      return glyph;
    }
    if (groupKey === "active") {
      const glyph = document.createElement("span");
      glyph.className = "routine-gmail-status-glyph is-active";
      glyph.style.borderColor = fill;
      const dot = document.createElement("span");
      dot.style.backgroundColor = fill;
      glyph.appendChild(dot);
      return glyph;
    }
    const glyph = document.createElement("span");
    glyph.className = "routine-gmail-status-glyph is-not-started";
    glyph.style.borderColor = fill;
    return glyph;
  }

  function paintStatusPill() {
    const row = findStatus(selectedStatusId);
    selectedStatusId = row.id;
    createStatusText.textContent = row.label;
    createStatusBtn.style.backgroundColor = row.color || "#a1a1aa";
    createStatusBtn.style.color = "#fff";
  }

  function hideStatusPicker() {
    createStatusPicker.hidden = true;
    createStatusPicker.classList.remove("is-open");
    createStatusBtn.setAttribute("aria-expanded", "false");
    createStatusSearch.value = "";
  }

  function renderStatusGroups() {
    const needle = createStatusSearch.value.trim().toLowerCase();
    const groups = [
      { id: "not_started", label: t("status.group.not_started") },
      { id: "active", label: t("status.group.active") },
      { id: "closed", label: t("status.group.closed") },
    ]
      .map((group) => ({
        ...group,
        statuses: statusCatalog().filter(
          (row) =>
            row.groupKey === group.id &&
            (!needle || row.label.toLowerCase().includes(needle)),
        ),
      }))
      .filter((group) => group.statuses.length > 0);

    createStatusGroups.innerHTML = "";
    if (!groups.length) {
      const empty = document.createElement("p");
      empty.className = "routine-gmail-status-empty";
      empty.textContent = t("status.search.empty");
      createStatusGroups.appendChild(empty);
      return;
    }

    groups.forEach((group, index) => {
      const wrap = document.createElement("div");
      wrap.className = index > 0 ? "routine-gmail-status-group is-next" : "routine-gmail-status-group";
      const heading = document.createElement("p");
      heading.className = "routine-gmail-status-group-label";
      heading.textContent = group.label;
      wrap.appendChild(heading);
      for (const item of group.statuses) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "routine-gmail-status-option";
        option.setAttribute("role", "option");
        const selected = item.id === selectedStatusId;
        option.setAttribute("aria-selected", selected ? "true" : "false");
        if (selected) option.classList.add("is-selected");
        option.appendChild(statusGlyphHtml(item.color, item.groupKey));
        const label = document.createElement("span");
        label.textContent = item.label;
        option.appendChild(label);
        if (selected) {
          const check = document.createElement("span");
          check.className = "routine-gmail-status-check";
          check.innerHTML =
            '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M6.2 11.2 3.4 8.4l1.1-1.1 1.7 1.7 4.3-4.3 1.1 1.1z"/></svg>';
          option.appendChild(check);
        }
        option.addEventListener("click", () => {
          selectedStatusId = item.id;
          paintStatusPill();
          hideStatusPicker();
        });
        wrap.appendChild(option);
      }
      createStatusGroups.appendChild(wrap);
    });
  }

  function showStatusPicker() {
    hideAssigneeHints();
    createStatusPicker.hidden = false;
    createStatusPicker.classList.add("is-open");
    createStatusBtn.setAttribute("aria-expanded", "true");
    renderStatusGroups();
    createStatusSearch.focus();
  }

  function resetCreateForm() {
    createTitle.value = "";
    createStart.value = "";
    createDue.value = "";
    createAssigneeQuery.value = "";
    createDesc.value = "";
    selectedAssignees = [];
    selectedStatusId = defaultStatusId || statusCatalog()[0]?.id || "todo";
    hideAssigneeHints();
    hideStatusPicker();
    renderAssigneeBadges();
    paintStatusPill();
  }

  function fillCreateFormFromDraft() {
    if (!draftSubtask) {
      resetCreateForm();
      return;
    }
    createTitle.value = draftSubtask.title;
    createStart.value = draftSubtask.startDate;
    createDue.value = draftSubtask.dueDate;
    createDesc.value = draftSubtask.description;
    createAssigneeQuery.value = "";
    selectedAssignees = [...draftSubtask.assignees];
    selectedStatusId = draftSubtask.status || defaultStatusId || "todo";
    hideAssigneeHints();
    hideStatusPicker();
    renderAssigneeBadges();
    paintStatusPill();
  }

  function syncNewSubtaskButton() {
    const show = view.type === "subtasks" && !creatingSubtask;
    newSubtaskBtn.hidden = !show;
    newSubtaskBtn.disabled = isBusy;
  }

  function setCreateFeedback(text, variant) {
    if (!text) {
      createFeedback.hidden = true;
      createFeedback.textContent = "";
      return;
    }
    createFeedback.hidden = false;
    createFeedback.textContent = text;
    createFeedback.className = `routine-gmail-feedback is-${variant || "info"}`;
  }

  function hideCreateForm() {
    creatingSubtask = false;
    createModal.hidden = true;
    hideAssigneeHints();
    hideStatusPicker();
    setCreateFeedback("");
    if (view.type === "subtasks") {
      attachBtn.disabled = isBusy || !selectedId;
      backBtn.hidden = false;
    }
    syncNewSubtaskButton();
  }

  async function ensureAssignees() {
    const team = selectedTeamFromSession(session);
    const result = await send("routine.browse", {
      step: "assignees",
      parentId: view.type === "subtasks" ? view.parentId : "",
      teamId: team?.id || "",
    });
    if (Array.isArray(result?.data?.assignees)) {
      assigneeOptions = result.data.assignees;
    }
  }

  function showCreateForm() {
    creatingSubtask = true;
    fillCreateFormFromDraft();
    setCreateFeedback("");
    createModal.hidden = false;
    syncNewSubtaskButton();
    createTitle.focus();
    void (async () => {
      await ensureAssignees();
      if (creatingSubtask && document.activeElement === createAssigneeQuery) {
        renderAssigneeHints();
      }
    })();
  }

  function discardDraft(selectId) {
    draftSubtask = null;
    paintSubtaskList(selectId || null);
  }

  function selectSubtaskRow(id) {
    selectedId = id || null;
    attachBtn.disabled = isBusy || creatingSubtask || !selectedId;
    for (const node of results.querySelectorAll("li")) {
      node.classList.toggle("is-selected", Boolean(id) && node.dataset.id === id);
    }
  }

  function paintSubtaskList(selectId) {
    const rows = subtaskRowsCache.map((item) => ({
      id: item.id,
      title: item.title,
      kind: "subtask",
      hint: "",
    }));
    if (draftSubtask) {
      rows.unshift({
        id: DRAFT_ID,
        title: draftSubtask.title,
        kind: "plus",
        hint: t("subtasks.add.title"),
      });
    }
    if (!rows.length) {
      emptyRow(t("extension.gmail.no_subtasks"));
      selectSubtaskRow(null);
      return;
    }
    renderSelectable(rows, (row) => {
      if (row.id !== DRAFT_ID && draftSubtask) {
        discardDraft(row.id);
        return;
      }
      selectSubtaskRow(row.id);
    });
    const pickId =
      selectId && rows.some((row) => row.id === selectId)
        ? selectId
        : null;
    if (pickId) selectSubtaskRow(pickId);
  }

  function emptyRow(text) {
    results.hidden = false;
    results.innerHTML = `<li class="routine-gmail-empty">${text}</li>`;
  }

  function kindIcon(kind) {
    if (kind === "folder") return ICONS.folder;
    if (kind === "task") return ICONS.task;
    if (kind === "subtask") return ICONS.subtask;
    if (kind === "plus") return ICONS.plus;
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

  function selectedTeamFromSession(data) {
    const teams = Array.isArray(data?.teams) ? data.teams : [];
    const selectedId = data?.selectedTeamId || "";
    return teams.find((team) => team.id === selectedId) || teams[0] || null;
  }

  function teamCloudConnected(team) {
    const driveOn = session?.googleDriveEnabled !== false;
    const odOn = session?.oneDriveEnabled === true;
    return Boolean(
      (driveOn && team?.googleDriveConnected) ||
        (odOn && team?.oneDriveConnected),
    );
  }

  function pluginButtonsAllowed() {
    if (!session) return true;
    if (!session.authenticated) return true;
    const team = selectedTeamFromSession(session);
    return teamCloudConnected(team);
  }

  function removeInlineButtons() {
    for (const btn of document.querySelectorAll(`[${INLINE_BTN_ATTR}="1"]`)) {
      btn.remove();
    }
  }

  function syncPluginButtons() {
    if (!pluginButtonsAllowed()) {
      removeInlineButtons();
      return;
    }
    injectInlineButtons();
  }

  let sessionLoadedAt = 0;
  let sessionPrefetchStarted = false;

  function prefetchSession() {
    if (sessionPrefetchStarted) return;
    sessionPrefetchStarted = true;
    refreshSession().catch(() => undefined);
  }

  async function refreshSession(options = {}) {
    const force = options.force === true;
    if (!force && session && Date.now() - sessionLoadedAt < 30_000) {
      return { data: session };
    }
    const result = await send("routine.getSession", force ? { force: true } : {});
    session = result?.data || null;
    sessionLoadedAt = Date.now();
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
    syncPluginButtons();
    return result;
  }

  function renderSelectable(rows, onPick) {
    results.hidden = false;
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
      if (row.id) li.dataset.id = row.id;
      if (row.kind === "plus") li.classList.add("routine-gmail-draft-row");
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
      if (row.kind === "plus") {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "routine-gmail-draft-remove";
        remove.setAttribute("aria-label", t("actions.delete"));
        remove.title = t("actions.delete");
        remove.textContent = "×";
        remove.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isBusy) return;
          discardDraft(selectedId === DRAFT_ID ? null : selectedId);
        });
        li.querySelector(".routine-gmail-row-main").appendChild(remove);
      }
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
    draftSubtask = null;
    subtaskRowsCache = [];
    hideCreateForm();
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
    draftSubtask = null;
    subtaskRowsCache = [];
    hideCreateForm();
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

  async function loadSubtasks(selectId) {
    if (view.type !== "subtasks") return;
    selectedId = null;
    hideCreateForm();
    attachBtn.disabled = true;
    renderCrumbs();
    setStepLabel();
    setBusy(true, t("extension.gmail.load_subtasks"));
    const team = selectedTeamFromSession(session);
    const result = await send("routine.browse", {
      step: "subtasks",
      parentId: view.parentId,
      teamId: team?.id || "",
    });
    setBusy(false);
    if (!result?.ok || !result.data?.ok) {
      setFeedback(tError(result?.data?.error || result?.error), "error");
      emptyRow(t("extension.gmail.load_subtasks_failed"));
      syncNewSubtaskButton();
      return;
    }
    setFeedback("");
    subtaskRowsCache = result.data.subtasks || [];
    assigneeOptions = Array.isArray(result.data.assignees)
      ? result.data.assignees
      : [];
    statusOptions = Array.isArray(result.data.statuses)
      ? result.data.statuses
          .filter((row) => row && typeof row.id === "string" && row.id.trim())
          .map((row) => ({
            id: String(row.id).trim(),
            label: String(row.label || row.id).trim() || String(row.id),
            color: String(row.color || "#71717a"),
            groupKey:
              row.groupKey === "not_started" ||
              row.groupKey === "active" ||
              row.groupKey === "closed"
                ? row.groupKey
                : "active",
          }))
      : [];
    defaultStatusId = String(result.data.defaultStatus || "").trim() || "todo";
    if (!statusCatalog().some((row) => row.id === defaultStatusId)) {
      defaultStatusId = statusCatalog()[0]?.id || "todo";
    }
    selectedStatusId = defaultStatusId;
    paintSubtaskList(selectId);
    syncNewSubtaskButton();
  }

  async function goBack() {
    if (isBusy) return;
    if (creatingSubtask) {
      hideCreateForm();
      return;
    }
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
    const sessionResult = await refreshSession(
      session && Date.now() - sessionLoadedAt < 30_000 ? {} : { force: true },
    );
    meta.textContent = email.subject
      ? t("extension.gmail.email_label", { subject: email.subject })
      : t("extension.gmail.open_email");
    setBusy(false);
    if (sessionResult?.error === "errors.extension_context_invalidated") {
      setResultMode(true);
      setFeedback(tError("errors.extension_context_invalidated"), "error");
      return;
    }
    if (!sessionResult?.data?.authenticated) {
      const sessionError = sessionResult?.data?.error;
      if (sessionError === "errors.extension_network") {
        setResultMode(true);
        setFeedback(tError("errors.extension_network"), "error");
        return;
      }
      const appBase = sessionResult?.appBase || "https://www.tasqin.com";
      const loginPath = "/auth/gmail-plugin/login";
      setResultMode(true);
      setFeedback(tError("errors.extension_auth_required"), "error");
      feedback.insertAdjacentHTML(
        "afterend",
        `<p class="routine-gmail-login-link"><a href="${appBase}${loginPath}" target="_blank" rel="noreferrer">${t("extension.gmail.open_login")}</a></p>`,
      );
      panel
        .querySelector(".routine-gmail-login-link a")
        ?.addEventListener("click", (event) => {
          event.preventDefault();
          void (async () => {
            setBusy(true, t("extension.gmail.options.connecting"));
            const granted = await ensurePluginHostAccess();
            if (!granted) {
              setBusy(false);
              setFeedback(tError("extension.gmail.site_access_required"), "error");
              return;
            }
            const result = await send("routine.openLogin", { google: true });
            setBusy(false);
            if (result?.ok) {
              await openModal();
              return;
            }
            setFeedback(
              tError(result?.error || "extension.gmail.login_failed"),
              "error",
            );
          })();
        });
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
      setResultMode(true);
      setFeedback(tError("errors.extension_gmail_not_connected"), "error");
      const linkWrap = document.createElement("p");
      linkWrap.className = "routine-gmail-login-link";
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = t("extension.gmail.connect_gmail");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        void (async () => {
          setBusy(true, t("extension.gmail.options.connecting"));
          const granted = await ensurePluginHostAccess();
          if (!granted) {
            setBusy(false);
            setFeedback(tError("extension.gmail.site_access_required"), "error");
            return;
          }
          const result = await send("routine.connectGmail");
          setBusy(false);
          if (result?.ok) {
            await openModal();
            return;
          }
          setFeedback(
            tError(result?.error || "extension.gmail.options.connect_failed"),
            "error",
          );
        })();
      });
      linkWrap.appendChild(link);
      feedback.insertAdjacentElement("afterend", linkWrap);
      return;
    }
    const teams = Array.isArray(data.teams) ? data.teams : [];
    const team =
      teams.find((item) => item.id === data.selectedTeamId) || teams[0] || null;
    if (team && !teamCloudConnected(team)) {
      syncPluginButtons();
      closeModal();
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
      <span class="routine-gmail-inline-label">TASQIN</span>
    `;
    applyLogoTo(
      btn.querySelector(".routine-gmail-inline-img"),
      btn.querySelector(".routine-gmail-inline-fallback"),
      session?.logoUrl,
    );
    btn.addEventListener("mouseenter", () => prefetchSession(), { once: true });
    btn.addEventListener("focus", () => prefetchSession(), { once: true });
    const open = (event) => {
      event.preventDefault();
      event.stopPropagation();
      prefetchSession();
      void openModal();
    };
    btn.addEventListener("click", open);
    btn.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") open(event);
    });
    return btn;
  }

  function injectInlineButtons() {
    if (!pluginButtonsAllowed()) {
      removeInlineButtons();
      return;
    }
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

  newSubtaskBtn.addEventListener("click", () => {
    if (isBusy || view.type !== "subtasks") return;
    showCreateForm();
  });

  createForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isBusy || !creatingSubtask || view.type !== "subtasks") return;
    const title = createTitle.value.trim();
    if (!title) {
      setCreateFeedback(t("errors.extension_title_required"), "error");
      createTitle.focus();
      return;
    }
    draftSubtask = {
      title,
      description: createDesc.value.trim(),
      startDate: createStart.value.trim(),
      dueDate: createDue.value.trim(),
      status: selectedStatusId,
      assignees: [...selectedAssignees],
    };
    hideCreateForm();
    paintSubtaskList(DRAFT_ID);
  });

  createStatusBtn.addEventListener("click", () => {
    if (isBusy) return;
    if (createStatusPicker.classList.contains("is-open")) {
      hideStatusPicker();
      return;
    }
    showStatusPicker();
  });
  createStatusSearch.addEventListener("input", () => {
    renderStatusGroups();
  });
  createStatusSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });

  createAssigneeQuery.addEventListener("input", () => {
    renderAssigneeHints();
  });
  createAssigneeQuery.addEventListener("focus", () => {
    void openAssigneeHints();
  });
  createAssigneeQuery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (createAssigneeHints.hidden) {
        void openAssigneeHints();
        return;
      }
      setAssigneeHintIndex(assigneeHintIndex + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (createAssigneeHints.hidden) {
        void openAssigneeHints();
        return;
      }
      setAssigneeHintIndex(assigneeHintIndex - 1);
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    const items = assigneeHintItems();
    const active = items[assigneeHintIndex] || items[0];
    if (active) active.dispatchEvent(new Event("mousedown"));
  });
  createModal.addEventListener("mousedown", (event) => {
    const target = event.target;
    if (
      target === createAssigneeQuery ||
      createAssigneeHints.contains(target)
    ) {
      return;
    }
    hideAssigneeHints();
    if (
      target === createStatusBtn ||
      createStatusBtn.contains(target) ||
      createStatusPicker.contains(target)
    ) {
      return;
    }
    hideStatusPicker();
  });

  createCancel.addEventListener("click", () => {
    if (isBusy) return;
    hideCreateForm();
  });

  createCloseBtn.addEventListener("click", () => {
    if (isBusy) return;
    hideCreateForm();
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (isBusy || !creatingSubtask) return;
    event.preventDefault();
    event.stopPropagation();
    if (!createStatusPicker.hidden) {
      hideStatusPicker();
      return;
    }
    if (!createAssigneeHints.hidden) {
      hideAssigneeHints();
      return;
    }
    hideCreateForm();
  });

  attToggleBtn.addEventListener("click", () => {
    if (isBusy) return;
    if (attToggleBtn.dataset.mode === "retry") {
      void loadAttachmentsList();
      return;
    }
    const boxes = [...attachList.querySelectorAll('input[type="checkbox"]:not(:disabled)')];
    if (!boxes.length) return;
    const allOn = boxes.every((box) => box.checked);
    for (const box of boxes) {
      box.checked = !allOn;
      syncAttachmentNoteVisibility(box);
    }
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
      attachmentOptions.length > 0 ? selectedAttachments() : [];
    const includeEmailBody = includeEmailBodySelected();
    if (!includeEmailBody && (!selected || selected.length === 0)) {
      setFeedback(tError("errors.extension_nothing_attached"), "error");
      return;
    }

    let taskId = selectedId;
    if (taskId === DRAFT_ID) {
      if (!draftSubtask || view.type !== "subtasks") {
        setFeedback(tError("errors.extension_task_required"), "error");
        return;
      }
      setBusy(true, t("extension.gmail.processing"));
      const created = await send("routine.createSubtask", {
        parentId: view.parentId,
        title: draftSubtask.title,
        description: draftSubtask.description,
        startDate: draftSubtask.startDate,
        dueDate: draftSubtask.dueDate,
        status: draftSubtask.status || "todo",
        assigneeIds: draftSubtask.assignees.map((item) => item.id),
      });
      if (!created?.ok || !created.data?.ok) {
        setBusy(false);
        setFeedback(
          tError(
            created?.data?.error ||
              created?.error ||
              "errors.extension_create_failed",
          ),
          "error",
        );
        return;
      }
      taskId = created.data.subtask?.id || "";
      if (!taskId) {
        setBusy(false);
        setFeedback(tError("errors.extension_create_failed"), "error");
        return;
      }
      draftSubtask = null;
      selectedId = taskId;
    }

    setBusy(true, t("extension.gmail.loading_gmail"), 4);

    let result;
    try {
      result = await send("routine.attachEmail", {
        taskId,
        gmailMessageId: listedGmailMessageId || messageId,
        gmailThreadId: threadId,
        email,
        selectedAttachments: selected,
        includeEmailBody,
        emailBodyNote: emailBodyNoteSelected(),
      });
    } catch (error) {
      setBusy(false);
      setResultMode(true);
      const message =
        error instanceof Error ? error.message : String(error || "");
      setFeedback(
        /context invalidated|extension host|receiving end/i.test(message)
          ? tError("errors.extension_context_invalidated")
          : t("extension.gmail.attach_failed"),
        "error",
      );
      return;
    }
    if (result?.error === "errors.extension_context_invalidated") {
      setBusy(false);
      setResultMode(true);
      setFeedback(tError("errors.extension_context_invalidated"), "error");
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

  function onSessionUpdated(message) {
    if (message?.type !== "routine.sessionUpdated") return;
    const data = message.result?.data;
    if (!data) return;
    session = data;
    sessionLoadedAt = Date.now();
    applySessionI18n(session);
    applyStaticLabels();
    syncPluginButtons();
  }
  if (globalThis.__routineGmailOnSession) {
    chrome.runtime.onMessage.removeListener(globalThis.__routineGmailOnSession);
  }
  globalThis.__routineGmailOnSession = onSessionUpdated;
  chrome.runtime.onMessage.addListener(onSessionUpdated);

  applyStaticLabels();
  root._routineInjectInline = syncPluginButtons;

  function onTeamStorageChange(changes, area) {
    if (area !== "sync" || !changes.selectedTeamId) return;
    void refreshSession();
  }
  if (chrome.storage?.onChanged) {
    if (globalThis.__routineGmailOnStorage) {
      chrome.storage.onChanged.removeListener(globalThis.__routineGmailOnStorage);
    }
    globalThis.__routineGmailOnStorage = onTeamStorageChange;
    chrome.storage.onChanged.addListener(onTeamStorageChange);
  }
}

let uiInitialized = false;
function initUiOnce() {
  if (uiInitialized) return;
  uiInitialized = true;
  ensureUi();
}

function emailUiTargetsPresent() {
  return Boolean(
    document.querySelector(
      "div.amn, div.gH.bAk, div.ade, h2.hP, h2[data-thread-perm-id]",
    ),
  );
}

let injectScheduled = false;
function scheduleInlineInject() {
  if (!emailUiTargetsPresent()) return;
  if (injectScheduled) return;
  injectScheduled = true;
  requestAnimationFrame(() => {
    injectScheduled = false;
    initUiOnce();
    const root = document.getElementById("routine-gmail-root");
    if (!root) return;
    if (typeof root._routineInjectInline === "function") {
      root._routineInjectInline();
    }
  });
}

const observer = new MutationObserver(() => {
  scheduleInlineInject();
});

function attachGmailObserver() {
  const target =
    document.querySelector('div[role="main"]') || document.body;
  if (!target || target.dataset.routineObserved === "1") return;
  target.dataset.routineObserved = "1";
  observer.observe(target, { childList: true, subtree: true });
}

if (document.body) attachGmailObserver();
else document.addEventListener("DOMContentLoaded", attachGmailObserver, { once: true });

function onHashChange() {
  scheduleInlineInject();
}
window.addEventListener("hashchange", onHashChange);
const injectTimer = setInterval(scheduleInlineInject, 8000);
scheduleInlineInject();

globalThis.__routineGmailCleanup = () => {
  observer.disconnect();
  window.removeEventListener("hashchange", onHashChange);
  clearInterval(injectTimer);
  if (globalThis.__routineGmailOnMessage) {
    chrome.runtime.onMessage.removeListener(globalThis.__routineGmailOnMessage);
    globalThis.__routineGmailOnMessage = null;
  }
  if (globalThis.__routineGmailOnSession) {
    chrome.runtime.onMessage.removeListener(globalThis.__routineGmailOnSession);
    globalThis.__routineGmailOnSession = null;
  }
  if (globalThis.__routineGmailOnStorage && chrome.storage?.onChanged) {
    chrome.storage.onChanged.removeListener(globalThis.__routineGmailOnStorage);
    globalThis.__routineGmailOnStorage = null;
  }
  document.getElementById("routine-gmail-root")?.remove();
  for (const btn of document.querySelectorAll("[data-routine-gmail-inline]")) {
    btn.remove();
  }
  uiInitialized = false;
};
})();
