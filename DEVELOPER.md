# Routine - izstrādātāja dokumentācija

## Tech stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Geist, Font Awesome
- `@dnd-kit` drag-and-drop
- Ports: **3120**
- i18n: `t(key, fallback, params)` no `app/lib/i18n/messages.ts` (lv + en) un `messages-ru.ts`; `site_translations` ir overlay
- Ja aktīvas valodas > 1, ceļa joslā aiz paziņojumiem rādās valodas kods (`LanguageSwitcher` `variant="menu"`). UI valoda: `users.language_code` (apzināta izvēle), citādi viesu cookie ar `routine-app-language-chosen`, citādi sistēmas noklusējuma valoda.
- Datumi UI: `formatDisplayDateDdMmYy()` → `dd.mm.yy`

## Sānjosla

`app/components/app-nav.tsx` — fiksēta kreisā josla. Galvenē `TeamSwitcher`: kreisajā avatārs (iniciāļi / logotips), pa labi nosaukums un amats (`teamRankLabel`). Apgrieztiem nosaukumiem `OverflowTooltip`. Klikšķis uz avatāra atver komandu sarakstu un **Pievienot jaunu komandu**. Hover uz rindas rāda `...` (Labot / Dzēst) pirms ķeksīša; pēdējo komandu dzēst nevar. Pieslēgtam lietotājam bez komandas `NameFormModal` ir `blocking` — aizveras tikai pēc pievienošanas.

| Rinda | Saturs |
|---|---|
| Sākums | `/dashboard` komandas todo board |
| Saraksts | `/lists` visu uzdevumu kopsavilkums; chevron izver koku |
| Saraksts (bērns) | `/lists/[listId]` projekta logi: Uzdevumi | Faili augšā, Saraksts pilnā platumā |
| Uzdevums | `/lists/[listId]/tasks/[taskId]` apakšuzdevumu tabula; ikona `fas fa-list-check` |
| Komanda | `/team` biedri ar pēdējo tiešsaistes zīmi |
| Uzstādījumi | `/settings` |
| Lietotājs | avatars, parole, iziet (ved uz `/`) |

Koks: **Saraksts → mape (`kind: "folder"`) vai uzdevumu saraksts (`kind: "task"`) vai fails → apakšuzdevumi (`kind: "subtask"`)**. Apakšuzdevuma rinda rāda `StatusTreeDot` (fons un apmale = statusa krāsa: `todo` pelēks, `in_progress` oranžs, `done` zaļš).

Uzvedība:

- **Saraksts** nosaukums atver kopsavilkumu; chevron tikai izver koku.
- Saraksta rindā rāda ikonu vai iniciāļus ar krāsu; hover laikā ikonas vietā ir sakļaušanas bultiņa.
- Uzdevuma rindā `fas fa-list-check`; hover laikā ikonas vietā chevron.
- Apakšuzdevuma rindā krāsains aplītis; hover neaizstāj ar chevron.
- Saraksta `+` atver izveides formu, ja loma ļauj veidot sarakstus un saraksta pieeja ir **pilna labošana**. Mapes `+` — mape, uzdevumu saraksts vai faila augšupielāde. Uzdevuma `+` atver apakšuzdevuma modāli (tikai `full_edit`).
- Faila rinda atver `/lists/[listId]/files/[fileId]`.

Vecie `/projects` ceļi novirza uz `/lists`.

## Publiskās lapas

Route group `app/(marketing)/` - bez sānjoslas. Galvene `SiteHeader`, kājene `SiteFooter`. Publiskais saturs un galvene ir `max-w-6xl`. Kājene bez rāmja un fona; tā pati kājene ir arī lietotnē (`AppShell`, `variant="app"`).

| Ceļš | Saturs |
|---|---|
| `/` | Landing (`LandingPage` + `LandingAppPreview`) - hero ar dashboard vizuāli, ieguvumu bloki, soļi, CTA |
| `/login` | Ienākt (`LoginForm`) |
| `/signup` | Reģistrēties (`SignupForm`) |
| `/forgot-password` | Aizmirsi paroli (`ForgotPasswordForm`) |
| `/privacy` | Privātuma politika |
| `/terms` | Lietošanas noteikumi |
| `/cookies` | Sīkdatņu politika + iestatījumu poga |

