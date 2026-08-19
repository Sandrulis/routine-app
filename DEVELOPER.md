# Routine - izstrādātāja dokumentācija

## Tech stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Geist, Font Awesome
- `@dnd-kit` drag-and-drop
- Ports: **3120**
- i18n: `t(key, fallback, params)` no `app/lib/i18n/messages.ts` (lv + en) un `messages-ru.ts`; `site_translations` ir overlay
- Ja aktīvas valodas > 1, ceļa joslā aiz paziņojumiem rādās valodas kods (`LanguageSwitcher` `variant="menu"`). UI valoda: `users.language_code` (apzināta izvēle), citādi viesu cookie ar `routine-app-language-chosen`, citādi sistēmas noklusējuma valoda.
- Datumi UI: `useDisplayPreferences().formatDate()` / `formatDateTime()`. Efektīvās preferences: lietotāja (`users.week_start_day`, `date_format`, `date_separator`, `time_format`) ja norādītas, citādi `site_settings`. Noklusējums: pirmdiena, `d.m.Y`, `.`, 24 h. DB paliek ISO `YYYY-MM-DD`.
- Favicon: `app/layout.tsx` `<head>` + `generateMetadata.icons` no `siteHeadIconUrl` (`favicon_url` → `logo_url` → iniciāļu SVG ar `logo_color`).
- Document title: `lapas nosaukums | sistēmas nosaukums` (`app/lib/document-title.ts`). Root `generateMetadata.title.template`. Katrai `(app)` un mārketinga lapai `generateMetadata` (`app/lib/page-metadata.ts`); dinamiskajiem maršrutiem DB vaicājumi `document-title-server.ts`. Next.js pēc ielādes vairs nepārraksta title ar tikai sistēmas nosaukumu.

## Sānjosla

`app/components/app-nav.tsx` — fiksēta kreisā josla. Galvenē `TeamSwitcher`: kreisajā avatārs (iniciāļi / logotips), pa labi nosaukums un amats (`teamRankLabel`). Apgrieztiem nosaukumiem `OverflowTooltip`. Klikšķis uz avatāra atver komandu sarakstu un **Pievienot jaunu komandu**. Hover uz rindas rāda `...` (Labot / Dzēst) pirms ķeksīša; pēdējo komandu dzēst nevar. Bez komandas klikšķis uz pārslēdzēja atver komandas izveides modāli (nav bloķējoša); dashboard rāda tukšo stāvokli ar pogu un paziņojumu hintu.

| Rinda | Saturs |
|---|---|
| Sākums | `/dashboard` `DashboardHomePage` — Mani uzdevumi (tikai ja ir piesaistīti) un darbs pa sarakstiem; bez komandas — tukšs stāvoklis + jaunas komandas poga |
| Saraksts | `/lists` visu uzdevumu kopsavilkums; chevron izver koku |
| Saraksts (bērns) | `/lists/[listId]` projekta logi: Uzdevumi | Faili augšā, Saraksts pilnā platumā |
| Uzdevums | `/lists/[listId]/tasks/[taskId]` apakšuzdevumu tabula; ikona `fas fa-list-check` |
| Komanda | `/team` biedri ar pēdējo tiešsaistes zīmi; pending ar resend / kopēt linku / noņemt; pats biedrs var **Pamest komandu**; `...` → lomas un šabloni |
| Failu vieta | koka + apakšuzdevumu failu `size` summa (`formatFileSize`); tooltip ar hint |
| Lietotājs | avatars, **Personīgā informācija** (modālis: vārds, uzvārds), **Personīgie uzstādījumi** (`/settings/profile`), parole, iziet (ved uz `/`) |

Koks: **Saraksts → mape (`kind: "folder"`) vai uzdevumu saraksts (`kind: "task"`) vai fails → apakšuzdevumi (`kind: "subtask"`)**. Apakšuzdevuma rinda rāda `StatusTreeDot` (fons un apmale = statusa krāsa: `todo` pelēks, `in_progress` oranžs, `done` zaļš).

Uzvedība:

- **Saraksts** nosaukums atver kopsavilkumu; chevron tikai izver koku.
- Saraksta rindā rāda ikonu vai iniciāļus ar krāsu; hover laikā ikonas vietā ir sakļaušanas bultiņa.
- Uzdevuma rindā `fas fa-list-check`; hover laikā ikonas vietā chevron.
- Apakšuzdevuma rindā krāsains aplītis; hover neaizstāj ar chevron.
- Saraksta `+` atver izveides formu, ja loma ļauj veidot sarakstus un saraksta pieeja ir **pilna labošana**. Mapes `+` — mape, uzdevumu saraksts, **Pievienot šablonu** vai faila augšupielāde. Uzdevuma `+` atver apakšuzdevuma modāli (tikai `full_edit`).
- Komandas `...`: **Komandas lomas**, **Šabloni** (`/templates`).
- Saraksta `...` ar `canEditList`: **Labot**, **Statusi** (`ListStatusesModal`), **Automatizācijas** (`ListAutomationsModal`), **Dzēst**.
- Uzdevuma/mapes `...` ar `canEditTasks`: **Labot**, **Arhivēt** (`fas fa-folder-open`), **Dzēst**. Arhivēšana (`setWorkItemArchived`) uzliek `archived_at` visam apakškokam; arhivētie pazūd no koka un aktīvā saraksta.
- Faila rinda atver `/lists/[listId]/files/[fileId]`; ikona un krāsa no `file_type_extensions` (`FileIcon` / `useFileTypes`).
- Augšupielāde kokā un apakšuzdevumos: tikai katalogā esoši paplašinājumi (`isAllowedFileName`); `input accept` + toast `files.upload.rejected`.
- Vilkšana (`NavTreeDnd`, `app/components/nav-tree-dnd.tsx`): mapes, uzdevumus un failus var ievilkt mapē (mapes rinda iezīmējas), iznest ārā (uz saraksta nosaukumu vai kaimiņu) vai nomest **pēc pēdējā brāļa**, arī ja tas ir mape (`NavTreeEndDrop` + mapes rinda: augšējā/apakšējā trešdaļa = before/after, vidus = inside). Drop līnija ir `fixed` portal virs overlay (`z-1100`); overlay paliek blakus kursoram. Loģika: `app/lib/nav-tree-move.ts`. Apakšuzdevumi paliek zem sava uzdevuma. Mapi nevar ielikt sevī.

Vecie `/projects` ceļi novirza uz `/lists`.

## Publiskās lapas

Route group `app/(marketing)/` - bez sānjoslas. Galvene `SiteHeader` (sistēmas nosaukums + logotips vai iniciāļu avatārs no `site_settings`), kājene `SiteFooter`. Publiskais saturs un galvene ir `max-w-6xl`. Kājene bez rāmja un fona; tā pati kājene ir arī lietotnē (`AppShell`, `variant="app"`).

