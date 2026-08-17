# Routine - izstrādātāja dokumentācija

## Tech stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Geist, Font Awesome
- `@dnd-kit` drag-and-drop
- Ports: **3120**
- i18n: `t(key, fallback, params)` no `app/lib/i18n/messages.ts` (lv + en)
- Datumi UI: `formatDisplayDateDdMmYy()` → `dd.mm.yy`

## Sānjosla

`app/components/app-nav.tsx` — fiksēta kreisā josla. Galvenē `TeamSwitcher`: kreisajā komandas nosaukums, labajā avatārs (iniciāļi / logotips). Hover uz avatāra rāda komandas nosaukuma tooltip; klikšķis atver komandu sarakstu un **Pievienot jaunu komandu**. Hover uz rindas rāda `...` (Labot / Dzēst) pirms ķeksīša; pēdējo komandu dzēst nevar.

| Rinda | Saturs |
|---|---|
| Sākums | `/dashboard` komandas todo board |
| Saraksts | `/lists` visu uzdevumu kopsavilkums; chevron izver koku |
| Saraksts (bērns) | `/lists/[listId]` projekta 3 logi (Projekti, Klienti) |
| Uzdevums | `/lists/[listId]/tasks/[taskId]` apakšuzdevumu tabula; ikona `fas fa-list-check` |
| Komanda | `/team` biedri ar pēdējo tiešsaistes zīmi |
| Uzstādījumi | `/settings` |
| Lietotājs | avatars, parole, iziet (ved uz `/`) |

Koks: **Saraksts → mape (`kind: "folder"`) vai uzdevumu saraksts (`kind: "task"`) vai fails**. Apakšuzdevumi (`kind: "subtask"`) sānjoslā nav; tos rāda uzdevuma tabulā.

Uzvedība:

- **Saraksts** nosaukums atver kopsavilkumu; chevron tikai izver koku.
- Saraksta rindā rāda ikonu vai iniciāļus ar krāsu; hover laikā ikonas vietā ir sakļaušanas bultiņa.
- Uzdevuma rindā `fas fa-list-check`; hover laikā ikonas vietā chevron.
- Saraksta `+` atver izveides formu. Mapes `+` — mape, uzdevumu saraksts vai faila augšupielāde. Uzdevuma `+` atver apakšuzdevuma modāli.
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

Auth pagaidām ir frontend: pēc Ienākt / Reģistrēties rāda toast un atver `/dashboard`. Backend nav pieslēgts. Iziet ved uz `/`.

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
| Saraksts | `/lists` | `ListsOverviewPage` — kartītes ar uzdevumiem un apakšuzdevumiem, grupēti pēc statusa |
| Projekts (saraksts) | `/lists/[listId]` | `ListWindowsBoard` — logi Uzdevumi, Faili, Saraksts; kārtība cookie `routine-app-list-window-order` |
| Uzdevums | `/lists/[listId]/tasks/[taskId]` | `SubtaskTable` — nosaukums, atbildīgais, sākums, termiņš, statuss |
| Fails | `/lists/[listId]/files/[fileId]` | `FileDetailPage` — priekšskatījums, lejupielāde, pārsaukšana, dzēšana |
| Apakšuzdevums | tas pats uzdevuma ceļš + modālis | `SubtaskDetailModal` — lauki kreisajā, vēsture labajā |

Ceļa josla: `app/components/page-breadcrumb.tsx`. Labajā malā `NotificationsMenu` (zvaniņš).

## Paziņojumi

`app/components/notifications-menu.tsx` — satura joslas zvaniņš atver paneli.

- Nerakstīto skaits uz zvana; **Atzīmēt visus kā lasītus**
- Klikšķis uz ieraksta atzīmē kā lasītu un atver `href` (uzdevums)
- Demo seed: piešķirts, komentārs, termiņš, fails; tipi `app/lib/notifications.ts`
- Stāvoklis: `app/lib/use-notifications.ts`, `localStorage` atslēga `routine-app-notifications`

## Apakšuzdevuma modālis

`app/components/subtask-detail-modal.tsx` + `AppModal` (`dirty`, saglabāšana tikai pēc izmaiņām). `headerMeta` rāda `izveidots {date}` no aktivitātes `kind === "created"` (`formatDisplayDateDdMmYy`); jaunam nesaglabātam apakšuzdevumam datums nav.