Auth: e-pasta Ienākt / Reģistrēties joprojām frontend (toast + `/dashboard`). **Turpināt ar Google** ir īsts Supabase OAuth (sk. Google OAuth). Iziet ved uz `/`.

Legal teksti: `app/lib/legal/documents.ts`. UI: `LegalDocumentView` ar **Saturs** sānjoslu (`sticky` zem galvenes): klikšķis ritina uz sadaļu, josla paliek redzama visā dokumentā.

## Sīkdatņu piekrišana

`CookieConsentProvider` root layoutā. Popup, kamēr nav lēmuma; iestatījumus var atvērt kājenē vai `/cookies`.

- Cookie: `routine-app-cookie-consent` (versija 1, 180 dienas)
- Kategorijas: `necessary`, `preferences`, `analytics`, `marketing`
- `routine-app-list-window-order` raksta tikai ar `preferences` piekrišanu

## Skati

| Klikšķis | Lapa | UI |
|---|---|---|
| Sākums | `/dashboard` | `TeamTodoBoard` — kolonnas Darāms, Procesā, Gatavs |
| Saraksts | `/lists` | `ListsOverviewPage` — kartītes ar uzdevumiem un apakšuzdevumiem; klikšķis atver `SubtaskDetailModal` uz vietas |
| Projekts (saraksts) | `/lists/[listId]` | `ListWindowsBoard` — Uzdevumi | Faili; zem tām Saraksts ar mapēm, nested uzdevumiem un arhīvu; kārtība cookie `routine-app-list-window-order` |
| Uzdevums | `/lists/[listId]/tasks/[taskId]` | `SubtaskTable` — nosaukums, atbildīgais, sākums, termiņš, statuss; arhīvs, pārvietošana, mīkstā dzēšana; hover rāda darbības |
| Fails | `/lists/[listId]/files/[fileId]` | `FileDetailPage` — priekšskatījums, lejupielāde, pārsaukšana, dzēšana |
| Apakšuzdevums | uzdevuma ceļš vai saraksta skats + modālis | `SubtaskDetailModal` — lauki kreisajā, vēsture labajā |
| Administrācija | `/admin` | horizontāla apakšizvēlne: lietotāji, komandas, lomas, statusi, valodas, tulkojumi, uzstādījumi; tikai `is_admin` |

Ceļa josla: `app/components/page-breadcrumb.tsx`. Labajā malā `AdminPanelButton` (`fas fa-users-cog`, tikai `is_admin`), `NotificationsMenu` (zvaniņš) un valodas kods, ja aktīvas valodas > 1.

## Administrācijas panelis

`/admin` — satura joslā ar **horizontālu apakšizvēlni**. Ikona pie paziņojumiem rādās tikai ielogotam lietotājam ar `public.users.is_admin = true`. `/admin` novirza uz `/admin/users`.

| Ceļš | Saturs |
|---|---|
| `/admin/users` | Visi `public.users`: pievienot, labot, dzēst; `is_admin` slēdzis; pēdējā tiešsaiste; UI valodas kods |
| `/admin/teams` | Visas `teams`: pievienot, labot, dzēst (kaskāde uz darba datiem) |
| `/admin/roles` | Sistēmas noklusējuma lomas un pieejas (`system_default_roles`); jaunām komandām |
| `/admin/statuses` | Uzdevumu statusu katalogs (`task_statuses`): nosaukums katrā valodā, krāsa, grupa, kārtojums |
| `/admin/languages` | `site_languages`: pievienot, labot nosaukumu, aktīva/noklusējuma, dzēst |
| `/admin/translations` | `site_translations` + `messages.ts` atslēgas: meklēšana, pievienot, labot, dzēst (koda atslēgas dzēst nevar) |
| `/admin/settings` | `site_settings`: sistēmas nosaukums un slogans katrā valodā |