| Ceļš | Saturs |
|---|---|
| `/` | Landing (`LandingPage` + `LandingAppPreview`); ielogotam `redirect("/dashboard")` |
| `/login` | Ienākt (`LoginForm`) |
| `/signup` | Reģistrēties (`SignupForm`) |
| `/forgot-password` | Aizmirsi paroli (`ForgotPasswordForm`) |
| `/privacy` | Privātuma politika |
| `/terms` | Lietošanas noteikumi |
| `/cookies` | Sīkdatņu politika + iestatījumu poga |

Auth: e-pasta Ienākt / Reģistrēties joprojām frontend (toast + `/dashboard`). **Turpināt ar Google** ir īsts Supabase OAuth (sk. Google OAuth). **Atcerēties mani** pēc noklusējuma ieslēgts: sesijas sīkdatne 30 dienas; bez ķeksīša - līdz pārlūka aizvēršanai. Ielogotam `proxy` `/`, `/login`, `/signup` un `/forgot-password` novirza uz `/dashboard`; landing `app/(marketing)/page.tsx` arī `redirect("/dashboard")`, ja ir sesija. Iziet ved uz `/`. Publiskajā galvenē ielogotam rādās **Atvērt lietotni**.

Legal teksti: `app/lib/legal/documents.ts`. UI: `LegalDocumentView` ar **Saturs** sānjoslu (`sticky` zem galvenes): klikšķis ritina uz sadaļu, josla paliek redzama visā dokumentā.

## Sīkdatņu piekrišana

`CookieConsentProvider` root layoutā. Popup, kamēr nav lēmuma; iestatījumus var atvērt kājenē vai `/cookies`.

- Cookie: `routine-app-cookie-consent` (versija 1, 180 dienas)
- Kategorijas: `necessary`, `preferences`, `analytics`, `marketing`
- `routine-app-list-window-order` raksta tikai ar `preferences` piekrišanu
- Pieslēgšanās sesija un `routine-app-remember-session` ir **obligātās** sīkdatnes (`app/lib/auth/remember-session.ts`); 30 dienas, ja Atcerēties mani

## Skati

| Klikšķis | Lapa | UI |
|---|---|---|
| Sākums | `/dashboard` | `DashboardHomePage` — Mani uzdevumi tikai tad, ja ir piesaistīti (bez slēgtiem); tad atdalītājs un sarakstu kopsavilkums; grupēšana pēc statusa pretēji picker; apakšuzdevuma klikšķis atver modāli |
| Saraksts | `/lists` | `ListsOverviewPage` — kartītes ar uzdevumiem un apakšuzdevumiem pēc statusa prioritātes; klikšķis atver `SubtaskDetailModal` uz vietas |
| Projekts (saraksts) | `/lists/[listId]` | `ListDetailPage` + `ListSummary` — kopsavilkums; labajā malā arhīva poga (`fas fa-archive`) rāda tikai arhivētos uzdevumus/mapes; aiz nosaukuma `WorkItemArchiveButton` (`fa-folder-open` / `fa-folder`) |
| Uzdevums | `/lists/[listId]/tasks/[taskId]` | Mape: `ListWindowsBoard`. Uzdevums: `GroupedSubtaskTables` / `SubtaskTable` — viena tabula ar statusu galvenēm, apakšuzdevumu arhīvs, pārvietošana, mīkstā dzēšana; aiz nosaukuma arhivēšanas ikona |
| Fails | `/lists/[listId]/files/[fileId]` | `FileDetailPage` — priekšskatījums, lejupielāde, pārsaukšana, dzēšana |
| Apakšuzdevums | uzdevuma ceļš vai saraksta skats + modālis | `SubtaskDetailModal` — lauki kreisajā, Check List pirms pielikumiem, vēsture labajā |
| Šabloni | `/templates`, `/templates/[templateId]` | `TemplatesPage` / `TemplateDetailPage` + `TemplateTreeEditor` — mapes, uzdevumi, apakšuzdevumi, DnD; mapes `+` → Pievienot šablonu |
| Personīgie uzstādījumi | `/settings/profile` | lasāms profila kopsavilkums + datumu/laika preferences (nedēļas sākums, formāts, atdalītājs, 12/24 h); vārdu/uzvārdu labo lietotāja izvēlnē |
| Administrācija | `/admin` | horizontāla apakšizvēlne: lietotāji, komandas, lomas, statusi, failu tipi, valodas, tulkojumi, uzstādījumi; tikai `is_admin` |

Ceļa josla: `app/components/page-breadcrumb.tsx`. Labajā malā `AdminPanelButton` (`fas fa-users-cog`, tikai `is_admin`), `NotificationsMenu` (zvaniņš) un valodas kods, ja aktīvas valodas > 1.

Ielāde: `LoadingState` (`app/components/loading-state.tsx`, `fas fa-circle-notch fa-spin`) lapās, sānjoslā, paziņojumos un admin čaulā, kamēr store `isReady` vai fetch nav pabeigts. Tukšs stāvoklis rādās tikai pēc ielādes.

## Administrācijas panelis

`/admin` — satura joslā ar **horizontālu apakšizvēlni**. Ikona pie paziņojumiem rādās tikai ielogotam lietotājam ar `public.users.is_admin = true`. `/admin` novirza uz `/admin/users`.

| Ceļš | Saturs |
|---|---|
| `/admin/users` | Visi `public.users`: pievienot, labot, dzēst; `is_admin` slēdzis; pēdējā tiešsaiste; UI valodas kods |
| `/admin/teams` | Visas `teams`: pievienot, labot, dzēst (kaskāde uz darba datiem) |
| `/admin/roles` | Sistēmas noklusējuma lomas un pieejas (`system_default_roles`); jaunām komandām |
| `/admin/statuses` | Uzdevumu statusu katalogs (`task_statuses`): nosaukums katrā valodā, krāsa, grupa, kārtojums |
| `/admin/file-types` | Atļautie failu paplašinājumi (`file_type_extensions`): paplašinājums, MIME, Font Awesome ikona, krāsa; CRUD |
| `/admin/languages` | `site_languages`: pievienot, labot nosaukumu, aktīva/noklusējuma, dzēst |
| `/admin/translations` | `site_translations` + `messages.ts` atslēgas: meklēšana, pievienot, labot, dzēst (koda atslēgas dzēst nevar) |
| `/admin/settings` | `site_settings`: sistēmas nosaukums, slogans, logotips/favicon (data URL) vai iniciāļu avatārs ar `logo_color`, nedēļas sākums, datuma formāts/atdalītājs, 12/24 h; hinti zem laukiem |