| Lauks | Uzvedība |
|---|---|
| Nosaukums | Trekns, lielāks teksts, bez rāmja un fona |
| Apraksts | Piezīmes; atsevišķa komentāra zona nav |
| Sākums / Termiņš | `DateCell` — klikšķis atver pārlūka datuma izvēli (`showPicker`) |
| Statuss | `StatusControl` — krāsaina poga (STATUSS + `fa-angle-right` nākamajam; pelēks `fa-check` uz Gatavs); klikšķis uz nosaukuma atver picker (meklēšana, grupas Nav sākts / Aktīvs / Slēgts) |
| Projekts, atbildīgie | Saraksta badge, `AssigneeCell` |
| Pielikumi | `TaskAttachments` — drag-and-drop vai **pārlūko**; kartītes ar priekšskatījumu |
| Faila `...` | `CreateItemMenu`: Apskatīt, Pārsaukt, Dzēst. Klikšķis uz kartītes arī atver apskati. Izvēlne ar `data-app-modal-ignore-backdrop`, lai neaizvērtu apakšuzdevuma modāli |
| Dzēst failu | Tikai `ConfirmModal` (`files.delete.*`) |
| Pārsaukt failu | `NameFormModal` (`files.edit.*`) |
| Apskatīt failu | `FilePreview` ligzdotā `AppModal` |
| Vēsture | Labā kolonna, `taskActivities` |

Failu metadati: `TaskFile` (`id`, `taskId`, `name`, `mimeType`, `size`, `hasContent`, `createdAt`). Saturs `localStorage` ar prefiksu `routine-app-task-file-content:` (līdz `MAX_STORED_FILE_BYTES`, 1.5 MB), gatavs backendam.

## Saraksti un uzdevumi

Hierarhija: **Saraksts → mape / uzdevumu saraksts / fails → apakšuzdevumi tikai zem uzdevumu saraksta**.

- Tipi un seed: `app/lib/lists.ts` (`WorkTaskKind`: `folder` \| `task` \| `subtask`)
- Stāvoklis: `app/lib/lists-store.tsx`
- Saraksta faili kokā: `app/lib/list-files.ts`
- Jauna saraksta formā var izvēlēties ikonu un fona krāsu; bez ikonas rāda iniciāļus. `NameFormModal` ar `showAppearance`; komandai `showLogo` + `showIcons={false}` (tikai krāsas + logotips)

## Statusa kontrole

`app/components/status-control.tsx` — vienots `WorkTaskStatus` redaktors tabulā un apakšuzdevuma modālī.

- Krāsas: `todo` `bg-zinc-400`, `in_progress` `bg-orange-500`, `done` `bg-emerald-500` (balts teksts)
- Picker portal `z-80`, `data-app-modal-ignore-backdrop`; ESC aizver tikai picker
- Nākamais statuss: todo → in_progress → done

## Komanda un pēdējā tiešsaiste

- Biedri: `app/lib/team.ts`, `app/lib/team-store.tsx`
- Komandas (`WorkTeam`): `id`, `name`, `initials`, `icon`, `color`, `logoUrl`; CRUD `addTeam` / `updateTeam` / `deleteTeam` / `selectTeam`
- UI: `app/components/team-switcher.tsx`; jauna/labot komanda caur `NameFormModal`
- Attēlojums: `app/components/member-last-online.tsx`, loģika `app/lib/last-online.ts`

| Intervāls | Attēlojums |
|---|---|
| ≤ 1 min | zaļš aplītis |
| < 60 min | `{n} min` |
| ≥ 60 min | `{n} h` |
| ≥ 24 h | `{n} d` |
| ≥ 30 dienas | `{n} m` |

Aktīvais lietotājs atjauno `lastOnlineAt` ik pēc 20 s, kamēr lapa ir atvērta.

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
  globals.css                     # Zinc light theme; `--radius-*` uz pusi
  components/
    site-header.tsx               # Publiskā galvene
    site-footer.tsx               # Publiskā kājene
    landing-page.tsx              # Landing saturs
    landing-app-preview.tsx       # Hero dashboard vizuālis
    login-form.tsx                # Ienākt
    signup-form.tsx               # Reģistrēties
    forgot-password-form.tsx      # Aizmirsi paroli
    legal-document-view.tsx       # Legal lapas + fiksēta satura TOC
    cookie-consent-provider.tsx   # Piekrišanas stāvoklis
    cookie-consent-dialog.tsx     # Popup un iestatījumi
    app-nav.tsx                   # Sānjosla
    team-switcher.tsx             # Komandas pārslēdzējs, CRUD
    app-shell.tsx                 # Layout ar sānjoslu
    lists-overview-page.tsx       # Saraksta kopsavilkums
    list-summary.tsx              # Uzdevumu kartītes ar statusu grupām
    list-windows-board.tsx        # 3 logi ar DnD
    task-detail-page.tsx          # Apakšuzdevumu tabula
    subtask-table.tsx             # Tabula un DateCell
    subtask-detail-modal.tsx      # Apakšuzdevuma modālis
    status-control.tsx            # Statusa poga un picker
    task-attachments.tsx          # Pielikumu drop zona, kartītes, ... izvēlne
    file-preview.tsx              # Faila priekšskatījums
    create-item-menu.tsx          # Darbību izvēlne
    confirm-modal.tsx             # Dzēšanas apstiprinājums
    name-form-modal.tsx           # Nosaukums, izskats, logotips
    list-appearance-picker.tsx    # Ikona / krāsa (showIcons)
    file-detail-page.tsx          # Saraksta faila skats
    page-breadcrumb.tsx           # Ceļa josla + paziņojumu zvaniņš
    notifications-menu.tsx        # Paziņojumu panelis
    list-badge.tsx                # Saraksta ikona / iniciāļi / logotips
    member-last-online.tsx        # Tiešsaistes zīme
    team-todo-board.tsx           # Dashboard board
  lib/
    consent/cookie-consent.ts     # Piekrišanas modelis
    legal/documents.ts            # Privacy / terms / cookies teksti
    lists.ts                      # Sarakstu/uzdevumu tipi, krāsas, seed
    lists-store.tsx               # Sarakstu localStorage
    list-windows.ts               # Logu kārtība (preferences cookie)
    list-files.ts                 # Saraksta faili kokā un saturs
    task-activity.ts              # Vēsture un apakšuzdevumu pielikumi
    team.ts                       # Biedru un WorkTeam tipi, seed
    team-store.tsx                # Komandas un biedru localStorage
    last-online.ts                # min / h / d / m
    notifications.ts              # Paziņojumu tipi un seed
    use-notifications.ts          # Paziņojumu localStorage
    team-todo.ts                  # Todo tipi un seed
    format-display-date.ts        # dd.mm.yy
    i18n/messages.ts              # lv + en teksti