- Servera vārti: `requireAdmin()` layoutā un `admin/actions.ts`
- Klienta pārbaude: `useIsAdmin()` caur RPC `current_user_is_admin()` (ikona)
- Lietotāju saraksts caur ielogotā admin sesiju (RLS `008_admin_list_access.sql`); jauna lietotāja izveide ar service role
- Valodas, tulkojumi, uzstādījumi caur to pašu sesiju (RLS `010_site_admin_session_access.sql`); `site_*` SELECT arī `anon`
- Migrācijas: `003` admin RPC, `006` valodas/tulkojumi/uzstādījumi, `007` RU, `008` admin list access, `009` `users` aktivitātes lauki, `010` site admin session RLS, `011` `users.language_code`, `012`/`016`/`018` statusi, `017`/`020`/`021` lomas, `013`/`014`/`019` privāti saraksti, `022`/`023` sarakstu pieeju līmeņi, `024` `work_tasks.deleted_at`

## Paziņojumi

`app/components/notifications-menu.tsx` — satura joslas zvaniņš atver paneli.

- Nerakstīto skaits uz zvana; **Atzīmēt visus kā lasītus**
- Klikšķis uz ieraksta atzīmē kā lasītu un atver `href` (uzdevums)
- Ja uzdevumam / apakšuzdevumam / dashboard todo pievieno komandas biedru, rodas `assigned` paziņojums; **sevi piešķirot paziņojumu nerada**
- Nav dummy seed; tipi `app/lib/notifications.ts`
- Stāvoklis: `app/lib/use-notifications.ts` lasa/raksta `app_notifications` tabulu (komandas biedri redz kopīgos paziņojumus)

## Apakšuzdevuma modālis

`app/components/subtask-detail-modal.tsx` + `AppModal` (`dirty` no nosaukuma, apraksta, datumiem, atbildīgajiem — **statuss dirty neskaita**). Statusa maiņa esošam apakšuzdevumam `updateTask` uzreiz. Saglabāt **neaizver** modāli un nepāriet uz citu lapu; aizver X / ESC / Atcelt. Pēc jauna apakšuzdevuma izveides paliek edit mode. Poga **Pievienot jaunu** (tikai plus + tooltip `actions.add_new`) rādās, kad ir nosaukums un Saglabāt nav aktīvs; klikšķis atver tukšu formu tajā pašā modālī. `headerMeta` rāda `izveidots {date}` no aktivitātes `kind === "created"` (`formatDisplayDateDdMmYy`); jaunam nesaglabātam apakšuzdevumam datums nav. Atverams arī no saraksta loga un `/lists` kopsavilkuma, bez navigācijas.

| Lauks | Uzvedība |
|---|---|
| Nosaukums | Trekns, lielāks teksts, bez rāmja un fona |
| Apraksts | Piezīmes |
| Sākums / Termiņš | `DateCell` — klikšķis atver pārlūka datuma izvēli (`showPicker`); zem datuma atlikušās vai kavētās dienas (`calendarDaysFromToday`); `disabled`, ja nav `canEditTasks` |
| Statuss | `StatusControl` — krāsaina poga; nākamais (`fa-angle-right`) un Check. Tabulā bez hover tikai nosaukums, hover rāda `>` / Check / pārvietot / dzēst (bez animācijas). Klikšķis uz nosaukuma atver picker. `comment` līmenī statusu drīkst mainīt izpildītājs |
| Projekts, atbildīgie | Saraksta badge, `AssigneeCell` |
| Pielikumi | `TaskAttachments` — drag-and-drop vai **pārlūko**; kartītes ar priekšskatījumu; `disabled` bez `edit` / `full_edit` |
| Faila `...` | `CreateItemMenu`: Apskatīt, Pārsaukt, Dzēst. Klikšķis uz kartītes arī atver apskati. Izvēlne ar `data-app-modal-ignore-backdrop`, lai neaizvērtu apakšuzdevuma modāli |
| Dzēst failu | Tikai `ConfirmModal` (`files.delete.*`) |
| Pārsaukt failu | `NameFormModal` (`files.edit.*`) |
| Apskatīt failu | `FilePreview` ligzdotā `AppModal` |
| Vēsture | Labā kolonna, `taskActivities`; statusu nosaukumi no kataloga (`labelFor`); laiks `RelativeTime` (kā pēdējā tiešsaiste); no `comment` līmeņa — komentāra lauks (`addTaskComment`) |

Failu metadati: `TaskFile` (`id`, `taskId`, `name`, `mimeType`, `size`, `hasContent`, `createdAt`). Saturs Postgres `task_files.content` (data URL, līdz `MAX_STORED_FILE_BYTES`, 1.5 MB).