- Servera vārti: `requireAdmin()` layoutā un `admin/actions.ts`
- Klienta pārbaude: `useIsAdmin()` caur RPC `current_user_is_admin()` (ikona)
- Lietotāju saraksts caur ielogotā admin sesiju (RLS `008_admin_list_access.sql`); jauna lietotāja izveide ar service role
- Valodas, tulkojumi, uzstādījumi caur to pašu sesiju (RLS `010_site_admin_session_access.sql`); `site_*` SELECT arī `anon`
- Migrācijas: `003` admin RPC, `006` valodas/tulkojumi/uzstādījumi, `007` RU, `008` admin list access, `009` `users` aktivitātes lauki, `010` site admin session RLS, `011` `users.language_code`, `012`/`016`/`018` statusi, `017`/`020`/`021` lomas, `013`/`014`/`019` privāti saraksti, `022`/`023` sarakstu pieeju līmeņi, `024` `work_tasks.deleted_at`, `025` kataloga statusa check, `027`/`028`/`030` saraksta statusi, `029` `work_tasks.checklists`, `031` `team_status_labels`, `032` failu `size` backfill, `033`/`035` display preferences, `034` `file_type_extensions`, `036`/`037` sistēmas logotips/favicon un `logo_color`, `038` `work_tasks.archived_at`, `039` `work_templates` / `work_template_items`, `040` šablona `kind: folder` un ligzdots koks, `041` `work_list_automations` (trigger + action uz sarakstu), `044`–`049` komandas uzaicinājumi (tabula, RPC accept/reject, paziņojumi, self-leave, explicit accept, reject fix), `050` `set_current_user_name` (lietotājs maina savu vārdu), `051_team_permissions_extended` (komandu lomu pieejas UI + efektīvais list access), `051_task_activities_extended` un `052_task_activities_reordered` (apakšuzdevumu vēsture), `053` `user_notification_preferences`, `054` paplašināti `app_notifications.kind`

## Paziņojumi

`app/components/notifications-menu.tsx` — satura joslas zvaniņš atver paneli.

- Nerakstīto skaits uz zvana; **Atzīmēt visus kā lasītus**
- Klikšķis uz ieraksta atzīmē kā lasītu un atver `href` (uzdevums)
- **`fetchVisibleNotifications`** — personīgie in-app paziņojumi: `recipient_id === selfMemberId`; uzaicinājumi pēc `target_user_id`; noraidījumi uzaicinātājam
- **Iesaistītie** saņem brīdinājumus par uzdevumu/apakšuzdevumu notikumiem: uzdevuma un (apakšuzdevumam) vecāka piesaistītie; lomas izvērstas uz biedriem (`task-notifications.ts` → `appendNotifications`)
- **`kind`:** `assigned`, `unassigned`, `comment`, `file`, `status_changed`, `task_updated`, `due` (tips gatavs; automātiska ģenerēšana vēl nav), `team_invite`, `team_invite_rejected`
- Triggeri: `lists-store` (`updateTask`, `addTask`, komentārs, fails, pārvietošana), dashboard todo (`team-todo-board`), komandas uzaicinājums (`team/actions.ts`); **aktors pats netiek informēts**
- **`appendNotifications`** pirms insert filtrē pēc `user_notification_preferences` (trūkstoša rinda = ieslēgts)
- **Paziņojumu uzstādījumi** (`notification-settings-modal.tsx`) — grupēts modālis ar 3 sekcijām (Uzdevumi, Atgādinājumi, Komanda) un ikonām katram veidam; toggle automātiski saglabā serverī (bez Saglabāt pogas); pieejams no `user-menu.tsx` un zvaniņa paneļa (`notifications-menu.tsx` settings poga headerī)
- **`team_invite`** — komandas uzaicinājums reģistrētam lietotājam (`target_user_id`); panelī **Apstiprināt** / **Noraidīt** (`accept_team_invitation` / `reject_team_invitation` RPC); servera pusē respektē preference
- **`team_invite_rejected`** — uzaicinātājam pēc noraidījuma; `href` satur noraidītā e-pastu
- Bez aktīvas komandas paziņojumus lasa pēc `target_user_id` (uzaicinājumi redzami arī dashboard tukšajā stāvoklī)
- Lasītu paziņojumu **dzēšana**: hover rāda × pogu (`dismiss`); automātiska tīrīšana vecākiem par 30 dienām (`deleteOldNotifications`) katrā fetch reizē
- Nav dummy seed; tipi `app/lib/notifications.ts`, preference `app/lib/notification-preferences.ts`
- Stāvoklis: `app/lib/use-notifications.ts` lasa/raksta/dzēš `app_notifications` tabulu

## Apakšuzdevuma modālis

`app/components/subtask-detail-modal.tsx` + `AppModal` (`dirty` no nosaukuma, apraksta, datumiem, atbildīgajiem — **statuss un čeklisti dirty neskaita**). Statusa maiņa esošam apakšuzdevumam `updateTask` uzreiz. Čeklisti esošam uzdevumam persistējas uzreiz (tekstam debounce). Saglabāt **neaizver** modāli un nepāriet uz citu lapu; aizver X / ESC / Atcelt. Pēc jauna apakšuzdevuma izveides paliek edit mode. Poga **Pievienot jaunu** (tikai plus + tooltip `actions.add_new`) rādās, kad ir nosaukums un Saglabāt nav aktīvs; klikšķis atver tukšu formu tajā pašā modālī. `headerMeta` rāda `izveidots {date}` no aktivitātes `kind === "created"` (`useDisplayPreferences().formatDate`); jaunam nesaglabātam apakšuzdevumam datums nav. Atverams arī no saraksta loga un `/lists` kopsavilkuma, bez navigācijas.