scripts/                          # audit-check.mjs, apply-migrations.mjs, test-supabase.mjs
supabase/migrations/              # 001_schema.sql
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
| **Security smoke** | `.github/workflows/security-smoke.yml` | TypeScript, lint, production build, `requireAuth` uz `actions.ts` (kad būs), nav `eval()`, drošības galvenes |

> `GITLEAKS_LICENSE` repo secret ir vajadzīgs tikai **organization** kontiem. Šis repo pieder individuālam kontam, tāpēc scan strādā arī privātam repo bez licences.

`.gitleaks.toml` paplašina noklusējuma noteikumus (`useDefault = true`) un pievieno i18n atslēgu allowlist, lai `generic-api-key` nesajauktu `legal.privacy.retention.p1` ar credential. Lokāli:

```bash
gitleaks detect --redact -v --exit-code=2 --log-opts=-1
```

`npm run audit:check` (`scripts/audit-check.mjs`) krīt pie katra HIGH/CRITICAL advisory, izņemot `ACCEPTED_ADVISORIES`. Tranzitīvās atkarības pinotas caur `overrides` (`postcss`, `sharp`, `uuid`, `js-yaml`, `nanoid`, `brace-expansion`).

Pilns audits: **`security-check.md`** (pašreiz **6.5 / 10**, pārbaude v0.1.0).

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

Lietotne vēl lasa datus no `localStorage`. Migrācija `001_schema.sql` ir sagatavota; `db:test` apstiprina API projektu, bet Postgres pieprasa pareizu datubāzes paroli (ne `anon` atslēgu).

## Dati

Pirmajā versijā lietotnes dati glabājas `localStorage`. Datubāze un īstā autentifikācija nav pieslēgtas.

| Atslēga | Saturs |
|---|---|
| `routine-app-work-lists` | Saraksti |
| `routine-app-work-tasks-v3` | Uzdevumi un apakšuzdevumi (`kind`) |
| `routine-app-task-activity` | Apakšuzdevumu vēsture |
| `routine-app-task-files` | Apakšuzdevumu pielikumu metadati |
| `routine-app-task-file-content:{id}` | Pielikuma saturs (data URL) |
| `routine-app-list-files` | Saraksta faili kokā |
| `routine-app-team-members` | Komandas biedri |
| `routine-app-teams` | Komandu saraksts (`WorkTeam`) |
| `routine-app-current-team-id` | Aktīvā komanda |
| `routine-app-notifications` | Paziņojumi (lasīts/nelasīts) |
| `routine-app-team-todo-list` | Sākuma todo board |
| `routine-app-nav-trees` | Sānjoslas sakļaušanas stāvoklis |

Cookie `routine-app-cookie-consent` saglabā sīkdatņu piekrišanu. Cookie `routine-app-list-window-order` saglabā 3 logu kārtību katrā sarakstā, ja atļautas preferenču sīkdatnes.

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

- Datubāze un īstā autentifikācija (login / signup / parole); env un `db:migrate` jau ir
- Pielikumu, saraksta failu un paziņojumu backend (tagad `localStorage`)
- Pielikumu, saraksta failu un paziņojumu backend (tagad `localStorage`)
- Atkārtojami rutīnas uzdevumi