## Saraksti un uzdevumi

Hierarhija: **Saraksts → mape / uzdevumu saraksts / fails → apakšuzdevumi tikai zem uzdevumu saraksta**.

- Tipi: `app/lib/lists.ts` (`WorkTaskKind`: `folder` \| `task` \| `subtask`)
- Stāvoklis: `app/lib/lists-store.tsx` — ielāde no `work_lists` / `work_tasks`; pieslēgtam lietotājam bez komandas tukšs koks (nav dummy datu)
- Saraksta faili kokā: `app/lib/list-files.ts`
- Jauns/labot sarakstu: `ListFormModal` — izskats, privāts slēdzis, **noklusējuma pieeja**; slēdzis **Pielāgot katrai lomai** parāda lomu līmeņus un paslēpj globālo izvēli (privātam arī biedriem un „nav pieejas”)
- Apakšuzdevumu tabula (`SubtaskTable`): pie Pievienot arhīva poga rāda aktīvos **un** arhivētos; pabeigšana fade-out vietā; miskaste aiz Check (`deleted_at`, nav statusa katalogā); klikšķis uz dzēstā atjauno; **Pārvietot** (`fa-exchange-alt`) atver `MoveSubtaskModal`; zem statusa `RelativeTime`; jaunam uzdevumam `statusChangedAt` = izveides laiks
- Projekta **Saraksts** logs: uzdevumu kartītes `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))`. Mape rāda nested uzdevumus un to apakšuzdevumus (`getDescendantSubtasks`); arhīva poga kartītē parāda pabeigtos, progresa josla paliek. Klikšķis uz apakšuzdevuma atver `SubtaskDetailModal` uz vietas. Apakšuzdevuma aplītis un nosaukums ir statusa krāsā

## Sarakstu pieejas

`app/lib/list-access.ts` — līmeņi `full_edit` | `edit` | `comment` | `view`. Noklusējums jaunam un esošam sarakstam: **`full_edit`**. Īpašnieks, `is_admin` un izveidotājs vienmēr `full_edit`.

| Līmenis | UI | RLS (`work_list_has_access`) |
|---|---|---|
| `full_edit` | Veidot uzdevumus, labot iestatījumus, dzēst sarakstu | task INSERT, list DELETE, list_files INSERT |
| `edit` | Labot uzdevumus un saraksta iestatījumus | list UPDATE, task DELETE, faili/assignees |
| `comment` | Komentēt; izpildītājs var mainīt statusu | task UPDATE, `task_activities` `kind=comment` |
| `view` | Tikai lasīšana | SELECT caur `can_view_work_list` |

Prioritāte: biedra rinda (`work_list_viewers.access_level`) → lomas rinda (`work_list_viewer_roles`) → `work_lists.default_access_level`. Privātam sarakstam bez rindas pieeja ir `null` (neredz). Publiskam sarakstam lomu rindas ir līmeņa override. UI: `resolveListAccessLevel` + `listAccessCapabilities`. Bez lomu slēdža lomu rindas nesaglabā (visi manto noklusējumu).

## Statusa kontrole

`app/components/status-control.tsx` — vienots `WorkTaskStatus` redaktors tabulā un apakšuzdevuma modālī.

- Krāsas un nosaukumi no `task_statuses` (`useTaskStatuses`); fallback `todo` pelēks, `in_progress` oranžs, `done` zaļš
- Koka / Saraksta loga aplītis: `statusDotClassName` (fons + apmale tās pašas); teksts: `statusTextClassName`
- Picker portal `z-80`, `data-app-modal-ignore-backdrop`; ESC aizver tikai picker
- Nākamais statuss: todo → in_progress → done
- Tabulā `revealActionsOnHover`: bez hover tikai statusa nosaukums; hover (vai atvērts picker / pārvietošana) rāda `>` un trailing pogas, vieta rezervēta, bez animācijas
- Zem pogas `RelativeTime` (`app/components/relative-time.tsx`, `getLastOnlineDisplay`); tooltipā precīzais `dd.mm.yy hh:mm`

## Komanda un pēdējā tiešsaiste