| Lauks | Uzvedība |
|---|---|
| Nosaukums | Trekns, lielāks teksts, bez rāmja un fona |
| Apraksts | Piezīmes |
| Sākums / Termiņš | `DateCell` — klikšķis atver pārlūka datuma izvēli (`showPicker`); zem datuma relatīvais hints caur `taskDateRelativeHint` (`app/lib/task-date-display.ts`) pēc statusa grupas: **sākums** — `not_started` rāda atlicis/kavē līdz startam, `active` tikai kavējumu; **termiņš** — `not_started`/`active` atlicis vai kavē, `closed` tikai kavējumu; `disabled`, ja nav `canEditTasks` |
| Statuss | `StatusControl` — krāsaina poga; nākamais (`fa-angle-right`) un Check. Tabulā bez hover tikai nosaukums, hover rāda `>` / Check / pārvietot / dzēst (bez animācijas). Klikšķis uz nosaukuma atver picker. `comment` līmenī statusu drīkst mainīt izpildītājs. Ja ir čeklista punkti, zem pogas zaļa progresa josla; slēgto grupu un Check tikai pie 100% |
| Projekts, atbildīgie | Saraksta badge, `AssigneeCell` (izvēlne `createPortal` uz `document.body`, lai netiktu nogriezta tabulā) |
| Check List | `TaskChecklists` — pirms pielikumiem; vairāki saraksti ar nosaukumu; nākamais tukšais punkts parādās pēc teksta; atzīmēšana ar ķeksīti. Struktūru labo `canEditTasks`; punktus atzīmē arī `canChangeStatus` |
| Pielikumi | `TaskAttachments` — drag-and-drop vai **pārlūko**; zem zonas `files.upload.allowed_types`; `accept` no kataloga; kartītes ar ikonu/krāsu; `disabled` bez `edit` / `full_edit` |
| Faila `...` | `CreateItemMenu`: Apskatīt, Pārsaukt, Dzēst. Klikšķis uz kartītes arī atver apskati. Izvēlne ar `data-app-modal-ignore-backdrop`, lai neaizvērtu apakšuzdevuma modāli |
| Dzēst failu | Tikai `ConfirmModal` (`files.delete.*`) |
| Pārsaukt failu | `NameFormModal` (`files.edit.*`) |
| Apskatīt failu | `FilePreview` ligzdotā `AppModal` |
| Vēsture | Labā kolonna, `taskActivities`; katrs ieraksts caur `formatTaskActivityText` (`app/lib/format-task-activity-text.ts`). Logošana centralizēta: `updateTask` → `buildTaskUpdateActivityEvents` (`app/lib/build-task-activity-events.ts`); atsevišķi `moveSubtask`, failu dzēšana/pārsaukšana, `reorderTasks`. Fiksē statusu, datumu (no → uz), piesaistīto pievienošanu/noņemšanu, nosaukumu, aprakstu, kontrolsaraksta punktus, pārvietošanu pie cita uzdevuma, paslēpšanu/atjaunošanu, failus un kārtību. Statusu nosaukumi no kataloga (`labelFor`); laiks `RelativeTime`; no `comment` līmeņa — komentāra lauks (`addTaskComment`) |

Failu metadati: `TaskFile` (`id`, `taskId`, `name`, `mimeType`, `size`, `hasContent`, `createdAt`). Saturs Postgres `task_files.content` (data URL, līdz `MAX_STORED_FILE_BYTES`, 1.5 MB). Atļautie paplašinājumi: `file_type_extensions` (sākumā pdf, dwg, doc, docx, xls, xlsx); `app/lib/file-types.ts` + `FileTypesProvider`. Ikona/krāsa: `FileIcon`.

## Saraksti un uzdevumi

Hierarhija: **Saraksts → mape / uzdevumu saraksts / fails → apakšuzdevumi tikai zem uzdevumu saraksta**.

- Tipi: `app/lib/lists.ts` (`WorkTaskKind`: `folder` \| `task` \| `subtask`)
- Stāvoklis: `app/lib/lists-store.tsx` — ielāde no `work_lists` / `work_tasks`; pieslēgtam lietotājam bez komandas tukšs koks (nav dummy datu). `addTask` optimistiski atjauno UI; DB inserti rindā pēc `parent_id` (`pendingTaskInsertsRef`), lai ligzdoti uzdevumi (šablons, automatizācija) neizjauktos ar FK. Apakšuzdevumu izmaiņas ieraksta `task_activities` caur `buildTaskUpdateActivityEvents` (`updateTask`) un atsevišķās funkcijās (`moveSubtask`, failu operācijas, `reorderTasks`)
- Šabloni (`work_templates` / `work_template_items`): `kind` `folder` | `task` | `subtask` (`040`); redaktors `TemplateTreeEditor` + `template-tree-move.ts` (DnD kā sānjoslā). `applyTemplate` rekursīvi izveido mapes, uzdevumus un apakšuzdevumus. Tukšās rindas tikai UI (`prepareTemplateEditorItems`); DB `sanitizeTemplateItems`. Tiešsaistes touch: `touchMemberOnline(teamId, userId, at)`
- Automatizācijas (`work_list_automations`, `041`): saraksta līmeņa noteikumi ar `trigger_kind` + `action_kind`. Pirmais pāris: `folder_created` → `apply_template` (`template_id`). UI: `ListAutomationsModal` no saraksta `...`. Izpilde: `parent-create-flow.tsx` pēc tiešas mapes izveides (`addTask` ar `kind: folder`) izsauc `applyTemplate` mapes iekšienē — **netrigerējas** manuālā šablona pielietošanā vai rekursīvā mapju veidošanā no šablona. CRUD: `lists-store` `addListAutomation` / `updateListAutomation` / `deleteListAutomation`; helperi `app/lib/list-automations.ts`. DB insert secība: skat. `pendingTaskInsertsRef` pie `addTask`
- Arhīvs (`archived_at`, atšķirīgs no apakšuzdevumu `deleted_at`): `setWorkItemArchived` arhivē uzdevumu vai mapi ar visiem pēcnācējiem; noņemšana no arhīva atjauno arī senčus, lai vienums atkal būtu kokā. Aktīvais koks un `getListTasks` slēpj arhivētos; `archivedListTasks` rāda arhīva saknes. UI: `WorkItemArchiveButton` (`fa-folder-open` aktīvam, `fa-folder` arhivētam); saraksta lapā `fas fa-archive` pārslēdz kopsavilkumu
- Saraksta faili kokā: `app/lib/list-files.ts` — augšupielāde tikai `file_type_extensions` katalogā
- Jauns/labot sarakstu: `ListFormModal` — izskats, privāts slēdzis, **noklusējuma pieeja**; slēdzis **Pielāgot katrai lomai** parāda lomu līmeņus un paslēpj globālo izvēli (privātam arī biedriem un „nav pieejas”)
- Apakšuzdevumu tabula (`SubtaskTable` + `GroupedSubtaskTables`): viena tabula ar `groupByStatus` galvenēm iekšā; pie Pievienot arhīva poga (`IconActionButton` `variant="delete"`, aktīva paliek sarkanīga) rāda aktīvos **un** arhivētos; pabeigšana fade-out vietā; miskaste aiz Check (`deleted_at`, nav statusa katalogā); klikšķis uz dzēstā atjauno; **Pārvietot** (`fa-exchange-alt`) atver `MoveSubtaskModal`; slēgtajiem/dzēstajiem **rindai** viegls fons (`fadeHexColor` 0.88; dzēstajiem `#ef4444`); statusa pogai atsevišķi blāvs fons; zem statusa `RelativeTime` un, ja ir čeklista punkti, zaļa progresa josla; jaunam uzdevumam `statusChangedAt` = izveides laiks; `reorderable={false}` (Sākums) slēpj kārtību, bet statusu joprojām var vilkt
- Vilkšana: `app/components/task-drop-line.tsx` (`TaskDropLine`, `dropHintFromEvent`, `frozenSortingStrategy`, `groupedStatusCollisionDetection`). Vilkšanas laikā saraksts neslīd; drop ir bieza zila līnija. Starp statusu grupām vilkšana **tikai maina statusu**, nesamaina vietām ar cita grupas pēdējo uzdevumu
- Kopsavilkums (`ListSummary` Sākumā un `/lists`): sadalītie uzdevumi un apakšuzdevumi pēc `statusesByPriorityDesc` / `compareTasksByStatusPriority` (`app/lib/list-statuses.ts`) - pretēji picker (slēgts → aktīvs → nav sākts). Slēgtie paliek ārpus aktīvā saraksta
- Projekta **Saraksts** logs: uzdevumu kartītes `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))` tādā pašā statusa secībā. Mape rāda nested uzdevumus un to apakšuzdevumus (`OverviewSubtaskList`); grupēšana pēc statusa; aplītis hover rāda check + tooltip `status.complete_ask` (pabeidz / atver atpakaļ); arhīva poga kartītē parāda pabeigtos, progresa josla paliek. Klikšķis uz apakšuzdevuma atver `SubtaskDetailModal` uz vietas. Apakšuzdevuma aplītis un nosaukums ir statusa krāsā. Logs **Uzdevumi** paliek vilktā `sortOrder` secībā

## Sarakstu pieejas

`app/lib/list-access.ts` — līmeņi `full_edit` | `edit` | `comment` | `view`. Noklusējums jaunam un esošam sarakstam: **`full_edit`**. Īpašnieks, `is_admin` un izveidotājs vienmēr `full_edit`.

| Līmenis | UI | RLS (`work_list_has_access`) |
|---|---|---|
| `full_edit` | Veidot uzdevumus, labot iestatījumus, dzēst sarakstu | task INSERT, list DELETE, list_files INSERT |
| `edit` | Labot uzdevumus un saraksta iestatījumus | list UPDATE, task DELETE, faili/assignees |
| `comment` | Komentēt; izpildītājs var mainīt statusu | task UPDATE, `task_activities` `kind=comment` |
| `view` | Tikai lasīšana | SELECT caur `can_view_work_list` |

Prioritāte: biedra rinda (`work_list_viewers.access_level`) → lomas rinda (`work_list_viewer_roles`) → `work_lists.default_access_level`. Privātam sarakstam bez rindas pieeja ir `null` (neredz). Publiskam sarakstam lomu rindas ir līmeņa override. UI: `resolveListAccessLevel` + `listAccessCapabilities` (pēc tam tiek apvienots ar komandas lomu pieejām caur `resolveEffectiveListAccess`, kas papildus ANDo ar `team` sadaļu redzamību (`nav.lists`) un darbībām (`lists.edit`, `lists.delete`, `tasks.manage`)). Bez lomu slēdža lomu rindas nesaglabā (visi manto noklusējumu).

## Statusa kontrole

`app/components/status-control.tsx` — vienots `WorkTaskStatus` redaktors tabulā un apakšuzdevuma modālī.

- Krāsas un nosaukumi no `useTaskStatuses(listId)`: sistēmas `task_statuses` plus šī saraksta `list_statuses`. Bez `listId` (Sākums) saplūdina visus sarakstu statusus etiķetēm. `useSystemTaskStatuses()` ir tikai katalogs.
- Fallback `todo` pelēks, `in_progress` oranžs, `done` zaļš
- Slēgtās grupas statusiem (`done` u.c.) poga ir **blāva**: `fadeHexColor` sajauc krāsu ar baltu, teksts paliek statusa krāsā
- Dzēstajiem (`deletedAt`) etiķete `status.deleted`, krāsa `#ef4444` ar to pašu blāvo fonu; Check poga `bg-red-100 text-red-600`
- Koka / Saraksta loga aplītis: `statusDotClassName` (fons + apmale tās pašas); teksts: `statusTextClassName`
- Picker portal `z-80`, `data-app-modal-ignore-backdrop`; ESC aizver tikai picker
- Nākamais statuss: `nextStatusId` pēc kataloga `sort_order` (ne tikai todo → in_progress → done)
- Sākuma / saraksta kopsavilkuma grupēšana ir **pretēja** picker: `statusesByPriorityDesc` (piem. IZM → IN PROGRESS → TO DO). Picker paliek Nav sākts → Aktīvs → Slēgts
- `work_tasks.status` ir brīvs teksts pēc `025_work_tasks_catalog_status.sql` (noņemts check tikai uz todo / in_progress / done)
- Tabulā `revealActionsOnHover`: bez hover tikai statusa nosaukums; hover (vai atvērts picker / pārvietošana) rāda `>` un trailing pogas, vieta rezervēta, bez animācijas
- Zem pogas `RelativeTime` (`app/components/relative-time.tsx`, `getLastOnlineDisplay`); tooltipā precīzais `dd.mm.yy hh:mm`
- Ja apakšuzdevumam ir čeklista punkti (`work_tasks.checklists`), zem statusa pogas zaļa progresa josla (`checklistProgress`). Slēgtās grupas statusus un Pabeigt bloķē, kamēr `taskHasIncompleteChecklists`; **aktīvās** (un nav sākts) grupas statusus var mainīt arī ar nepabeigtiem punktiem. `updateTask` noraida slēgto statusu, ja punkti nav izpildīti

Saraksta statusi: `ListStatusesModal` (`app/components/list-statuses-modal.tsx`) no saraksta `...`. Sistēmas statusi ir lasāmi; komanda var pārsaukt sistēmas statusu šai komandai (`team_status_labels`). Komanda pievieno / labo / dzēš / kārto tikai šī saraksta ierakstus (`list_statuses`, ID `lsts-…`). Dzēšot savu statusu, uzdevumi ar to atgriežas uz `todo`. Nav sākts un slēgts paliek singleton grupas. Rakstīšana: `work_list_has_access(list_id, 'edit')`. CRUD: `lists-store` `addListStatus` / `updateListStatus` / `deleteListStatus` / `reorderListStatuses` / `renameSystemStatus`.

## Komanda un pēdējā tiešsaiste

- Biedri: `app/lib/team.ts`, `app/lib/team-store.tsx`, servera darbības `app/lib/team/actions.ts`
- Komandas (`WorkTeam`): `id`, `name`, `initials`, `icon`, `color`, `logoUrl`; CRUD `addTeam` / `updateTeam` / `deleteTeam` / `selectTeam`
- Pieslēgtam lietotājam komandas un biedri nāk no Postgres (`teams`, `team_members`); `currentUser` nāk tikai no sesijas (`getUser()`), dummy biedri (Anna u.c.) netiek rādīti
- UI gaida auth sesiju pirms komandas/sarakstu ielādes; `INITIAL_SESSION` ar `user=null` netiek izmantots kā gatava sesija
- Jauna komanda: izveidotājs kļūst **Īpašnieks** (`OWNER_TEAM_ROLE` / `teams.rank.owner`); rangs zem vārda, komandas nosaukuma un modālī tikai ja ir komanda
- Lomas: `team_roles` (komandai) + `system_default_roles` (admin `/admin/roles`, seed jaunām komandām). Pieejas `TeamPermissionSet` (`nav` + `actions`) — `app/lib/team-permissions.ts`. `nav` kontrolē sadaļu redzamību (dashboard/lists/team/templates/settings), `actions` kontrolē darbības (lists.create/edit/delete, tasks.manage, saraksta statusi/automatizācijas, failu augšupielāde, šabloni, komandas invite/noņemt/dzēst u.c.). Īpašniekam un `is_admin` visas pieejas. UI: `TeamRolesModal` no sānjoslas; katrai lomai saraksta ikona atver `TeamRoleAccessModal` (`TeamPermissionFields` ar divkolonnu izkārtojumu); toggle automātiski saglabā (bez Saglabāt pogas)
- UI: `app/components/team-switcher.tsx`; jauna/labot komanda caur `NameFormModal` (`showLogo` + `showIcons={false}`); bez komandas modālis nav bloķējošs, atveras no pārslēdzēja vai dashboard pogas (`REQUEST_CREATE_TEAM_EVENT`)