- Biedri: `app/lib/team.ts`, `app/lib/team-store.tsx`
- Komandas (`WorkTeam`): `id`, `name`, `initials`, `icon`, `color`, `logoUrl`; CRUD `addTeam` / `updateTeam` / `deleteTeam` / `selectTeam`
- Pieslēgtam lietotājam komandas un biedri nāk no Postgres (`teams`, `team_members`); `currentUser` nāk tikai no sesijas (`getUser()`), dummy biedri (Anna u.c.) netiek rādīti
- UI gaida auth sesiju pirms komandas/sarakstu ielādes; `INITIAL_SESSION` ar `user=null` netiek izmantots kā gatava sesija
- Jauna komanda: izveidotājs kļūst **Īpašnieks** (`OWNER_TEAM_ROLE` / `teams.rank.owner`); rangs zem vārda, komandas nosaukuma un modālī tikai ja ir komanda
- Lomas: `team_roles` (komandai) + `system_default_roles` (admin `/admin/roles`, seed jaunām komandām). Pieejas `TeamPermissionSet` (`nav` + `actions`) — `app/lib/team-permissions.ts`. Īpašniekam un `is_admin` visas pieejas. UI: `TeamRolesModal` no sānjoslas; katrai lomai saraksta ikona atver `TeamRoleAccessModal` (`TeamPermissionFields` ar sadaļas master slēdzi)
- UI: `app/components/team-switcher.tsx`; jauna/labot komanda caur `NameFormModal` (`blocking`, ja `needsTeam`; `showLogo` + `showIcons={false}`)
- Attēlojums: `app/components/member-last-online.tsx`, loģika `app/lib/last-online.ts`

| Intervāls | Attēlojums |
|---|---|
| ≤ 1 min | zaļš aplītis |
| < 60 min | `{n} min` |
| ≥ 60 min | `{n} h` |
| ≥ 24 h | `{n} d` |
| ≥ 30 dienas | `{n} m` |

Aktīvais lietotājs atjauno `lastOnlineAt` ik pēc 20 s, kamēr lapa ir atvērta. Admin lietotāju tabulā tas pats avots (`team_members.last_online_at`, ne `last_sign_in_at`); aktuālajam adminam rāda dzīvo `useTeam()` vērtību.

## Project structure