### Uzaicinājumi (`044`–`049`)

| Solis | Kas notiek |
|---|---|
| Uzaicināt (`inviteTeamMemberAction`) | `team_members` rinda ar `user_id = null`, `team_invitations` `pending`, unikāls `token` |
| Jaunam e-pastam | Supabase `inviteUserByEmail` (nepieciešams `SUPABASE_SERVICE_ROLE_KEY` serverī) |
| Reģistrētam lietotājam | In-app `team_invite` paziņojums (`target_user_id`); e-pasts mēģina OTP magic link — ne obligāts |
| Apstiprināt | Paziņojumos, `/invite/{token}` vai RPC `accept_team_invitation` → `user_id` tiek iestatīts |
| Noraidīt | Paziņojumos vai `/invite/{token}` → RPC `reject_team_invitation`; pending `team_members` rinda dzēsta; uzaicinātājam `team_invite_rejected` |
| Pending UI | `/team` un `/team/[id]`: resend, kopēt linku, noņemt; sānjoslā tikai apstiprinātie (`confirmedTeamMembers`) |

**Explicit accept:** kamēr uzaicinājums ir `pending`, `users_link_team_members` **nepiesaista** biedru pēc e-pasta; nav auto-accept trigera. Lietotājs redz komandas datus tikai pēc apstiprinājuma (`is_team_member` prasa `user_id = auth.uid()`).

**Pamest komandu:** apstiprināts biedrs (ne īpašnieks) var pats aiziet — `removeTeamMemberAction` self-leave, UI `TeamLeaveSection` (`/team`, `/settings/profile`).

**E-pasts:** jaunam lietotājam bez service role uzaicinājums netiek izveidots; reģistrētam e-pasta kļūda neatceļ uzaicinājumu (paliek in-app). Supabase built-in e-pastam ir zems rate limits — fallback: kopēt `/invite/{token}` linku.

- Attēlojums: `app/components/member-last-online.tsx`, loģika `app/lib/last-online.ts`

| Intervāls | Attēlojums |
|---|---|
| ≤ 1 min | zaļš aplītis |
| < 60 min | `{n} min` |
| ≥ 60 min | `{n} h` |
| ≥ 24 h | `{n} d` |
| ≥ 30 dienas | `{n} m` |

Aktīvais lietotājs atjauno `lastOnlineAt` ik pēc 20 s (`touchMemberOnline(teamId, userId, at)`), kamēr lapa ir atvērta un biedrs ir saistīts ar `user_id`. Admin lietotāju tabulā tas pats avots (`team_members.last_online_at`, ne `last_sign_in_at`); aktuālajam adminam rāda dzīvo `useTeam()` vērtību.

## Project structure

```
app/
  layout.tsx                      # Root: i18n, toast, cookie consent, favicon `<head>`, title template
  (marketing)/
    page.tsx                      # Landing; ielogotam redirect /dashboard
    login/ signup/ forgot-password/
    invite/[token]/               # Komandas uzaicinājuma landing (accept/reject)
    privacy/ terms/ cookies/
  (app)/
    layout.tsx                    # AppProviders + sānjosla
    dashboard/page.tsx            # Sākums: Mani uzdevumi + saraksti
    lists/                        # Kopsavilkums, 3 logi, uzdevums, fails
    team/ settings/ projects/ templates/
    admin/                        # users, teams, roles, statuses, file-types, languages, …

  globals.css                     # Zinc light theme; `--radius-*` uz pusi
  components/
    site-header.tsx               # Publiskā galvene; sistēmas logo/iniciāļi; ielogotam Atvērt lietotni
    site-footer.tsx               # Publiskā kājene
    landing-page.tsx              # Landing saturs
    landing-app-preview.tsx       # Hero dashboard vizuālis
    login-form.tsx                # Ienākt + Google + Atcerēties mani
    signup-form.tsx               # Reģistrēties + Google + Atcerēties mani
    google-auth-button.tsx        # Turpināt ar Google
    remember-me-checkbox.tsx      # Atcerēties mani (30 dienas)
    forgot-password-form.tsx      # Aizmirsi paroli
    legal-document-view.tsx       # Legal lapas + fiksēta satura TOC
    cookie-consent-provider.tsx   # Piekrišanas stāvoklis
    cookie-consent-dialog.tsx     # Popup un iestatījumi
    app-nav.tsx                   # Sānjosla
    user-menu.tsx                 # Lietotāja drop-up: personīgā info, uzstādījumi, paziņojumu prefs, parole, iziet
    personal-info-modal.tsx       # Vārda un uzvārda rediģēšana
    notification-settings-modal.tsx # In-app paziņojumu veidu slēdži (grupēts, auto-save)
    change-password-modal.tsx     # Paroles maiņa (email login)
    profile-settings-view.tsx     # /settings/profile: profils + display preferences
    nav-tree-dnd.tsx              # Koka DnD: mapē / ārā / zem pēdējā, drop līnija
    work-item-archive-button.tsx  # Arhivēt / noņemt no arhīva (mapes ikona)
    list-statuses-modal.tsx       # Saraksta Statusi (sistēma + komandas)
    list-automations-modal.tsx    # Saraksta automatizācijas (mapes izveide → šablons)
    team-switcher.tsx             # Komandas pārslēdzējs, CRUD
    team-invite-modal.tsx         # Uzaicināt biedru (e-pasts, loma)
    team-member-page.tsx          # Biedra profils; pending: resend/link/remove; leave
    team-leave-section.tsx        # Pamest komandu (profils, biedra lapa)
    app-shell.tsx                 # Layout ar sānjoslu
    dashboard-home-page.tsx       # Sākums: Mani uzdevumi (ja ir) + saraksti
    lists-overview-page.tsx       # Saraksta kopsavilkums
    list-detail-page.tsx          # Saraksta kopsavilkums + arhīva skats
    list-form-modal.tsx           # Jauns/labot sarakstu + pieejas
    list-summary.tsx              # Uzdevumu kartītes ar statusu grupām + arhīva ikona
    list-windows-board.tsx        # Uzdevumi | Faili + Saraksts, DnD, mapes čeks
    templates-page.tsx            # Komandas šablonu saraksts
    template-detail-page.tsx      # Šablona nosaukums + apraksts + Saglabāt
    template-tree-editor.tsx      # Šablona koks: mapes/uzdevumi/apakšuzdevumi, DnD, tukšās rindas
    parent-create-flow.tsx        # Mapes/saraksta +: mape, uzdevums, šablons, fails
    task-detail-page.tsx          # Apakšuzdevumu tabula
    grouped-subtask-tables.tsx    # Viena tabula ar statusu grupām
    subtask-table.tsx             # Tabula, DateCell, AssigneeCell portal, arhīvs, rindas fons
    task-drop-line.tsx            # Zila drop līnija, frozen sort, grupu collision
    move-subtask-modal.tsx        # Apakšuzdevuma pārvietošana pie cita uzdevuma
    subtask-detail-modal.tsx      # Apakšuzdevuma modālis
    task-checklists.tsx           # Check List pirms pielikumiem
    status-control.tsx            # Statusa poga, picker, čeklista josla
    relative-time.tsx             # Relatīvais laiks (min / h / d / m)
    loading-state.tsx             # Ielādes spinneris lapās, kokā un modāļos
    team-roles-modal.tsx          # Komandas lomu saraksts
    team-role-access-modal.tsx    # Pieejas pašai lomai
    team-permission-fields.tsx    # Nav + actions slēdži
    admin-roles-manager.tsx       # Sistēmas noklusējuma lomas
    admin-statuses-manager.tsx    # Uzdevumu statusu katalogs
    admin-file-types-manager.tsx  # Failu paplašinājumu CRUD
    task-attachments.tsx          # Pielikumu drop zona, kartītes, ... izvēlne
    file-icon.tsx                 # Faila ikona + krāsa no kataloga
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
    admin-settings-form.tsx       # Sistēmas uzstādījumi + logo/favicon
    branding-image-field.tsx      # Logo/favicon drop zona
    language-switcher.tsx         # Valodas pārslēdzējs (lv / en / ru)
    notifications-menu.tsx        # Paziņojumu panelis
    list-badge.tsx                # Saraksta ikona / iniciāļi / logotips
    member-last-online.tsx        # Tiešsaistes zīme
    team-todo-board.tsx           # Komandas kanban (nav Sākuma lapa)
  lib/
    consent/cookie-consent.ts     # Piekrišanas modelis
    document-title.ts             # Pārlūka cilnes formāts `lapa | sistēma`
    document-title-server.ts      # DB nosaukumi dinamiskajam generateMetadata
    page-metadata.ts              # translatedPageMetadata / resolvedPageMetadata helperi
    legal/documents.ts            # Privacy / terms / cookies teksti
    lists.ts                      # Sarakstu/uzdevumu tipi, krāsas
    task-checklists.ts            # Čeklistu tipi, progress, incomplete helper
    list-statuses.ts              # Saraksta statusu tipi un kataloga merge
    list-automations.ts           # Automatizāciju tipi, mapRow, activeFolderCreatedTemplateAutomations
    task-date-display.ts          # Sākuma/termiņa relatīvais hints pēc statusa grupas (DateCell)
    nav-tree-move.ts              # Koka drop: mape / ārā / secība / grupas beigas
    list-access.ts                # Saraksta pieeju līmeņi un resolve
    lists-store.tsx               # Saraksti un uzdevumi no Postgres; applyTemplate; listAutomations CRUD; insert rinda
    templates.ts                  # Šablonu tipi, sanitize / prepare editor, koka helperi
    template-tree-move.ts         # Šablona DnD placement (mape / secība / apakšuzdevums)
    templates-store.tsx           # Komandas šabloni no Postgres
    list-windows.ts               # Logu kārtība (preferences cookie)
    list-files.ts                 # Saraksta faili kokā; persist DB; size helpers
    file-types.ts                 # Atļautie paplašinājumi, MIME, ikona, krāsa
    file-types-context.tsx        # Katalogs klientam (accept, validācija)
    task-activity.ts              # Vēstures tipi un apakšuzdevumu pielikumi
    build-task-activity-events.ts # Diff → TaskActivity[] (statuss, datumi, assignees, checklist, …)
    format-task-activity-text.ts  # Vēstures ierakstu teksts UI (lv/en/ru caur t())
    team.ts                       # Biedru, lomu un WorkTeam tipi; canLeaveTeam, canInvite…
    team-store.tsx                # Komandas, biedri un lomas no Postgres
    team/actions.ts               # invite / accept / reject / resend / remove / leave
    team/send-invite-email.ts     # Supabase invite + OTP fallback
    team-permissions.ts           # Nav + actions pieeju modelis
    last-online.ts                # min / h / d / m
    task-statuses.tsx             # Statusu katalogs + saraksta merge
    notifications.ts              # Paziņojumu tipi un appendNotifications
    notification-preferences.ts   # Lietotāja preference kinds un defaults
    task-notifications.ts         # Kam sūtīt paziņojumus par uzdevumu notikumiem
    use-notifications.ts          # Paziņojumi no Postgres
    team-todo.ts                  # Todo tipi
    db/work-data.ts               # Komandas darba datu CRUD; atbildīgie pēc kārtas + upsert
    db/import-local-work.ts       # Vienreizējs localStorage → DB imports
    clear-legacy-demo-storage.ts  # Veco dummy localStorage atslēgu tīrīšana
    format-display-date.ts        # datums/laiks pēc display preferences
    site-admin/display-preferences.ts # tipi, merge (lietotājs > sistēma)
    site-admin/branding.ts        # logo/favicon data URL, iniciāļu favicon SVG
    i18n/messages.ts              # lv + en teksti
    i18n/messages-ru.ts           # ru teksti
    i18n/                          # language, server overlay no site_translations
    site-admin/                   # Admin CRUD repository, tipi
    supabase/                     # env, browser/server/admin klienti, session refresh
    auth/                         # Google OAuth, remember-session (30 dienas), getCurrentUser
    users/ensure-profile.ts       # public.users rinda pēc OAuth
    users/display-name.ts         # vārda sadalījums/apvienošana (first + last → name)
    users/display-preferences.ts  # efektīvās UI datumu preferences
    users/actions.ts              # personīgā info + display preferences server actions
    users/require-admin.ts        # /admin servera pārbaude
    users/use-is-admin.tsx        # is_admin RPC + profils klientā
    security/safe-redirect-path.ts
app/auth/callback/route.ts        # OAuth code → session; Set-Cookie uz redirect
proxy.ts                          # Sesijas refresh + ielogota novirzīšana no / un /login
scripts/                          # audit-check.mjs, apply-migrations.mjs, test-supabase.mjs
supabase/migrations/              # 001–050: shēma, admin, work data, uzaicinājumi, …
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
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` (secret) — **obligāts** jaunu e-pastu uzaicinājumiem; reģistrētam lietotājam pietiek ar in-app paziņojumu |
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