```
app/
  layout.tsx                      # Root: i18n, toast, cookie consent
  (marketing)/
    page.tsx                      # Landing
    login/ signup/ forgot-password/
    privacy/ terms/ cookies/
  (app)/
    layout.tsx                    # AppProviders + sānjosla
    dashboard/page.tsx            # Komandas todo board
    lists/                        # Kopsavilkums, 3 logi, uzdevums, fails
    team/ settings/ projects/
    admin/                        # users, teams, roles, statuses, languages, …

  globals.css                     # Zinc light theme; `--radius-*` uz pusi
  components/
    site-header.tsx               # Publiskā galvene
    site-footer.tsx               # Publiskā kājene
    landing-page.tsx              # Landing saturs
    landing-app-preview.tsx       # Hero dashboard vizuālis
    login-form.tsx                # Ienākt + Google
    signup-form.tsx               # Reģistrēties + Google
    google-auth-button.tsx        # Turpināt ar Google
    forgot-password-form.tsx      # Aizmirsi paroli
    legal-document-view.tsx       # Legal lapas + fiksēta satura TOC
    cookie-consent-provider.tsx   # Piekrišanas stāvoklis
    cookie-consent-dialog.tsx     # Popup un iestatījumi
    app-nav.tsx                   # Sānjosla
    team-switcher.tsx             # Komandas pārslēdzējs, CRUD
    app-shell.tsx                 # Layout ar sānjoslu
    lists-overview-page.tsx       # Saraksta kopsavilkums
    list-form-modal.tsx           # Jauns/labot sarakstu + pieejas
    list-summary.tsx              # Uzdevumu kartītes ar statusu grupām
    list-windows-board.tsx        # Uzdevumi | Faili + Saraksts, DnD
    task-detail-page.tsx          # Apakšuzdevumu tabula
    subtask-table.tsx             # Tabula, DateCell, arhīvs, fade-out
    move-subtask-modal.tsx        # Apakšuzdevuma pārvietošana pie cita uzdevuma
    subtask-detail-modal.tsx      # Apakšuzdevuma modālis
    status-control.tsx            # Statusa poga un picker
    relative-time.tsx             # Relatīvais laiks (min / h / d / m)
    team-roles-modal.tsx          # Komandas lomu saraksts
    team-role-access-modal.tsx    # Pieejas pašai lomai
    team-permission-fields.tsx    # Nav + actions slēdži
    admin-roles-manager.tsx       # Sistēmas noklusējuma lomas
    admin-statuses-manager.tsx    # Uzdevumu statusu katalogs
    task-attachments.tsx          # Pielikumu drop zona, kartītes, ... izvēlne
    file-preview.tsx              # Faila priekšskatījums
    create-item-menu.tsx          # Darbību izvēlne
    confirm-modal.tsx             # Dzēšanas apstiprinājums
    name-form-modal.tsx           # Nosaukums, izskats, logotips
    list-appearance-picker.tsx    # Ikona / krāsa (showIcons)
    file-detail-page.tsx          # Saraksta faila skats
    page-breadcrumb.tsx           # Ceļa josla + admin ikona + zvaniņš + valoda
    admin-panel-button.tsx        # Administrācijas panelis (is_admin)
    admin-panel-shell.tsx         # /admin čaula + virsraksts
    admin-submenu.tsx             # Horizontālā apakšizvēlne
    admin-users-manager.tsx       # Lietotāju CRUD
    admin-teams-manager.tsx       # Komandu CRUD
    admin-languages-form.tsx      # Valodu CRUD
    admin-translations-manager.tsx # Tulkojumu CRUD
    admin-settings-form.tsx       # Sistēmas uzstādījumi
    language-switcher.tsx         # Valodas pārslēdzējs (lv / en / ru)
    notifications-menu.tsx        # Paziņojumu panelis
    list-badge.tsx                # Saraksta ikona / iniciāļi / logotips
    member-last-online.tsx        # Tiešsaistes zīme
    team-todo-board.tsx           # Dashboard board
  lib/
    consent/cookie-consent.ts     # Piekrišanas modelis
    legal/documents.ts            # Privacy / terms / cookies teksti
    lists.ts                      # Sarakstu/uzdevumu tipi, krāsas
    list-access.ts                # Saraksta pieeju līmeņi un resolve
    lists-store.tsx               # Saraksti un uzdevumi no Postgres
    list-windows.ts               # Logu kārtība (preferences cookie)
    list-files.ts                 # Saraksta faili kokā; persist DB
    task-activity.ts              # Vēsture un apakšuzdevumu pielikumi
    team.ts                       # Biedru, lomu un WorkTeam tipi
    team-store.tsx                # Komandas, biedri un lomas no Postgres
    team-permissions.ts           # Nav + actions pieeju modelis
    last-online.ts                # min / h / d / m
    task-statuses.tsx             # Statusu katalogs klientā
    notifications.ts              # Paziņojumu tipi
    use-notifications.ts          # Paziņojumi no Postgres
    team-todo.ts                  # Todo tipi
    db/work-data.ts               # Komandas darba datu CRUD
    db/import-local-work.ts       # Vienreizējs localStorage → DB imports
    clear-legacy-demo-storage.ts  # Veco dummy localStorage atslēgu tīrīšana
    format-display-date.ts        # dd.mm.yy
    i18n/messages.ts              # lv + en teksti
    i18n/messages-ru.ts           # ru teksti
    i18n/                          # language, server overlay no site_translations
    site-admin/                   # Admin CRUD repository, tipi
    supabase/                     # env, browser/server/admin klienti, session refresh
    auth/                         # Google OAuth, sesija, display mapping, getCurrentUser
    users/ensure-profile.ts       # public.users rinda pēc OAuth
    users/require-admin.ts        # /admin servera pārbaude
    users/use-is-admin.tsx        # is_admin RPC + profils klientā
    security/safe-redirect-path.ts
app/auth/callback/route.ts        # OAuth code → session
proxy.ts                          # Supabase session refresh
scripts/                          # audit-check.mjs, apply-migrations.mjs, test-supabase.mjs
supabase/migrations/              # 001–024: shēma, admin, valodas, work data, lomas, statusi, sarakstu pieejas, deleted_at
.github/workflows/                # secret-scan.yml, security-audit.yml, security-smoke.yml
.gitleaks.toml                    # default rules + i18n translation key allowlist
.cursor/rules/                    # README bump, commits
security-check.md                 # Drošības audits
```