Aplikācijas callback: `/auth/callback` (`app/auth/callback/route.ts`). `redirectTo` ņem `window.location.origin`. Pēc Google pieslēgšanās `ensure_user_profile` izveido `public.users` rindu. Pirmais reģistrētais saņem `is_admin = true`, pārējie `false`. Sesijas sīkdatnes ir **obligātās** (ePrivacy izņēmums autentifikācijai). **Atcerēties mani** (noklusējums) glabā sesiju **30 dienas**; bez ķeksīša sesija dzēšas, aizverot pārlūku. Ielogotam lietotājam `/`, `/login` un `/signup` ved uz `/dashboard`.

## Dati

Darba dati dzīvo **Postgres**, ne pārlūkā un ne sīkdatnēs. Komandas biedri redz kopīgos sarakstus, mapes, uzdevumus un apakšuzdevumus. CRUD: `app/lib/db/work-data.ts`; ielāde `fetchTeamWorkspace`. Vecie `localStorage` dati (ja tādi bija pirms `005`) vienreiz tiek importēti ar `importLocalWorkIfNeeded` (karogs `routine-app-db-import-v1:{userId}`).

`public.users` ir konta profils + `is_admin` + `language_code` + nullable display preferences (`week_start_day`, `date_format`, `date_separator`, `time_format`; `null` = sistēmas noklusējums no `site_settings`). Vārds glabājas vienā `name` kolonnā; lietotājs to maina ar **Personīgā informācija** modāli (`PersonalInfoModal` → `saveUserPersonalInfoAction` → RPC `set_current_user_name`, kas atjaunina arī visus `team_members` ar `user_id = auth.uid()`; pēc tam `auth.updateUser` ar `given_name` / `family_name`). Komandas biedra loma ir `team_members.role` / `role_id` (katalogs `team_roles`). Uzaicināts biedrs sākumā ir bez `user_id` un paliek ārpus komandas datiem, kamēr neapstiprina uzaicinājumu (paziņojumos vai `/invite/{token}`). Esošam reģistrētam lietotājam nosūta in-app `team_invite` paziņojumu; automātiska piesaiste pēc e-pasta (`users_link_team_members`) netiek veikta, kamēr uzaicinājums ir `pending`.

RLS (`005_work_data.sql`): `authenticated` drīkst SELECT/INSERT/UPDATE/DELETE tikai savas komandas rindās (`is_team_member`); komandas dzēšana / biedru uzaicināšana - `is_team_owner`. Saraksta satura rakstīšanu sašaurina `work_list_has_access` (`022`). `anon` policy ir deny.

| Tabula | Saturs |
|---|---|
| `teams` | Komandas (`team-…`) |
| `team_members` | Biedri; apstiprinātam `user_id = auth.uid()`; pending uzaicinājumam `user_id` null |
| `team_invitations` | Uzaicinājumi (`pending` / `accepted` / `rejected`), `token`, `invited_user_id` |
| `team_roles` | Komandas lomas un `permissions` JSON |
| `system_default_roles` | Admin noklusējuma lomas jaunām komandām |
| `task_statuses` | Uzdevumu statusu katalogs (nosaukumi, krāsa, grupa) |
| `file_type_extensions` | Atļautie failu tipi (paplašinājums, MIME, ikona, krāsa); SELECT authenticated, raksta `is_admin` |
| `site_settings` | Sistēmas nosaukums, slogans, `logo_url` / `favicon_url` (data URL), `logo_color`, datumu/laika noklusējums (`week_start_day`, `date_format`, `date_separator`, `time_format`) |
| `list_statuses` | Komandas statusi vienam sarakstam (`lsts-…`) |
| `team_status_labels` | Komandas overlay sistēmas statusu nosaukumiem |
| `work_lists` | Saraksti (`kind`, `is_private`, `default_access_level`, `created_by`) |
| `work_list_viewers` | Privāta saraksta biedri + `access_level` |
| `work_list_viewer_roles` | Saraksta lomu pieeja + `access_level` |
| `work_tasks` | Mapes, uzdevumi, apakšuzdevumi (`kind` + `parent_id` + `deleted_at` + `archived_at`; `status` = kataloga ID; `checklists` JSONB) |
| `work_templates` | Komandas šabloni (`tmpl-…`) |
| `work_template_items` | Šablona koks: mape / uzdevums / apakšuzdevums (`tpli-…`, `040`) |
| `work_list_automations` | Saraksta automatizācijas (`lauto-…`): trigger (`folder_created`), action (`apply_template`), `template_id`, `enabled` (`041`) |
| `task_assignees` | Uzdevuma atbildīgie (`member_id`); `replaceTaskAssignees` serializē pēc `task_id`, `upsert` ignorē dublikātus |
| `task_activities` | Apakšuzdevumu vēsture (`kind`: izveide, statuss, assignee_added/removed, datumi, title, description, checklist, moved, hidden, restored, faili, reordered, comment); diff lauki `from_date_value`, `from_parent_id`, `previous_text`, `metadata` jsonb (`051`–`052`) |
| `task_files` | Apakšuzdevumu pielikumi + saturs |
| `list_files` | Saraksta faili kokā + saturs |
| `app_notifications` | In-app paziņojumi (`assigned`, `unassigned`, `comment`, `file`, `status_changed`, `task_updated`, `due`, `team_invite`, `team_invite_rejected`); `recipient_id` mērķa biedrs; uzaicinājumam `target_user_id`, `invitation_id` (`054`) |
| `user_notification_preferences` | Lietotāja in-app paziņojumu slēdži (`user_id`, `kind`, `enabled`; trūkstoša rinda = ieslēgts) (`053`) |
| `team_todos` | Komandas kanban (`TeamTodoBoard`), nav Sākuma lapa |

localStorage paliek tikai UI preferencei:

| Atslēga | Saturs |
|---|---|
| `routine-app-current-team-id` | Aktīvā komanda (`:userId`) |
| `routine-app-nav-trees` | Sānjoslas sakļaušanas stāvoklis |

Cookie `routine-app-cookie-consent` saglabā sīkdatņu piekrišanu (180 dienas). Cookie `routine-app-remember-session` (`1`/`0`) ir obligātā: vai Atcerēties mani ir ieslēgts. Supabase auth sīkdatnes paliek 30 dienas, ja `1`; bez tā - sesijas sīkdatnes. Cookie `routine-app-list-window-order` saglabā 3 logu kārtību katrā sarakstā, ja atļautas preferenču sīkdatnes. Cookie `routine-app-language` + `routine-app-language-chosen` saglabā viesu apzināto UI valodu; bez `chosen` rāda sistēmas noklusējumu, pēc ielogošanās izvēle nonāk `users.language_code`.

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
- Papildu automatizācijas (uzdevuma izveide, statusa maiņa, termiņi)
- Atkārtojami rutīnas uzdevumi