## CI / Security checks

Trīs GitHub Actions darbplūsmas palaižas pie katra push un pull request:

| Workflow | File | Ko pārbauda |
|----------|------|-------------|
| **Secret scan** | `.github/workflows/secret-scan.yml` | gitleaks — API keys, tokens, paroles git vēsturē |
| **Security audit** | `.github/workflows/security-audit.yml` | `npm run audit:check` — HIGH un CRITICAL atkarības |
| **Security smoke** | `.github/workflows/security-smoke.yml` | TypeScript, lint, production build, `requireAdmin` / `getCurrentUser` uz `actions.ts`, nav `eval()`, drošības galvenes |

> `GITLEAKS_LICENSE` repo secret ir vajadzīgs tikai **organization** kontiem. Šis repo pieder individuālam kontam, tāpēc scan strādā arī privātam repo bez licences.

`.gitleaks.toml` paplašina noklusējuma noteikumus (`useDefault = true`) un pievieno i18n atslēgu allowlist, lai `generic-api-key` nesajauktu `legal.privacy.retention.p1` ar credential. Lokāli:

```bash
gitleaks detect --redact -v --exit-code=2 --log-opts=-1
```

`npm run audit:check` (`scripts/audit-check.mjs`) krīt pie katra HIGH/CRITICAL advisory, izņemot `ACCEPTED_ADVISORIES`. Tranzitīvās atkarības pinotas caur `overrides` (`postcss`, `sharp`, `uuid`, `js-yaml`, `nanoid`, `brace-expansion`).

Pilns audits: **`security-check.md`** (atzīme **6.5 / 10**, pēdējā pilnā pārbaude v0.1.0; v0.1.2 slēdza H2 ar Postgres + RLS).

## Supabase

Kopē `.env.example` uz `.env.local`. URL ir tikai projekta hosts (`https://PROJECT_REF.supabase.co`), **ne** `/rest/v1/`.

| Mainīgais | Kur ņemt |
|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` (secret, Reveal) |
| `SUPABASE_DB_PASSWORD` | Settings → Database → Database password |
| `SUPABASE_DB_REGION` | Connection string reģions (šim projektam `eu-west-2`) |
| `DATABASE_URL` | Optional: pilns pooler URI, ja parole/hosts neiet cauri |

```bash
npm run db:test      # Postgres pieslēgums + public tabulu saraksts
npm run db:migrate   # pending faili no supabase/migrations/
```

Lietotne lasa sarakstus, uzdevumus, komandas, todo, paziņojumus un failus no Postgres (migrācija `005_work_data.sql` un tālākās). RLS: `is_team_member(team_id)` / `is_team_owner(team_id)`; saraksta darbībām papildus `work_list_has_access(list_id, min_level)` (`022`). Anon piekļuve liegta. Komandas biedri ar `team_members.user_id = auth.uid()` redz tos pašus datus, ja saraksts nav privāts vai viņiem ir viewer/lomas rinda. `public.users` paliek konta profils + `is_admin`; komandas loma ir `team_members.role` / `role_id` → `team_roles`. Migrācijas `001`–`004`: `is_admin`, pirmais reģistrētais ir admin, `current_user_is_admin()`, noņemts liekais `users.role` / `manager_id` un vecās neizmantotās project/task tabulas. `db:test` apstiprina API projektu, bet Postgres pieprasa pareizu datubāzes paroli (ne `anon` atslēgu).

## Google OAuth

Login un signup rāda **Turpināt ar Google**. Client ID un Secret **nav** `.env` — tos ievada Supabase Dashboard → Authentication → Providers → Google.

1. Google Cloud → APIs & Services → Credentials → **OAuth 2.0 Client ID** (Web application)
2. Authorized JavaScript origins: `http://localhost:3120`
3. Authorized redirect URI: `https://ozaoaaqmknoxtwywzara.supabase.co/auth/v1/callback`
4. Supabase → Authentication → Providers → Google → Enable, ielīmē Client ID un Client Secret
5. Supabase → Authentication → URL Configuration:
   - Site URL: `http://localhost:3120`
   - Redirect URLs: `http://localhost:3120/auth/callback`

Aplikācijas callback: `/auth/callback` (`app/auth/callback/route.ts`). `redirectTo` ņem `window.location.origin`. Pēc Google pieslēgšanās `ensure_user_profile` izveido `public.users` rindu. Pirmais reģistrētais saņem `is_admin = true`, pārējie `false`.

## Dati

Darba dati dzīvo **Postgres**, ne pārlūkā un ne sīkdatnēs. Komandas biedri redz kopīgos sarakstus, mapes, uzdevumus un apakšuzdevumus. CRUD: `app/lib/db/work-data.ts`; ielāde `fetchTeamWorkspace`. Vecie `localStorage` dati (ja tādi bija pirms `005`) vienreiz tiek importēti ar `importLocalWorkIfNeeded` (karogs `routine-app-db-import-v1:{userId}`).

`public.users` ir konta profils + `is_admin` + `language_code`. Komandas biedra loma ir `team_members.role` / `role_id` (katalogs `team_roles`). Uzaicināts biedrs sākumā ir bez `user_id`; pēc reģistrācijas ar to pašu e-pastu trigger `users_link_team_members` piesaista kontu, un tad viņš redz komandas datus. Ja uzaicinātais izveido savu komandu, viņš neredz uzaicinātāja sarakstus.

RLS (`005_work_data.sql`): `authenticated` drīkst SELECT/INSERT/UPDATE/DELETE tikai savas komandas rindās (`is_team_member`); komandas dzēšana / biedru uzaicināšana - `is_team_owner`. Saraksta satura rakstīšanu sašaurina `work_list_has_access` (`022`). `anon` policy ir deny.

| Tabula | Saturs |
|---|---|
| `teams` | Komandas (`team-…`) |
| `team_members` | Biedri; īpašnieka `id` = auth UUID; `role` / `role_id` |
| `team_roles` | Komandas lomas un `permissions` JSON |
| `system_default_roles` | Admin noklusējuma lomas jaunām komandām |
| `task_statuses` | Uzdevumu statusu katalogs (nosaukumi, krāsa, grupa) |
| `work_lists` | Saraksti (`kind`, `is_private`, `default_access_level`, `created_by`) |
| `work_list_viewers` | Privāta saraksta biedri + `access_level` |
| `work_list_viewer_roles` | Saraksta lomu pieeja + `access_level` |
| `work_tasks` | Mapes, uzdevumi, apakšuzdevumi (`kind` + `parent_id` + `deleted_at`) |
| `task_assignees` | Uzdevuma atbildīgie (`member_id`) |
| `task_activities` | Vēsture (izveide, statuss, komentāri, faili) |
| `task_files` | Apakšuzdevumu pielikumi + saturs |
| `list_files` | Saraksta faili kokā + saturs |
| `app_notifications` | Paziņojumi |
| `team_todos` | Dashboard todo board |

localStorage paliek tikai UI preferencei:

| Atslēga | Saturs |
|---|---|
| `routine-app-current-team-id` | Aktīvā komanda (`:userId`) |
| `routine-app-nav-trees` | Sānjoslas sakļaušanas stāvoklis |

Cookie `routine-app-cookie-consent` saglabā sīkdatņu piekrišanu. Cookie `routine-app-list-window-order` saglabā 3 logu kārtību katrā sarakstā, ja atļautas preferenču sīkdatnes. Cookie `routine-app-language` + `routine-app-language-chosen` saglabā viesu apzināto UI valodu; bez `chosen` rāda sistēmas noklusējumu, pēc ielogošanās izvēle nonāk `users.language_code`.

## Versioning & commits

Commit ziņojums beidzas ar `. vX.Y.Z`, kas sakrīt ar `package.json` versiju. README update: patch +0.0.1 pēc noklusējuma caur `.cursor/rules/readme-version-update.mdc`.

Pirms release:

```bash
npm run typecheck
npm run lint
npm run build
```

GitHub Actions pēc push palaiž secret scan, atkarību auditu un security smoke — lokālās pārbaudes joprojām ir pirmais vārti.

## Roadmap

- E-pasta autentifikācija (Google OAuth poga jau ir)
- Lielāku pielikumu storage (tagad data URL kolonnā, līdz 1.5 MB)
- Atkārtojami rutīnas uzdevumi
